-- Add purpose column to expenses table
-- This column stores the purpose/description of admin expenses

-- Step 1: Add purpose column to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS purpose VARCHAR(500);

-- Step 2: Verify the column was added
SELECT 
  column_name, 
  data_type, 
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'expenses' 
  AND column_name = 'purpose';

