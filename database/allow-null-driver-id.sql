-- Migration to allow NULL driver_id in expenses table
-- This enables admin expenses without a driver

-- Step 1: Drop the NOT NULL constraint on driver_id column
ALTER TABLE expenses ALTER COLUMN driver_id DROP NOT NULL;

-- Step 2: Ensure the foreign key constraint allows NULL values
-- First, drop the existing foreign key constraint if it exists
ALTER TABLE expenses
  DROP CONSTRAINT IF EXISTS expenses_driver_id_fkey;

-- Step 3: Recreate the foreign key constraint with ON DELETE SET NULL
-- This allows NULL values and sets driver_id to NULL when a driver is deleted
ALTER TABLE expenses
  ADD CONSTRAINT expenses_driver_id_fkey
  FOREIGN KEY (driver_id)
  REFERENCES profiles(id)
  ON DELETE SET NULL;

-- Step 4: Update the trigger function to handle NULL driver_id
CREATE OR REPLACE FUNCTION update_expense_driver_info()
RETURNS TRIGGER AS $$
BEGIN
  -- If driver_name is not provided and driver_id is not NULL, fetch it from profiles
  IF NEW.driver_name IS NULL AND NEW.driver_id IS NOT NULL THEN
    SELECT name INTO NEW.driver_name
    FROM profiles
    WHERE id = NEW.driver_id;
  END IF;
  
  -- If vehicle_number is not provided and driver_id is not NULL, fetch it from vehicles
  IF NEW.vehicle_number IS NULL AND NEW.driver_id IS NOT NULL THEN
    SELECT vehicle_number INTO NEW.vehicle_number
    FROM vehicles
    WHERE driver_id = NEW.driver_id
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the change
SELECT 
  column_name, 
  is_nullable, 
  data_type
FROM information_schema.columns
WHERE table_name = 'expenses' 
  AND column_name = 'driver_id';

