
-- Database Schema for IT Business Project & Client Management System
-- Use this to set up your MySQL database on Hostinger

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    company_name VARCHAR(150),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    country VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(100),
    start_date DATE,
    end_date DATE,
    status ENUM('In Progress', 'Completed', 'Cancelled') DEFAULT 'In Progress',
    project_cost DECIMAL(15, 2) DEFAULT 0,
    final_total DECIMAL(15, 2) DEFAULT 0,
    plugin_costs DECIMAL(15, 2) DEFAULT 0,
    template_costs DECIMAL(15, 2) DEFAULT 0,
    other_costs DECIMAL(15, 2) DEFAULT 0,
    upfront_payment DECIMAL(15, 2) DEFAULT 0,
    developer_name VARCHAR(100),
    developer_total_cost DECIMAL(15, 2) DEFAULT 0,
    advance_payment_to_developer DECIMAL(15, 2) DEFAULT 0,
    notes TEXT,
    invoice_number VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Default Admin User (Password: admin123)
-- In production, hash the password using password_hash() in PHP
-- INSERT INTO users (username, password, full_name) VALUES ('admin', '$2y$10$YourHashedPasswordHere', 'Admin User');
