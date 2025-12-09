-- Migration to preserve driver data when driver is deleted
-- This ensures expenses and driver information are retained

-- Step 1: Add deleted_at column to profiles table for soft delete
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Add driver_name column to expenses table to preserve driver name
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255);

-- Step 2b: Add vehicle_number column to expenses table to preserve vehicle number
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(50);

-- Step 3: Update existing expenses to populate driver_name
UPDATE expenses e
SET driver_name = p.name
FROM profiles p
WHERE e.driver_id = p.id AND e.driver_name IS NULL;

-- Step 3b: Update existing expenses to populate vehicle_number
UPDATE expenses e
SET vehicle_number = v.vehicle_number
FROM vehicles v
WHERE e.driver_id = v.driver_id 
  AND e.vehicle_number IS NULL
  AND v.driver_id IS NOT NULL;

-- Step 4: Create a trigger to automatically populate driver_name and vehicle_number when expense is created/updated
CREATE OR REPLACE FUNCTION update_expense_driver_info()
RETURNS TRIGGER AS $$
BEGIN
  -- If driver_name is not provided, fetch it from profiles
  IF NEW.driver_name IS NULL AND NEW.driver_id IS NOT NULL THEN
    SELECT name INTO NEW.driver_name
    FROM profiles
    WHERE id = NEW.driver_id;
  END IF;
  
  -- If vehicle_number is not provided, fetch it from vehicles
  IF NEW.vehicle_number IS NULL AND NEW.driver_id IS NOT NULL THEN
    SELECT vehicle_number INTO NEW.vehicle_number
    FROM vehicles
    WHERE driver_id = NEW.driver_id
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS trigger_update_expense_driver_name ON expenses;
DROP TRIGGER IF EXISTS trigger_update_expense_driver_info ON expenses;

-- Create new trigger
CREATE TRIGGER trigger_update_expense_driver_info
  BEFORE INSERT OR UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_driver_info();

-- Step 5: Change foreign key constraint to SET NULL instead of CASCADE (if it exists)
-- First, check if the constraint exists and drop it
DO $$
BEGIN
  -- Find and drop the existing foreign key constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%driver_id%' 
    AND table_name = 'expenses'
    AND constraint_type = 'FOREIGN KEY'
  ) THEN
    -- Get the constraint name
    DECLARE
      constraint_name_var TEXT;
    BEGIN
      SELECT constraint_name INTO constraint_name_var
      FROM information_schema.table_constraints
      WHERE constraint_name LIKE '%driver_id%'
      AND table_name = 'expenses'
      AND constraint_type = 'FOREIGN KEY'
      LIMIT 1;
      
      EXECUTE 'ALTER TABLE expenses DROP CONSTRAINT IF EXISTS ' || constraint_name_var;
    END;
  END IF;
END $$;

-- Create new foreign key with SET NULL on delete
ALTER TABLE expenses
  DROP CONSTRAINT IF EXISTS expenses_driver_id_fkey;

ALTER TABLE expenses
  ADD CONSTRAINT expenses_driver_id_fkey
  FOREIGN KEY (driver_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- Step 6: Create index on deleted_at for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON profiles(deleted_at);

-- Step 7: Create index on driver_name in expenses
CREATE INDEX IF NOT EXISTS idx_expenses_driver_name ON expenses(driver_name);

-- Step 7b: Create index on vehicle_number in expenses
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_number ON expenses(vehicle_number);

