from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
from datetime import datetime
import csv
import io
from sqlalchemy import text
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

@router.get(
    "/accounts/{account_id}/transactions/export"
)
def export_transactions_csv(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export transactions as CSV"""
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
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'Date',
        'Description',
        'Merchant',
        'Category',
        'Amount',
        'Currency',
        'Type',
        'Posted Date'
    ])
    
    # Write transactions
    for txn in transactions:
        # Safely format dates
        txn_date_str = txn.txn_date.strftime('%Y-%m-%d %H:%M:%S') if isinstance(txn.txn_date, datetime) else str(txn.txn_date)
        posted_date_str = txn.posted_date.strftime('%Y-%m-%d %H:%M:%S') if txn.posted_date and isinstance(txn.posted_date, datetime) else ''
        
        writer.writerow([
            txn_date_str,
            txn.description,
            txn.merchant or '',
            txn.category,
            str(txn.amount),
            txn.currency,
            txn.txn_type,
            posted_date_str
        ])
    
    # Prepare response
    output.seek(0)
    filename = f"transactions_{account.bank_name}_{datetime.now().strftime('%Y%m%d')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post(
    "/accounts/{account_id}/transactions/import"
)
def import_transactions_csv(
    account_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Import transactions from CSV.
    Expected CSV format:
    Date,Description,Merchant,Amount,Currency,Type
    """
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
    
    # Validate file type
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are allowed"
        )
    
    try:
        # Read CSV file
        contents = file.file.read().decode('utf-8-sig')
        
        # Normalize line endings
        contents = contents.replace('\r\n', '\n').replace('\r', '\n')
        
        # Explicitly use comma delimiter
        csv_reader = csv.DictReader(io.StringIO(contents), delimiter=',')
        
        # Debug: Log the actual headers found
        headers = csv_reader.fieldnames
        print(f"CSV Headers found: {headers}")
        
        # Normalize headers (strip whitespace, handle case)
        if headers:
            # Create a mapping of normalized headers to original headers
            header_mapping = {}
            for h in headers:
                normalized = h.strip().lower()
                header_mapping[normalized] = h
            
            print(f"Normalized headers: {list(header_mapping.keys())}")
        
        imported_count = 0
        skipped_count = 0
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 (after header)
            try:
                # Debug: Log the first row to see what we're getting
                if row_num == 2:
                    print(f"First row data: {row}")
                
                # Validate required fields (case-insensitive)
                required_fields = ['date', 'description', 'amount', 'type']
                row_lower = {k.strip().lower(): v for k, v in row.items()}
                
                missing_fields = [f for f in required_fields if f not in row_lower or not row_lower[f].strip()]
                
                if missing_fields:
                    errors.append(f"Row {row_num}: Missing required fields: {', '.join(missing_fields)}")
                    skipped_count += 1
                    continue
                
                # Parse amount
                try:
                    amount = Decimal(str(row_lower['amount']).strip())
                except Exception as e:
                    errors.append(f"Row {row_num}: Invalid amount '{row_lower.get('amount', '')}' - {str(e)}")
                    skipped_count += 1
                    continue
                
                # Validate transaction type
                txn_type = row_lower['type'].strip().lower()
                if txn_type not in ['debit', 'credit']:
                    errors.append(f"Row {row_num}: Invalid type '{row_lower['type']}'. Must be 'debit' or 'credit'")
                    skipped_count += 1
                    continue
                
                # Parse date
                try:
                    date_str = row_lower['date'].strip()
                    try:
                        txn_date = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                    except:
                        txn_date = datetime.strptime(date_str, '%Y-%m-%d')
                except Exception as e:
                    errors.append(f"Row {row_num}: Invalid date format '{row_lower.get('date', '')}' - {str(e)}")
                    skipped_count += 1
                    continue
                
                # Auto-categorize
                description = row_lower['description'].strip()
                merchant = row_lower.get('merchant', '').strip() or None
                
                category = CategoryService.auto_categorize(
                    db=db,
                    user_id=current_user.id,
                    description=description,
                    merchant=merchant
                )
                
                # Create transaction
                new_txn = Transaction(
                    account_id=account_id,
                    description=description,
                    category=category,
                    amount=amount,
                    currency=row_lower.get('currency', 'INR').strip() or 'INR',
                    txn_type=txn_type,
                    merchant=merchant,
                    txn_date=txn_date
                )
                db.add(new_txn)
                db.flush()
                
                # Update account balance
                current_balance = Decimal(str(account.balance))
                if txn_type == "debit":
                    account.balance = current_balance - amount
                elif txn_type == "credit":
                    account.balance = current_balance + amount
                
                imported_count += 1
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
                skipped_count += 1
                continue
        
        # Commit all transactions
        db.commit()
        
        return {
            "message": "CSV import completed",
            "imported": imported_count,
            "skipped": skipped_count,
            "errors": errors[:10] if errors else [],  # Return first 10 errors only
            "headers_found": headers  # Return headers for debugging
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Failed to process CSV file: {str(e)}"
        )
    finally:
        file.file.close()

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