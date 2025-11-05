<?php
// db_config.php
// Configure here. Two options supported: sqlite (default) or mysql.

// Example for SQLite (default): creates leaderboard.sqlite in the same folder
$DB_TYPE = getenv('DB_TYPE') ?: 'sqlite'; // 'sqlite' or 'mysql'

if ($DB_TYPE === 'mysql') {
    // MySQL config: set these either by editing or via environment variables on host
    $DB_HOST = getenv('DB_HOST') ?: 'localhost';
    $DB_NAME = getenv('DB_NAME') ?: 'your_db_name';
    $DB_USER = getenv('DB_USER') ?: 'your_user';
    $DB_PASS = getenv('DB_PASS') ?: 'your_pass';
    $dsn = "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4";
    $opts = [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC];
    function get_db(){ global $dsn,$DB_USER,$DB_PASS,$opts; return new PDO($dsn, $DB_USER, $DB_PASS, $opts); }
} else {
    $dbfile = __DIR__ . '/leaderboard.sqlite';
    $dsn = 'sqlite:' . $dbfile;
    $opts = [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC];
    function get_db(){ global $dsn,$opts; $pdo = new PDO($dsn, null, null, $opts);
        // Ensure table exists
        $pdo->exec("CREATE TABLE IF NOT EXISTS leaderboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            score INTEGER NOT NULL,
            mode TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");
        return $pdo;
    }
}
