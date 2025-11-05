<?php
session_start();

// Admin passphrase is intentionally disabled by default for privacy.
// To enable admin access set the PROJECTS_ADMIN_PASSPHRASE environment variable
// or edit this file and set $ADMIN_PASSPHRASE. Leaving it empty disables admin UI.
$ADMIN_PASSPHRASE = getenv('Lv2!23256789') ?: '';
$projectsFile = __DIR__ . '/projects.json';
$imagesDir = __DIR__ . '/images/projects';

if (!is_dir($imagesDir)) {
    mkdir($imagesDir, 0777, true);
}

$errors = [];
$success = null;

// Handle login form (only if passphrase is set)
if ($ADMIN_PASSPHRASE !== '' && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'login') {
    $pass = $_POST['passphrase'] ?? '';
    if ($pass === $ADMIN_PASSPHRASE) {
        $_SESSION['projects_admin_authenticated'] = true;
    } else {
        $errors[] = 'Incorrect passphrase.';
    }
}

// Handle logout
if (isset($_GET['logout'])) {
    unset($_SESSION['projects_admin_authenticated']);
    header('Location: projects_admin.php');
    exit;
}

// Handle project submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'add' && !empty($_SESSION['projects_admin_authenticated'])) {
    $title = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $link = trim($_POST['link'] ?? '');
    $tagsRaw = trim($_POST['tags'] ?? '');
    $tags = array_values(array_filter(array_map('trim', explode(',', $tagsRaw))));

    if ($title === '') { $errors[] = 'Title is required.'; }
    if ($description === '') { $errors[] = 'Description is required.'; }

    $savedImage = '';
    if (isset($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE) {
        $file = $_FILES['image'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errors[] = 'Image upload error.';
        } else {
            // Basic checks
            if ($file['size'] > 2 * 1024 * 1024) {
                $errors[] = 'Image is too large (max 2MB).';
            } else {
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $mime = finfo_file($finfo, $file['tmp_name']);
                finfo_close($finfo);
                $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif'];
                if (!isset($allowed[$mime])) {
                    $errors[] = 'Unsupported image type. Use JPG, PNG or GIF.';
                } else {
                    $ext = $allowed[$mime];
                    $base = preg_replace('/[^a-z0-9_-]+/i', '-', pathinfo($file['name'], PATHINFO_FILENAME));
                    $name = time() . '-' . substr(bin2hex(random_bytes(6)),0,8) . '-' . $base . '.' . $ext;
                    $target = $imagesDir . '/' . $name;
                    if (!move_uploaded_file($file['tmp_name'], $target)) {
                        $errors[] = 'Failed to move uploaded image.';
                    } else {
                        $savedImage = 'images/projects/' . $name;
                    }
                }
            }
        }
    }

    if (empty($errors)) {
        $entry = [
            'title' => $title,
            'description' => $description,
            'link' => $link,
            'tags' => $tags,
            'image' => $savedImage,
        ];

        $all = [];
        if (is_readable($projectsFile)) {
            $raw = file_get_contents($projectsFile);
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) { $all = $decoded; }
        }
        $all[] = $entry;
        // write atomically
        $tmp = $projectsFile . '.tmp';
        file_put_contents($tmp, json_encode($all, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        rename($tmp, $projectsFile);
        $success = 'Project added successfully.';
    }
}

$authenticated = !empty($_SESSION['projects_admin_authenticated']);
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Projects Admin</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="wrap">
        <header class="site-header">
            <h1 class="site-title">Projects Admin</h1>
            <nav class="main-nav"><a href="index.php">Home</a></nav>
        </header>

        <main class="card">
            <?php if (!$authenticated): ?>
                <h2>Admin</h2>
                <?php if ($ADMIN_PASSPHRASE === ''): ?>
                    <div class="notice muted">The admin interface is disabled. Set the <code>PROJECTS_ADMIN_PASSPHRASE</code> environment variable or edit this file to enable it.</div>
                <?php else: ?>
                    <?php if (!empty($errors)): ?>
                        <div class="notice error"><ul><?php foreach ($errors as $e) echo '<li>'.htmlspecialchars($e).'</li>'; ?></ul></div>
                    <?php endif; ?>
                    <form method="post">
                        <input type="hidden" name="action" value="login">
                        <label>Passphrase
                            <input type="password" name="passphrase" autocomplete="off">
                        </label>
                        <div><button type="submit">Sign in</button></div>
                    </form>
                <?php endif; ?>
            <?php else: ?>
                <p><a href="?logout=1">Sign out</a></p>
                <h2>Add a project</h2>
                <?php if ($success): ?><div class="notice success"><?=htmlspecialchars($success)?></div><?php endif; ?>
                <?php if (!empty($errors)): ?><div class="notice error"><ul><?php foreach ($errors as $e) echo '<li>'.htmlspecialchars($e).'</li>'; ?></ul></div><?php endif; ?>

                <form method="post" enctype="multipart/form-data">
                    <input type="hidden" name="action" value="add">
                    <label>Title
                        <input type="text" name="title" required>
                    </label>
                    <label>Description
                        <textarea name="description" rows="4" required></textarea>
                    </label>
                    <label>Link (optional)
                        <input type="url" name="link">
                    </label>
                    <label>Tags (comma separated)
                        <input type="text" name="tags">
                    </label>
                    <label>Image (optional, JPG/PNG/GIF, max 2MB)
                        <input type="file" name="image" accept="image/*">
                    </label>
                    <div><button type="submit">Add project</button></div>
                </form>
            <?php endif; ?>
        </main>

        <footer class="site-footer"><div class="wrap"><p class="muted">Admin page for local use only.</p></div></footer>
    </div>
</body>
</html>
