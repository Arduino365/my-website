Personal website (HTML/CSS/PHP)

This is a small personal website scaffold using plain PHP for templating and a JSON file for projects.

How to run locally (requires PHP 7.4+):

1. Open a terminal in this folder (`personal-website`).
2. Run the built-in PHP server:

	php -S localhost:8000 -t .

3. Open http://localhost:8000 in your browser.

Files to edit:
- `index.php` — home page and project listing.
- `projects.json` — add your projects here as JSON objects.
- `contact.php` — contact form; submissions are saved to `data/contacts.json`.
- `styles.css` — site styles.

Notes and next steps:
- Replace the placeholder bio in `index.php` with your real bio and add a photo if you like.
- Edit `projects.json` to add project entries with `title`, `description`, `link` and optional `tags`.
- If you want the contact form to send real emails, configure a mail transport (or use an API like SendGrid) and modify `contact.php` appropriately.

Side-scroller game integration
----------------------------

I added a small HTML5 Canvas game at `side_scroller/index.html` with a mobile-friendly responsive canvas and a simple leaderboard system.

Files added:
- `side_scroller/index.html` — game page (canvas + UI overlays)
- `side_scroller/styles.css` — styles for the page
- `side_scroller/game.js` — optimized game logic (mobile-friendly, DPR scaling, audio hooks)
- `side_scroller/assets/` — place audio assets here (jump.mp3, orb.mp3, hit.mp3) if you want sounds
- `save_score.php` — endpoint to save scores
- `get_leaderboard.php` — endpoint to fetch top scores (JSON)
- `db_config.php` — database configuration (defaults to SQLite file `leaderboard.sqlite`)
- `leaderboard.sql` — MySQL schema you can run on hosts that supply MySQL

How it stores scores
- By default `db_config.php` uses SQLite and will create `leaderboard.sqlite` in this folder and the `leaderboard` table automatically.
- If you prefer MySQL (common on free hosts), edit `db_config.php` or set environment variables and switch `DB_TYPE` to `mysql`. Use `leaderboard.sql` to create the table.

Quick local test
1. From this folder run PHP built-in server:

	 php -S localhost:8000 -t .

2. Open http://localhost:8000/side_scroller/index.html

Uploading to a free PHP host (000webhost / similar)
-------------------------------------------------
1. Create an account and a site on 000webhost (or other free PHP host). They usually provide a MySQL database.
2. Upload the contents of this folder (use their file manager or FTP). Put the `side_scroller` folder at the site root.
3. If using MySQL: create a MySQL database and user via the host control panel, then import `leaderboard.sql` (using phpMyAdmin) and update `db_config.php` with your MySQL credentials and set `DB_TYPE` to `mysql`.
4. If your host supports SQLite you can just upload as-is and ensure the webserver user can write the `leaderboard.sqlite` file.
5. Visit `https://your-site.example/side_scroller/index.html` to play and submit scores.

Security notes
- The example leaderboard endpoints are intentionally minimal. For public-facing installations consider:
	- rate limiting / spam prevention
	- input validation and size limits (already in place, but you can harden further)
	- anti-cheat (server-side score validation) if needed


Accessing the site from other devices on your LAN
-------------------------------------------------

1. I started the PHP dev server bound to all interfaces (0.0.0.0) on port 8000. To access the site from another device on the same network, open a browser on that device and visit:

	http://<your-local-ip>:8000

	Example: find your machine's local IP (via `ipconfig`) and use `http://<your-local-ip>:8000` to connect from other devices on the same LAN. Alternatively use `localhost` or `127.0.0.1` when testing on the same machine.

2. If you cannot connect from another device, two common causes are:
	- Windows Firewall blocking inbound connections on port 8000.
	- The other device is on a different network (e.g., mobile on cellular, VPN differences).

3. To open port 8000 in Windows Firewall (requires admin), run in an elevated PowerShell:

	New-NetFirewallRule -DisplayName "Allow PHP dev server 8000" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8000

4. For public access (Internet), consider deploying this site to a hosting provider, or use a tunnel service (ngrok, cloudflared) — do not expose your dev machine directly unless you understand the security risks.

Admin interface for adding projects (local only)
------------------------------------------------

You can add projects from your browser using the admin page I added:

1. Open the admin page in your browser while the dev server is running:

	http://localhost:8000/projects_admin.php

2. Sign in: the admin passphrase is not set by default for safety. To enable the admin page, set a passphrase by editing `projects_admin.php` or by setting the `PROJECTS_ADMIN_PASSPHRASE` environment variable on your host.

3. Fill in Title, Description, optional Link, Tags (comma-separated), and an optional image (JPG/PNG/GIF, max 2MB). Submit to append the project to `projects.json` and upload the image to `images/projects/`.

Security note: the admin page uses a simple passphrase for convenience on local machines. Do not expose this admin page to the public internet without adding stronger authentication (HTTPS and a proper login system).



