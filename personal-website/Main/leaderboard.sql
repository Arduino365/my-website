-- SQL schema for MySQL (if using MySQL host)
CREATE TABLE IF NOT EXISTS leaderboard (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  score INT NOT NULL,
  mode VARCHAR(32) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- For SQLite the PHP will auto-create the table named 'leaderboard' if it does not exist.
