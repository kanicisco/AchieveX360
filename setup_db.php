<?php
header('Content-Type: application/json');

$host = '127.0.0.1';
$user = 'root';
$pass = '';
$dbname = 'achievex_360';

// Connect without db first
$conn = @new mysqli($host, $user, $pass);
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

// Create database if not exists
$sql_db = "CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
if (!$conn->query($sql_db)) {
    echo json_encode(['success' => false, 'error' => 'Error creating database: ' . $conn->error]);
    exit;
}

$conn->select_db($dbname);

// Table 1: datasets
$sql_datasets = "CREATE TABLE IF NOT EXISTS `datasets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `filename` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `years_json` TEXT,
    `half_years_json` TEXT,
    `quarters_json` TEXT,
    `months_json` TEXT,
    `categories_json` TEXT,
    `mapping_json` LONGTEXT,
    `records_count` INT DEFAULT 0,
    `is_active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

// Table 2: outlets / master records
$sql_outlets = "CREATE TABLE IF NOT EXISTS `outlets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `dataset_id` INT NOT NULL,
    `distributor_code` VARCHAR(100),
    `distributor_name` VARCHAR(255),
    `sse` VARCHAR(255),
    `dsr` VARCHAR(255),
    `retailer_code` VARCHAR(100),
    `retailer_name` VARCHAR(255),
    `urc` VARCHAR(100),
    `activity` VARCHAR(255),
    `slab` VARCHAR(100),
    `monthly_data_json` LONGTEXT,
    `total_target` DECIMAL(15,2) DEFAULT 0.00,
    `total_achievement` DECIMAL(15,2) DEFAULT 0.00,
    `achievement_pct` DECIMAL(8,2) DEFAULT 0.00,
    FOREIGN KEY (`dataset_id`) REFERENCES `datasets`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

// Table 3: outlet_metrics (normalized metric entries for fast SQL aggregations)
$sql_metrics = "CREATE TABLE IF NOT EXISTS `outlet_metrics` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `dataset_id` INT NOT NULL,
    `outlet_id` INT NOT NULL,
    `year` VARCHAR(50),
    `half_year` VARCHAR(50),
    `quarter` VARCHAR(50),
    `month` VARCHAR(50),
    `category` VARCHAR(255),
    `metric_type` ENUM('target', 'achievement', 'cat_achievement') NOT NULL,
    `metric_value` DECIMAL(15,2) NULL,
    INDEX `idx_dataset_period` (`dataset_id`, `year`, `half_year`, `quarter`, `month`),
    INDEX `idx_category` (`category`),
    FOREIGN KEY (`dataset_id`) REFERENCES `datasets`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`outlet_id`) REFERENCES `outlets`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

// Table 4: custom_mappings
$sql_mappings = "CREATE TABLE IF NOT EXISTS `custom_mappings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `mapping_name` VARCHAR(255) NOT NULL,
    `config_json` LONGTEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

$res1 = $conn->query($sql_datasets);
$res2 = $conn->query($sql_outlets);
$res3 = $conn->query($sql_metrics);
$res4 = $conn->query($sql_mappings);

if ($res1 && $res2 && $res3 && $res4) {
    echo json_encode(['success' => true, 'message' => 'Database achievex_360 and tables created successfully!']);
} else {
    echo json_encode(['success' => false, 'error' => 'Error creating tables: ' . $conn->error]);
}
