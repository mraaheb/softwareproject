
CREATE DATABASE IF NOT EXISTS adud_db;
USE adud_db;

CREATE TABLE patient_guardians (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    guardian_for_minor TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE service_providers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    provider_name VARCHAR(100),
    license_number VARCHAR(50) NOT NULL,
    is_verified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    wheelchair TINYINT(1) DEFAULT 0,
    oxygen TINYINT(1) DEFAULT 0,
    companion TINYINT(1) DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (patient_id) REFERENCES patient_guardians(id) ON DELETE CASCADE
);

CREATE TABLE escorts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    is_available TINYINT(1) DEFAULT 1,
    FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE CASCADE
);

CREATE TABLE requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    provider_id INT NULL,
    escort_id INT NULL,
    pickup_location VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    appointment_datetime DATETIME NOT NULL,
    wheelchair TINYINT(1) DEFAULT 0,
    oxygen TINYINT(1) DEFAULT 0,
    companion TINYINT(1) DEFAULT 0,
    escort_required TINYINT(1) DEFAULT 0,
    status ENUM('Requested','Assigned','Picked Up','Arrived','Completed','Cancelled','Rejected') DEFAULT 'Requested',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patient_guardians(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE SET NULL,
    FOREIGN KEY (escort_id) REFERENCES escorts(id) ON DELETE SET NULL
);

CREATE TABLE trip_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    status ENUM('Requested','Assigned','Picked Up','Arrived','Completed','Cancelled','Rejected') NOT NULL,
    updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
);

CREATE TABLE trip_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    final_status ENUM('Completed','Cancelled','Rejected') NOT NULL,
    closed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    summary TEXT,
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_guardian_id INT NULL,
    provider_id INT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_guardian_id) REFERENCES patient_guardians(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE CASCADE
);