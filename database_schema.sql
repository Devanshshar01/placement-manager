-- Placement Management System Database Schema
-- Generated: 2025-11-22
-- Database: placement_system

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. Table: admin
-- Description: Stores placement officer credentials and details.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `admin`;
CREATE TABLE `admin` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('super_admin', 'placement_officer') DEFAULT 'placement_officer',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Table: students
-- Description: Stores student profiles and academic details.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `roll_number` VARCHAR(50) NOT NULL UNIQUE,
    `branch` VARCHAR(100) NOT NULL,
    `cgpa` DECIMAL(4, 2) NOT NULL CHECK (`cgpa` >= 0 AND `cgpa` <= 10),
    `phone` VARCHAR(20),
    `resume_url` VARCHAR(255),
    `linkedin_url` VARCHAR(255),
    `github_url` VARCHAR(255),
    `skills` TEXT, -- Comma-separated list or JSON
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_student_branch` (`branch`),
    INDEX `idx_student_cgpa` (`cgpa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Table: companies
-- Description: Stores details of companies visiting the campus.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `companies`;
CREATE TABLE `companies` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_name` VARCHAR(100) NOT NULL UNIQUE,
    `industry` VARCHAR(100),
    `website` VARCHAR(255),
    `description` TEXT,
    `hr_name` VARCHAR(100),
    `hr_email` VARCHAR(100),
    `hr_phone` VARCHAR(20),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Table: job_drives
-- Description: Stores placement drives/job openings linked to companies.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `job_drives`;
CREATE TABLE `job_drives` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `company_id` INT NOT NULL,
    `job_title` VARCHAR(100) NOT NULL,
    `job_type` ENUM('Full Time', 'Internship', 'Contract') NOT NULL DEFAULT 'Full Time',
    `ctc` DECIMAL(10, 2) COMMENT 'CTC in LPA or absolute value',
    `location` VARCHAR(100),
    `eligibility_criteria` TEXT,
    `required_skills` TEXT,
    `application_deadline` DATETIME NOT NULL,
    `drive_date` DATETIME NOT NULL,
    `status` ENUM('Scheduled', 'Ongoing', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE,
    INDEX `idx_drive_status` (`status`),
    INDEX `idx_drive_date` (`drive_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Table: applications
-- Description: Tracks student applications for specific job drives.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `applications`;
CREATE TABLE `applications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `student_id` INT NOT NULL,
    `drive_id` INT NOT NULL,
    `status` ENUM('Applied', 'Shortlisted', 'Selected', 'Rejected') DEFAULT 'Applied',
    `applied_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`drive_id`) REFERENCES `job_drives`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_application` (`student_id`, `drive_id`),
    INDEX `idx_app_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Table: notifications
-- Description: System notifications for users.
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_type` ENUM('student', 'admin') NOT NULL,
    `user_id` INT NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_notif_user` (`user_type`, `user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- SAMPLE DATA
-- -----------------------------------------------------------------------------

-- Admins
INSERT INTO `admin` (`name`, `email`, `password_hash`, `role`) VALUES
('John Doe', 'admin@college.edu', 'hashed_secret_123', 'super_admin'),
('Sarah Smith', 'sarah.po@college.edu', 'hashed_secret_456', 'placement_officer');

-- Students
INSERT INTO `students` (`name`, `email`, `password_hash`, `roll_number`, `branch`, `cgpa`, `phone`, `skills`) VALUES
('Alice Johnson', 'alice@student.edu', 'hash_alice', 'CS2023001', 'Computer Science', 8.5, '9876543210', 'Java, Python, SQL'),
('Bob Williams', 'bob@student.edu', 'hash_bob', 'ME2023045', 'Mechanical', 7.8, '9876543211', 'AutoCAD, SolidWorks'),
('Charlie Brown', 'charlie@student.edu', 'hash_charlie', 'CS2023002', 'Computer Science', 9.2, '9876543212', 'React, Node.js, MongoDB');

-- Companies
INSERT INTO `companies` (`company_name`, `industry`, `website`, `hr_name`, `hr_email`) VALUES
('TechCorp', 'IT Services', 'https://techcorp.com', 'Mike Ross', 'mike@techcorp.com'),
('BuildIt', 'Construction', 'https://buildit.com', 'Rachel Zane', 'rachel@buildit.com'),
('InnovateAI', 'Artificial Intelligence', 'https://innovate.ai', 'Harvey Specter', 'harvey@innovate.ai');

-- Job Drives
INSERT INTO `job_drives` (`company_id`, `job_title`, `job_type`, `ctc`, `location`, `application_deadline`, `drive_date`, `status`) VALUES
(1, 'Software Engineer', 'Full Time', 12.00, 'Bangalore', '2025-12-01 23:59:59', '2025-12-10 09:00:00', 'Scheduled'),
(1, 'Data Analyst Intern', 'Internship', 5.00, 'Remote', '2025-11-30 23:59:59', '2025-12-05 10:00:00', 'Scheduled'),
(3, 'ML Engineer', 'Full Time', 25.00, 'Hyderabad', '2025-12-15 23:59:59', '2025-12-20 09:00:00', 'Scheduled');

-- Applications
INSERT INTO `applications` (`student_id`, `drive_id`, `status`) VALUES
(1, 1, 'Applied'),
(3, 1, 'Shortlisted'),
(3, 3, 'Applied');

-- Notifications
INSERT INTO `notifications` (`user_type`, `user_id`, `message`, `is_read`) VALUES
('student', 1, 'New drive announced: TechCorp Software Engineer', FALSE),
('student', 3, 'You have been shortlisted for TechCorp Software Engineer', FALSE),
('admin', 1, 'New company registration: InnovateAI', TRUE);
