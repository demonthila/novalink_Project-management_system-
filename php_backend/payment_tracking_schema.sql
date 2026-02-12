-- Payment Tracking Schema Update
-- Add paid_date column to milestones table to track when payment was received

ALTER TABLE `milestones` 
ADD COLUMN `paid_date` DATE DEFAULT NULL AFTER `is_paid`;

-- Create system_settings table if it doesn't exist (for currency preference)
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL UNIQUE,
  `setting_value` text,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

-- Insert default currency setting
INSERT INTO `system_settings` (`setting_key`, `setting_value`) 
VALUES ('currency', 'AUD') 
ON DUPLICATE KEY UPDATE setting_value = 'AUD';
