-- 1. Add unique constraint to prevent duplicate budgets
ALTER TABLE budgets 
ADD CONSTRAINT unique_user_category_month_year 
UNIQUE (user_id, category, month, year);

-- 2. Add check constraints for validation
ALTER TABLE budgets 
ADD CONSTRAINT check_month CHECK (month >= 1 AND month <= 12);

ALTER TABLE budgets 
ADD CONSTRAINT check_year CHECK (year >= 2000 AND year <= 2100);

ALTER TABLE budgets 
ADD CONSTRAINT check_limit_amount CHECK (limit_amount > 0);

-- 3. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month_year ON budgets(month, year);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);

-- 4. Make category NOT NULL (if it isn't already)
ALTER TABLE budgets ALTER COLUMN category SET NOT NULL;