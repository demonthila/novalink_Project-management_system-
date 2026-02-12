
-- Database Schema for NovaLink Innovations
-- Optimized for relational integrity and the new Project requirements

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

CREATE TABLE IF NOT EXISTS developers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT,
    name VARCHAR(200) NOT NULL,
    project_type ENUM('30-30-40', 'Custom Milestone', 'Full Payment Upfront') DEFAULT '30-30-40',
    start_date DATE,
    end_date DATE,
    status ENUM('Pending', 'Ongoing', 'Completed', 'On Hold', 'Cancelled') DEFAULT 'Pending',
    currency VARCHAR(10) DEFAULT 'USD',
    base_amount DECIMAL(15, 2) DEFAULT 0,
    dev_total_cost DECIMAL(15, 2) DEFAULT 0,
    dev_advance_paid DECIMAL(15, 2) DEFAULT 0,
    notes TEXT,
    invoice_number VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_developers (
    project_id INT,
    developer_id INT,
    PRIMARY KEY (project_id, developer_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (developer_id) REFERENCES developers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_milestones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT,
    label VARCHAR(100),
    amount DECIMAL(15, 2),
    is_paid BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS additional_costs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT,
    name VARCHAR(100),
    description TEXT,
    amount DECIMAL(15, 2),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
