<?php
// Configuration for AchieveX 360 PHP & MySQL backend
define('DB_HOST', '127.0.0.1');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'achievex_360');

function get_db_connection() {
    static $conn = null;
    if ($conn === null) {
        $conn = @new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        if ($conn->connect_error) {
            return null; // Return null so app can gracefully fall back to client-side storage if DB fails
        }
        $conn->set_charset("utf8mb4");
    }
    return $conn;
}
