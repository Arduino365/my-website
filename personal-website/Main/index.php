<?php
$projects = [];
$projectsFile = __DIR__ . '/projects.json';
if (is_readable($projectsFile)) {
	$raw = file_get_contents($projectsFile);
	$decoded = json_decode($raw, true);
	if (is_array($decoded)) {
		$projects = $decoded;
	}
}
?>
<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width,initial-scale=1">
	<title>Personal Website</title>
	<link rel="stylesheet" href="styles.css">
	<meta name="description" content="A short bio and portfolio page">
	<meta name="robots" content="index,follow">
	<meta property="og:title" content="Personal Website — Portfolio">
</head>
<body>
	<header class="site-header">
		<div class="wrap">
			<h1 class="site-title">Personal Website</h1>
			<nav class="main-nav">
				<a href="#bio">Home</a>
				<a href="#projects">Projects</a>
				<a href="contact.php">Contact</a>
			</nav>
		</div>
	</header>

	<main class="wrap">
		<section id="bio" class="card">
			<h2>About this site</h2>
			<p>This site showcases a collection of small development projects and demos, including robotics experiments, web applications, and prototype tools. It is intended to demonstrate technical skills and design approaches in an anonymous, privacy-focused way.</p>
			<p>If you want to get in touch, use the contact form — avoid sharing personal identifying details if you prefer to remain anonymous.</p>
		</section>

		<section id="projects" class="card">
			<h2>Projects</h2>
			<?php if (empty($projects)): ?>
				<p>No projects found yet. Edit <code>projects.json</code> to add your projects. Example fields: <code>title</code>, <code>description</code>, <code>link</code>, <code>tags</code>.</p>
			<?php else: ?>
				<div class="projects-grid">
				<?php foreach ($projects as $proj): ?>
					<article class="project">
						<h3><?= htmlspecialchars($proj['title'] ?? 'Untitled') ?></h3>
						<p class="meta"><?= htmlspecialchars(implode(' • ', $proj['tags'] ?? [])) ?></p>
						<p><?= nl2br(htmlspecialchars($proj['description'] ?? '')) ?></p>
						<?php if (!empty($proj['link'])): ?>
							<p><a href="<?= htmlspecialchars($proj['link']) ?>" target="_blank" rel="noopener">View project</a></p>
						<?php endif; ?>
					</article>
				<?php endforeach; ?>
				</div>
			<?php endif; ?>
		</section>
	</main>

	<footer class="site-footer">
		<div class="wrap">
		</div>
	</footer>
</body>
</html>

