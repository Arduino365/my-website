<?php
// get_leaderboard.php
header('Content-Type: application/json');
require_once __DIR__ . '/db_config.php';
try {
    $pdo = get_db();
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 20;
    $stmt = $pdo->prepare('SELECT name, score, mode, created_at FROM leaderboard ORDER BY score DESC, created_at ASC LIMIT :limit');
    // bindValue with PDO::PARAM_INT
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($rows ?: []);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error'=>$e->getMessage()]);
}
