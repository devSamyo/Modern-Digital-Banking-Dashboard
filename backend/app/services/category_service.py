from sqlalchemy.orm import Session
from app.models.category_rule import CategoryRule
from typing import Optional, List

class CategoryService:
    
    @staticmethod
    def get_all_categories(db: Session, user_id: int) -> List[str]:
        """
        Get all available category names for a user.
        Includes both system defaults and user-specific categories.
        """
        rules = db.query(CategoryRule).filter(
            (CategoryRule.is_system_default == True) | 
            (CategoryRule.user_id == user_id)
        ).all()
        
        # Get unique category names
        categories = list(set([rule.category_name for rule in rules]))
        categories.append("Others")  # Always include default category
        categories.sort()
        
        return categories
    
    @staticmethod
    def auto_categorize(
        db: Session, 
        user_id: int, 
        description: str, 
        merchant: Optional[str] = None
    ) -> str:
        """
        Automatically categorize a transaction based on rules.
        
        Logic:
        1. Extract merchant/description from transaction
        2. Match against category keywords
        3. Assign FIRST matching category
        4. Assign "Others" if no match found
        
        Priority:
        - User-specific rules checked first
        - Then system default rules
        - First match wins (not longest match)
        """
        
        # Normalize inputs for case-insensitive matching
        description_lower = description.lower() if description else ""
        merchant_lower = merchant.lower() if merchant else ""
        combined_text = f"{description_lower} {merchant_lower}"
        
        # Get user-specific rules first
        user_rules = db.query(CategoryRule).filter(
            CategoryRule.user_id == user_id
        ).all()
        
        # Check user rules first
        category = CategoryService._find_first_match(user_rules, combined_text)
        if category:
            return category
        
        # Get system default rules
        system_rules = db.query(CategoryRule).filter(
            CategoryRule.is_system_default == True
        ).all()
        
        # Check system rules
        category = CategoryService._find_first_match(system_rules, combined_text)
        if category:
            return category
        
        # No match found - return default category
        return "Others"
    
    @staticmethod
    def _find_first_match(
        rules: List[CategoryRule], 
        text: str
    ) -> Optional[str]:
        """
        Find FIRST matching rule against text.
        Returns category name or None.
        """
        for rule in rules:
            # Check keywords
            if rule.keywords:
                for keyword in rule.keywords:
                    if keyword.lower() in text:
                        return rule.category_name
            
            # Check merchant patterns
            if rule.merchant_patterns:
                for pattern in rule.merchant_patterns:
                    if pattern.lower() in text:
                        return rule.category_name
        
        return None
    
    @staticmethod
    def recategorize_transactions(
        db: Session,
        user_id: int,
        transaction_ids: Optional[List[int]] = None,
        only_others: bool = True,
        specific_categories: Optional[List[str]] = None
    ) -> dict:
        """
        Re-categorize transactions for a user.
        
        Args:
            db: Database session
            user_id: User ID
            transaction_ids: Optional list of specific transaction IDs to recategorize.
                            If None, recategorizes based on filters.
            only_others: If True, only recategorize transactions currently marked as "Others"
            specific_categories: If provided, only recategorize transactions in these categories
        
        Returns:
            Dictionary with counts and details
        """
        from app.models.transaction import Transaction
        from app.models.account import Account
        
        # Get user's accounts
        user_accounts = db.query(Account.id).filter(Account.user_id == user_id).all()
        account_ids = [acc.id for acc in user_accounts]
        
        if not account_ids:
            return {
                "total_checked": 0,
                "updated_count": 0,
                "unchanged_count": 0,
                "changes": []
            }
        
        # Build query
        query = db.query(Transaction).filter(
            Transaction.account_id.in_(account_ids)
        )
        
        # Filter by specific transaction IDs if provided
        if transaction_ids:
            query = query.filter(Transaction.id.in_(transaction_ids))
        # Filter to only "Others" category if specified
        elif only_others:
            query = query.filter(Transaction.category == "Others")
        # Filter by specific categories if provided
        elif specific_categories:
            query = query.filter(Transaction.category.in_(specific_categories))
        
        transactions = query.all()
        
        # Re-categorize each transaction
        updated_count = 0
        unchanged_count = 0
        changes = []
        
        for txn in transactions:
            old_category = txn.category
            new_category = CategoryService.auto_categorize(
                db=db,
                user_id=user_id,
                description=txn.description,
                merchant=txn.merchant
            )
            
            # Only update if category changed
            if old_category != new_category:
                txn.category = new_category
                updated_count += 1
                changes.append({
                    "transaction_id": txn.id,
                    "description": txn.description,
                    "merchant": txn.merchant,
                    "old_category": old_category,
                    "new_category": new_category
                })
            else:
                unchanged_count += 1
        
        db.commit()
        
        return {
            "total_checked": len(transactions),
            "updated_count": updated_count,
            "unchanged_count": unchanged_count,
            "changes": changes
        }
    
    @staticmethod
    def seed_default_categories(db: Session):
        """
        Seed system default category rules.
        Creates standard categories if they don't exist.
        """
        # Check if defaults already exist
        existing = db.query(CategoryRule).filter(
            CategoryRule.is_system_default == True
        ).first()
        
        if existing:
            print("ℹ️  Default categories already exist, skipping seed")
            return
        
        default_rules = [
            {
                "category_name": "Food & Dining",
                "keywords": ["restaurant", "cafe", "coffee", "lunch", "dinner", "breakfast", "food", "pizza", "burger", "sushi"],
                "merchant_patterns": ["mcdonalds", "starbucks", "subway", "dominos", "kfc", "pizza hut", "dunkin"],
                "is_system_default": True,
                "user_id": None
            },
            {
                "category_name": "Transportation",
                "keywords": ["uber", "lyft", "taxi", "gas", "fuel", "parking", "metro", "bus", "train", "flight"],
                "merchant_patterns": ["ola", "rapido", "uber", "lyft", "shell", "chevron", "exxon", "bp"],
                "is_system_default": True,
                "user_id": None
            },
            {
                "category_name": "Shopping",
                "keywords": ["amazon", "walmart", "target", "shopping", "purchase", "clothing", "electronics"],
                "merchant_patterns": ["flipkart", "ajio", "myntra", "amazon", "walmart", "target", "bestbuy", "costco"],
                "is_system_default": True,
                "user_id": None
            },
            {
                "category_name": "Entertainment",
                "keywords": ["netflix", "spotify", "movie", "cinema", "concert", "game", "subscription"],
                "merchant_patterns": ["amazon prime", "hotstar","netflix", "spotify", "hulu", "disney", "youtube"],
                "is_system_default": True,
                "user_id": None
            },
            {
                "category_name": "Bills & Utilities",
                "keywords": ["electricity", "water", "internet", "phone", "utility", "bill", "insurance"],
                "merchant_patterns": ["verizon", "att", "comcast", "spectrum", "airtel", "reliance jio", "bsnl"],
                "is_system_default": True,
                "user_id": None
            },
            {
                "category_name": "Salary & Income",
                "keywords": ["salary", "payroll", "income", "bonus", "commission", "refund"],
                "merchant_patterns": [],
                "is_system_default": True,
                "user_id": None
            },
            {
                "category_name": "Healthcare",
                "keywords": ["pharmacy", "doctor", "hospital", "medicine", "medical", "health", "dental"],
                "merchant_patterns": ["cvs", "walgreens", "rite aid", "apollo pharmacy", "medplus pharmacy"],
                "is_system_default": True,
                "user_id": None
            },
            {
                "category_name": "Education",
                "keywords": ["tuition", "books", "school", "university", "course", "education"],
                "merchant_patterns": ["coursera", "udemy"],
                "is_system_default": True,
                "user_id": None
            },
            {
                "category_name": "Travel",
                "keywords": ["hotel", "airbnb", "flight", "booking", "travel", "vacation"],
                "merchant_patterns": ["airbnb", "booking.com", "expedia", "makemytrip", "yatra"],
                "is_system_default": True,
                "user_id": None
            }
        ]
        
        for rule_data in default_rules:
            rule = CategoryRule(**rule_data)
            db.add(rule)
        
        db.commit()
        print("✅ Default categories seeded successfully")