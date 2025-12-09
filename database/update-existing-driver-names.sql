-- Update existing expenses to populate driver_name from profiles table
-- This fixes expenses that show "Deleted Driver" or "Unknown"

-- Step 1: Update expenses with driver_name from profiles (for active drivers)
UPDATE expenses e
SET driver_name = p.name
FROM profiles p
WHERE e.driver_id = p.id 
  AND e.driver_name IS NULL
  AND p.role = 'driver';

-- Step 2: Update expenses for deleted drivers (if deleted_at column exists)
-- This will preserve driver names even after deletion
DO $$
BEGIN
  -- Check if deleted_at column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'deleted_at'
  ) THEN
    -- Update expenses for deleted drivers
    UPDATE expenses e
    SET driver_name = p.name
    FROM profiles p
    WHERE e.driver_id = p.id 
      AND e.driver_name IS NULL
      AND p.role = 'driver'
      AND p.deleted_at IS NOT NULL;
  END IF;
END $$;

-- Step 3: Verify the update
SELECT 
  COUNT(*) as total_expenses,
  COUNT(driver_name) as expenses_with_name,
  COUNT(*) - COUNT(driver_name) as expenses_without_name
FROM expenses;

