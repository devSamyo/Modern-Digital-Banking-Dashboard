from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.category_rule import CategoryRule
from app.schemas.category_rule import (
    CategoryRuleCreate, 
    CategoryRuleUpdate, 
    CategoryRuleOut,
    CategoryOut
)
from app.services.category_service import CategoryService

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("/", response_model=List[CategoryOut])
def get_available_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    API to list available categories for the current user.
    Includes system defaults + user-specific categories.
    """
    category_names = CategoryService.get_all_categories(db, current_user.id)
    return [CategoryOut(name=name) for name in category_names]

@router.get("/rules", response_model=List[CategoryRuleOut])
def get_category_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all category rules (system + user-specific).
    """
    rules = db.query(CategoryRule).filter(
        (CategoryRule.is_system_default == True) | 
        (CategoryRule.user_id == current_user.id)
    ).all()
    
    return rules

@router.post("/rules", response_model=CategoryRuleOut, status_code=status.HTTP_201_CREATED)
def create_category_rule(
    rule: CategoryRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new user-specific category rule.
    """
    new_rule = CategoryRule(
        user_id=current_user.id,
        category_name=rule.category_name,
        keywords=rule.keywords,
        merchant_patterns=rule.merchant_patterns or [],
        is_system_default=False
    )
    
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    
    return new_rule

@router.put("/rules/{rule_id}", response_model=CategoryRuleOut)
def update_category_rule(
    rule_id: int,
    rule_update: CategoryRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a category rule.
    Users can update their own rules OR system default rules.
    When updating system defaults, creates a user-specific copy.
    """
    # Find the rule (can be user-specific or system default)
    rule = db.query(CategoryRule).filter(
        CategoryRule.id == rule_id
    ).first()
    
    if not rule:
        raise HTTPException(
            status_code=404,
            detail="Category rule not found"
        )
    
    # Check authorization: user can update their own rules OR system defaults
    if rule.user_id is not None and rule.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to update this category rule"
        )
    
    # If updating a system default, create a user-specific copy instead
    if rule.is_system_default:
        # Check if user already has a custom version of this category
        existing_custom = db.query(CategoryRule).filter(
            CategoryRule.user_id == current_user.id,
            CategoryRule.category_name == rule.category_name,
            CategoryRule.is_system_default == False
        ).first()
        
        if existing_custom:
            # Update the existing custom rule
            rule = existing_custom
        else:
            # Create a new user-specific rule based on system default
            rule = CategoryRule(
                user_id=current_user.id,
                category_name=rule.category_name,
                keywords=rule.keywords.copy(),
                merchant_patterns=rule.merchant_patterns.copy() if rule.merchant_patterns else [],
                is_system_default=False
            )
            db.add(rule)
    
    # Update the rule
    if rule_update.category_name is not None:
        rule.category_name = rule_update.category_name
    if rule_update.keywords is not None:
        rule.keywords = rule_update.keywords
    if rule_update.merchant_patterns is not None:
        rule.merchant_patterns = rule_update.merchant_patterns
    
    db.commit()
    db.refresh(rule)
    
    return rule

@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a user-specific category rule.
    """
    rule = db.query(CategoryRule).filter(
        CategoryRule.id == rule_id,
        CategoryRule.user_id == current_user.id
    ).first()
    
    if not rule:
        raise HTTPException(
            status_code=404,
            detail="Category rule not found or not authorized"
        )
    
    db.delete(rule)
    db.commit()
    
    return None

@router.post("/recategorize-all")
def recategorize_all_transactions(
    only_others: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Re-categorize transactions for the current user.
    By default, only re-categorizes transactions currently marked as "Others".
    
    Query Parameters:
    - only_others: If True (default), only process "Others" transactions
    """
    result = CategoryService.recategorize_transactions(
        db=db,
        user_id=current_user.id,
        only_others=only_others
    )
    
    message = f"Checked {result['total_checked']} transactions: "
    message += f"{result['updated_count']} updated, {result['unchanged_count']} unchanged"
    
    return {
        "message": message,
        "total_checked": result['total_checked'],
        "updated_count": result['updated_count'],
        "unchanged_count": result['unchanged_count'],
        "changes": result['changes']
    }

@router.post("/recategorize-transaction/{transaction_id}")
def recategorize_single_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Re-categorize a single transaction.
    Validates that the user owns this transaction.
    """
    from app.models.transaction import Transaction
    from app.models.account import Account
    
    # Get transaction
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id
    ).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Validate ownership
    account = db.query(Account).filter(
        Account.id == transaction.account_id,
        Account.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to recategorize this transaction"
        )
    
    # Re-categorize
    old_category = transaction.category
    new_category = CategoryService.auto_categorize(
        db=db,
        user_id=current_user.id,
        description=transaction.description,
        merchant=transaction.merchant
    )
    
    transaction.category = new_category
    db.commit()
    db.refresh(transaction)
    
    return {
        "message": "Transaction re-categorized successfully",
        "old_category": old_category,
        "new_category": new_category,
        "transaction_id": transaction.id,
        "new_category_value": new_category
    }