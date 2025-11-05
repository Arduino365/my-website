Side Scroller — quick notes

This small HTML5 Canvas game is designed to be anonymous-friendly and easy to deploy.

Anonymity and privacy
- The game front-end does not collect personal data by default. It asks only for a player name to display on the leaderboard — avoid entering personal identifiers if you want to remain anonymous.
- The backend stores scores in a database. By default this repository uses SQLite (`leaderboard.sqlite`). Add `leaderboard.sqlite` to `.gitignore` (already included) so you don't commit that file to GitHub.
- The contact form stores messages to `data/contacts.json` by default; remove or empty that file before publishing if it contains any personal messages.

Deploying
- For shared hosts (000webhost, vs), use MySQL and set the credentials in `db_config.php` or as environment variables. Import `leaderboard.sql` to create the table.
- Upload `side_scroller` folder to your site root and test `https://your-site.example/side_scroller/index.html`.

Local test
1. From `personal-website` run:
   php -S localhost:8000 -t .
2. Open `http://localhost:8000/side_scroller/index.html` and play.

GitHub & portfolio
- Before pushing to GitHub remove any files that contain personal data (for example `data/contacts.json`, photos in `images/`, or `leaderboard.sqlite`). The included `.gitignore` already ignores these by default.
