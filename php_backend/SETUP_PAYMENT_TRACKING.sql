-- CRITICAL: Run this SQL in your phpMyAdmin BEFORE using payment tracking

-- 1. Add paid_date column to milestones table
ALTER TABLE `milestones` 
ADD COLUMN IF NOT EXISTS `paid_date` DATE DEFAULT NULL AFTER `is_paid`;

-- 2. Verify the milestones table structure
-- After running this, your milestones table should have these columns:
-- id, project_id, label, amount, is_paid, paid_date, due_date

-- 3. Check if you have any existing milestones without IDs (shouldn't happen, but just in case)
SELECT COUNT(*) as total_milestones FROM milestones;

-- 4. Check if any milestones are missing due_dates
SELECT COUNT(*) as milestones_without_due_date FROM milestones WHERE due_date IS NULL;

-- If you see milestones without due dates, you can set default ones:
-- UPDATE milestones SET due_date = DATE_ADD(NOW(), INTERVAL 7 DAY) WHERE due_date IS NULL;
