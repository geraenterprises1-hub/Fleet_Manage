-- Add vehicle_number column to expenses table to preserve vehicle info
-- This ensures vehicle numbers are shown even after driver deletion

-- Step 1: Add vehicle_number column to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(50);

-- Step 2: Update existing expenses with vehicle numbers from vehicles table
UPDATE expenses e
SET vehicle_number = v.vehicle_number
FROM vehicles v
WHERE e.driver_id = v.driver_id 
  AND e.vehicle_number IS NULL
  AND v.driver_id IS NOT NULL;

-- Step 3: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_number ON expenses(vehicle_number);

-- Step 4: Verify the update
SELECT 
  COUNT(*) as total_expenses,
  COUNT(vehicle_number) as expenses_with_vehicle_number,
  COUNT(*) - COUNT(vehicle_number) as expenses_without_vehicle_number
FROM expenses;

