<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once __DIR__ . '/../db_connect.php';

$conn = get_db_connection();

if (!$conn) {
    echo json_encode(['success' => false, 'message' => 'DB Connection unavailable']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? 'clear_all';

if ($action === 'clear_all') {
    $conn->query("DELETE FROM `outlet_metrics`");
    $conn->query("DELETE FROM `outlets`");
    $conn->query("DELETE FROM `datasets`");
    echo json_encode(['success' => true, 'message' => 'All datasets successfully cleared from MySQL DB!']);
    exit;
}
