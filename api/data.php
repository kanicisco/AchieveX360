<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$request_method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($request_method === 'OPTIONS') {
    exit;
}

require_once __DIR__ . '/../db_connect.php';

$conn = get_db_connection();

if ($request_method === 'GET') {
    $action = $_GET['action'] ?? 'get_active';

    if (!$conn) {
        echo json_encode(['success' => false, 'message' => 'MySQL DB connection unvailable. Using browser LocalStorage.']);
        exit;
    }

    if ($action === 'get_active') {
        // Fetch active dataset
        $res = $conn->query("SELECT * FROM `datasets` WHERE `is_active` = 1 ORDER BY `id` DESC LIMIT 1");
        if ($res && $row = $res->fetch_assoc()) {
            $dataset_id = $row['id'];
            
            // Fetch outlets
            $outlets_res = $conn->query("SELECT * FROM `outlets` WHERE `dataset_id` = $dataset_id");
            $outlets = [];
            while ($o = $outlets_res->fetch_assoc()) {
                $o['monthly_data'] = json_decode($o['monthly_data_json'], true);
                unset($o['monthly_data_json']);
                $outlets[] = $o;
            }

            echo json_encode([
                'success' => true,
                'dataset' => [
                    'id' => $row['id'],
                    'filename' => $row['filename'],
                    'title' => $row['title'],
                    'years' => json_decode($row['years_json'], true) ?: [],
                    'half_years' => json_decode($row['half_years_json'], true) ?: [],
                    'quarters' => json_decode($row['quarters_json'], true) ?: [],
                    'months' => json_decode($row['months_json'], true) ?: [],
                    'categories' => json_decode($row['categories_json'], true) ?: [],
                    'mapping' => json_decode($row['mapping_json'], true) ?: [],
                    'records_count' => $row['records_count'],
                    'created_at' => $row['created_at']
                ],
                'outlets' => $outlets
            ]);
            exit;
        } else {
            echo json_encode(['success' => false, 'message' => 'No active dataset found in MySQL.']);
            exit;
        }
    }
} else if ($request_method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? 'save_dataset';

    if (!$conn) {
        echo json_encode(['success' => false, 'error' => 'Database connection failed.']);
        exit;
    }

    if ($action === 'save_dataset') {
        $meta = $input['dataset'];
        $outlets = $input['outlets'];

        // Deactivate existing
        $conn->query("UPDATE `datasets` SET `is_active` = 0");

        $filename = $conn->real_escape_string($meta['filename'] ?? 'Workbook.xlsx');
        $title = $conn->real_escape_string($meta['title'] ?? 'Activity Outlet Achievement');
        $years_json = $conn->real_escape_string(json_encode($meta['years'] ?? []));
        $half_years_json = $conn->real_escape_string(json_encode($meta['half_years'] ?? []));
        $quarters_json = $conn->real_escape_string(json_encode($meta['quarters'] ?? []));
        $months_json = $conn->real_escape_string(json_encode($meta['months'] ?? []));
        $categories_json = $conn->real_escape_string(json_encode($meta['categories'] ?? []));
        $mapping_json = $conn->real_escape_string(json_encode($meta['mapping'] ?? []));
        $records_count = count($outlets);

        $sql_ins = "INSERT INTO `datasets` (`filename`, `title`, `years_json`, `half_years_json`, `quarters_json`, `months_json`, `categories_json`, `mapping_json`, `records_count`, `is_active`) 
                    VALUES ('$filename', '$title', '$years_json', '$half_years_json', '$quarters_json', '$months_json', '$categories_json', '$mapping_json', $records_count, 1)";
        
        if ($conn->query($sql_ins)) {
            $dataset_id = $conn->insert_id;

            // Insert outlets
            $stmt = $conn->prepare("INSERT INTO `outlets` (`dataset_id`, `distributor_code`, `distributor_name`, `sse`, `dsr`, `retailer_code`, `retailer_name`, `urc`, `activity`, `slab`, `monthly_data_json`, `total_target`, `total_achievement`, `achievement_pct`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

            foreach ($outlets as $o) {
                $d_code = $o['distributor_code'] ?? '';
                $d_name = $o['distributor_name'] ?? '';
                $sse = $o['sse'] ?? '';
                $dsr = $o['dsr'] ?? '';
                $r_code = $o['retailer_code'] ?? '';
                $r_name = $o['retailer_name'] ?? '';
                $urc = $o['urc'] ?? '';
                $act = $o['activity'] ?? '';
                $slab = $o['slab'] ?? '';
                $m_json = json_encode($o['monthly_data'] ?? []);
                $t_target = floatval($o['total_target'] ?? 0);
                $t_ach = floatval($o['total_achievement'] ?? 0);
                $t_pct = floatval($o['achievement_pct'] ?? 0);

                $stmt->bind_param("issssssssssddd", $dataset_id, $d_code, $d_name, $sse, $dsr, $r_code, $r_name, $urc, $act, $slab, $m_json, $t_target, $t_ach, $t_pct);
                $stmt->execute();
            }

            echo json_encode(['success' => true, 'dataset_id' => $dataset_id, 'message' => 'Dataset saved successfully in MySQL!']);
            exit;
        } else {
            echo json_encode(['success' => false, 'error' => $conn->error]);
            exit;
        }
    }
}
