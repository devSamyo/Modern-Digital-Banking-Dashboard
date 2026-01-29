from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionOut
from app.schemas.category_rule import TransactionCategoryUpdate
from app.services.category_service import CategoryService

router = APIRouter(tags=["Transactions"])

@router.post(
    "/transactions",
    response_model=TransactionOut,
    status_code=status.HTTP_201_CREATED
)
def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create transaction with AUTO-CATEGORIZATION.
    Category is auto-assigned during transaction creation.
    """
    # Account verification
    account = db.query(Account).filter(
        Account.id == transaction.account_id,
        Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(
            status_code=404,
            detail="Account not found or does not belong to user"
        )
    
    # AUTO-CATEGORIZATION: Assign category during creation
    category = CategoryService.auto_categorize(
        db=db,
        user_id=current_user.id,
        description=transaction.description,
        merchant=transaction.merchant
    )
    
    # Create new transaction
    new_txn = Transaction(
        account_id=transaction.account_id,
        description=transaction.description,
        category=category,  # Auto-assigned category
        amount=transaction.amount,
        currency=transaction.currency,
        txn_type=transaction.txn_type,
        merchant=transaction.merchant
    )
    db.add(new_txn)
    
    # Balance update based on DEBIT/CREDIT
    current_balance = Decimal(str(account.balance))
    txn_amount = Decimal(str(transaction.amount))
    if transaction.txn_type == "debit":
        account.balance = current_balance - txn_amount
    elif transaction.txn_type == "credit":
        account.balance = current_balance + txn_amount
    else:
        raise HTTPException(status_code=400, detail="Invalid transaction type")
    
    db.commit()
    db.refresh(new_txn)
    return new_txn

@router.get(
    "/accounts/{account_id}/transactions",
    response_model=List[TransactionOut]
)
def get_transactions_for_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all transactions for an account"""
    # Account verification
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(
            status_code=404,
            detail="Account not found or does not belong to user"
        )
    
    # Fetch transactions
    transactions = db.query(Transaction).filter(
        Transaction.account_id == account_id
    ).order_by(Transaction.txn_date.desc()).all()
    return transactions

@router.patch(
    "/transactions/{transaction_id}/category",
    response_model=TransactionOut
)
def update_transaction_category(
    transaction_id: int,
    category_update: TransactionCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    API to update transaction category manually.
    Validates that users can only update their own transactions.
    Persists updated category in database.
    """
    # Get transaction
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )
    
    # Validate user owns this transaction
    account = db.query(Account).filter(
        Account.id == transaction.account_id,
        Account.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to update this transaction"
        )
    
    # Update category
    transaction.category = category_update.category
    
    # Persist to database
    db.commit()
    db.refresh(transaction)
    
    return transaction

@router.post(
    "/transactions/{transaction_id}/recategorize",
    response_model=TransactionOut
)
def recategorize_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Call recategorization API - re-run auto-categorization.
    Useful after creating new category rules.
    """
    # Get transaction
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found"
        )
    
    # Validate user owns this transaction
    account = db.query(Account).filter(
        Account.id == transaction.account_id,
        Account.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to update this transaction"
        )
    
    # Re-run auto-categorization
    new_category = CategoryService.auto_categorize(
        db=db,
        user_id=current_user.id,
        description=transaction.description,
        merchant=transaction.merchant
    )
    
    transaction.category = new_category
    
    # Persist to database
    db.commit()
    db.refresh(transaction)
    
    return transaction