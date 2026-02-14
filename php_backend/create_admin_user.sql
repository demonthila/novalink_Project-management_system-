-- SQL Script to create the demo admin user
-- Run this in your MySQL database (phpMyAdmin, MySQL Workbench, or command line)

-- First, create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `role` enum('Admin','User') DEFAULT 'User',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

-- Insert the demo admin user (email: admin, password: admin123)
-- The password is hashed using PHP's password_hash
INSERT INTO users (name, email, password, role, created_at) 
VALUES ('Administrator', 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', NOW())
ON DUPLICATE KEY UPDATE id=id;

