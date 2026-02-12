-- Database Schema for Hostinger Deployment (phpMyAdmin Import)

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `role` enum('Admin','User') DEFAULT 'User',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

-- 2. Clients Table
CREATE TABLE IF NOT EXISTS `clients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `company_name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text,
  `country` varchar(50) DEFAULT NULL,
  `notes` text,
  `created_date` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS `projects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `status` enum('Pending','Approved','Ongoing','Completed','On Hold','Cancelled','Rejected') DEFAULT 'Pending',
  `priority` enum('High','Medium','Low') DEFAULT 'Medium',
  `project_type` enum('40-30-30','Custom Milestone','Full Payment Upfront') DEFAULT '40-30-30',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `currency` varchar(10) DEFAULT 'LKR',
  `base_amount` decimal(15,2) DEFAULT 0.00,
  `notes` text,
  `invoice_number` varchar(50) DEFAULT NULL,
  `is_invoice_issued` tinyint(1) DEFAULT 0,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE
);

-- 4. Tasks Table
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `label` varchar(255) NOT NULL,
  `status` enum('Backlog','In Progress','Review','Deployed') DEFAULT 'Backlog',
  `priority` enum('High','Medium','Low') DEFAULT 'Medium',
  `due_date` date DEFAULT NULL,
  `assigned_to` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE
);

-- 5. Milestones Table
CREATE TABLE IF NOT EXISTS `milestones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `label` varchar(255) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `is_paid` tinyint(1) DEFAULT 0,
  `due_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE
);

-- 6. Additional Costs Table
CREATE TABLE IF NOT EXISTS `additional_costs` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `project_id` int(11) NOT NULL,
    `name` varchar(100),
    `description` text,
    `amount` decimal(15, 2),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE
);

-- 7. Developers Table (Squad Members)
CREATE TABLE IF NOT EXISTS `developers` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `name` varchar(100) NOT NULL,
    `specialization` varchar(100),
    `email` varchar(100),
    `phone` varchar(20),
    `status` enum('Active', 'Inactive') DEFAULT 'Active',
    `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
);

-- 8. Project Assignments (Junction for Squads)
CREATE TABLE IF NOT EXISTS `project_developers` (
    `project_id` int(11) NOT NULL,
    `developer_id` int(11) NOT NULL,
    `total_cost` decimal(15, 2) DEFAULT 0,
    `is_advance_paid` tinyint(1) DEFAULT 0,
    `is_final_paid` tinyint(1) DEFAULT 0,
    PRIMARY KEY (`project_id`, `developer_id`),
    FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`developer_id`) REFERENCES `developers`(`id`) ON DELETE CASCADE
);

COMMIT;
