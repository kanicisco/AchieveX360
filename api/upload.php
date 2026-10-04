<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    exit;
}

require_once __DIR__ . '/../db_connect.php';

$uploadsDir = __DIR__ . '/../uploads';
if (!file_exists($uploadsDir)) {
    @mkdir($uploadsDir, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['excel_file']) || $_FILES['excel_file']['error'] !== UPLOAD_ERR_OK) {
        $errCode = $_FILES['excel_file']['error'] ?? 'No file provided';
        echo json_encode(['success' => false, 'error' => 'File upload failed. Error code: ' . $errCode]);
        exit;
    }

    $file = $_FILES['excel_file'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    $allowedExts = ['xlsx', 'xls', 'xlsb', 'csv'];
    if (!in_array($ext, $allowedExts)) {
        echo json_encode(['success' => false, 'error' => 'Invalid file extension. Allowed: .xlsx, .xls, .xlsb, .csv']);
        exit;
    }

    $targetPath = $uploadsDir . '/' . time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $file['name']);
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        echo json_encode([
            'success' => true,
            'message' => 'Excel file uploaded successfully to server!',
            'filename' => $file['name'],
            'filepath' => 'uploads/' . basename($targetPath)
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to move uploaded file to target directory.']);
    }
    exit;
}

echo json_encode(['success' => false, 'error' => 'Invalid request method.']);
