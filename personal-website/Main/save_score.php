<?php
// save_score.php
// Accepts JSON POST: { name, score, mode }
header('Content-Type: application/json');
try {
    $raw = file_get_contents('php://input');
    if (!$raw) throw new Exception('No input');
    $data = json_decode($raw, true);
    if (!$data) throw new Exception('Invalid JSON');
    $name = trim(substr($data['name'] ?? 'Anon', 0, 64));
    $score = intval($data['score'] ?? 0);
    $mode = trim(substr($data['mode'] ?? 'unknown', 0, 32));

    require_once __DIR__ . '/db_config.php';
    $pdo = get_db();

    $stmt = $pdo->prepare('INSERT INTO leaderboard (name, score, mode, created_at) VALUES (:name,:score,:mode,datetime("now"))');
    // If using MySQL, datetime("now") will not work; use CURRENT_TIMESTAMP - PDO will adapt by DSN type
    try {
        $stmt->execute([':name'=>$name, ':score'=>$score, ':mode'=>$mode]);
    } catch (Exception $e) {
        // second attempt for MySQL timestamp
        $stmt = $pdo->prepare('INSERT INTO leaderboard (name, score, mode) VALUES (:name,:score,:mode)');
        $stmt->execute([':name'=>$name, ':score'=>$score, ':mode'=>$mode]);
    }

    echo json_encode(['success'=>true]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success'=>false,'error'=> $e->getMessage()]);
}
