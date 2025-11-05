<#
prepare_for_publish.ps1

Safety-first PowerShell helper to prepare this repository for publishing.
It can:
- list common sensitive files (contacts, local DB, project images)
- optionally delete or empty them
- git rm --cached them so they won't be committed
- commit the cleanup
- optionally purge them from Git history using git-filter-repo or BFG (if available)

IMPORTANT: Rewriting Git history is destructive. The script will create a ZIP backup of the repo before attempting any history rewrite.

Run from the repository root (d:\Microsoft VS Code\personal-website)

Usage:
  .\prepare_for_publish.ps1

#>
Set-StrictMode -Version Latest
cd $PSScriptRoot

function Prompt-YesNo($msg){
    $r = Read-Host "$msg [y/N]"
    return $r -match '^[Yy]'
}

Write-Output "Prepare for publish helper — running in: $PWD"

# Patterns to consider sensitive
$sensitivePaths = @(
    'leaderboard.sqlite',
    'leaderboard.sqlite-journal',
    'data/contacts.json',
    'images/projects',
    '.env'
)

Write-Output "Checking for sensitive files..."
$found = @()
foreach ($p in $sensitivePaths) {
    $matches = Get-ChildItem -Path $p -Recurse -Force -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName -ErrorAction SilentlyContinue
    if ($matches) { $found += $matches }
}

if (-not $found) { Write-Output "No sensitive files found by the default patterns." } else {
    Write-Output "Found the following sensitive files/folders:"; $found | ForEach-Object { Write-Output " - $_" }
}

Write-Output "\nRecommended actions:\n 1) Review the list above.
 2) Delete or empty any files you don't want in the published repo.
 3) The script can untrack these files from Git and optionally purge them from history (requires git-filter-repo or BFG)."

if (-not (Test-Path .git)) {
    Write-Warning "This folder does not appear to be a Git repository (no .git directory). The script will still offer to delete/empty files, but Git operations will be skipped."
}

if (Prompt-YesNo "Do you want me to (A) interactively delete/empty sensitive files now? (y) or skip (n)") {
    foreach ($f in $found) {
        Write-Output "\nFile: $f"
        $choice = Read-Host "Action: [d]elete, [e]mpty, [k]eep (d/e/k)"
        switch ($choice) {
            'd' { Remove-Item -LiteralPath $f -Recurse -Force -ErrorAction SilentlyContinue; Write-Output "Deleted $f" }
            'e' {
                if (Test-Path $f -PathType Container) {
                    # remove files inside
                    Get-ChildItem -Path $f -Recurse -Force | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
                    Write-Output "Emptied directory $f"
                } else {
                    Set-Content -Path $f -Value '' -Encoding utf8
                    Write-Output "Emptied file $f"
                }
            }
            default { Write-Output "Kept $f" }
        }
    }
} else { Write-Output "Skipped file deletion/emptying." }

# If repo, untrack these patterns using .gitignore and git rm --cached
if (Test-Path .git) {
    Write-Output "\nWill add sensitive paths to .gitignore and untrack them from Git index."
    if (Prompt-YesNo "Proceed to add to .gitignore and run git rm --cached for found paths?") {
        # Ensure .gitignore exists
        if (-not (Test-Path .gitignore)) { "# ignore sensitive local files" | Out-File -FilePath .gitignore -Encoding utf8 }
        foreach ($p in $sensitivePaths) {
            if (-not (Select-String -Path .gitignore -Pattern ([regex]::Escape($p)) -SimpleMatch -Quiet)) {
                Add-Content -Path .gitignore -Value $p
                Write-Output "Added $p to .gitignore"
            }
        }
        # Run git rm --cached for each found file
        foreach ($f in $found) {
            Write-Output "Untracking $f"
            git rm --cached --ignore-unmatch --force -- "$f" 2>$null
        }
        Write-Output "Committing changes (cleanup commit)"
        git add .gitignore
        git commit -m "chore: remove sensitive local files and add to .gitignore" --quiet
    } else { Write-Output "Skipped untracking step." }
}

# Offer to purge history
if (Test-Path .git -and $found.Count -gt 0) {
    Write-Output "\nHistory purge will rewrite Git history and require force-push. This is destructive and will affect collaborators."
    if (Prompt-YesNo "Do you want to purge these paths from Git history now? (requires git-filter-repo or BFG)") {
        # create backup
        $ts = (Get-Date).ToString('yyyyMMdd-HHmmss')
        $backup = "repo-backup-$ts.zip"
        Write-Output "Creating ZIP backup: $backup (this may take a while)"
        Compress-Archive -Path * -DestinationPath $backup -Force

        # Prepare paths file for git-filter-repo
        $pathsFile = "$PSScriptRoot\paths-to-remove.txt"
        $foundRelative = $found | ForEach-Object { Resolve-Path -LiteralPath $_ | ForEach-Object { $_.Path.Replace(($PWD.Path + '\'), '') } }
        $foundRelative | Out-File -FilePath $pathsFile -Encoding utf8

        # detect git-filter-repo
        $hasFilterRepo = $false
        try { & git filter-repo --help > $null 2>&1; $hasFilterRepo = $LASTEXITCODE -eq 0 } catch { $hasFilterRepo = $false }

        if ($hasFilterRepo) {
            Write-Output "Running git-filter-repo to remove paths listed in $pathsFile"
            # Run filter-repo
            & git filter-repo --paths-from-file $pathsFile --invert-paths
            Write-Output "git-filter-repo completed. You must force-push to overwrite remote history."
            if (Prompt-YesNo "Run 'git push --force --all' and 'git push --force --tags' now?") {
                git push --force --all
                git push --force --tags
            } else { Write-Output "Skipped force-push. Remember to push when ready." }
        } else {
            Write-Warning "git-filter-repo not found. The script can show BFG instructions or you can install git-filter-repo (recommended)."
            Write-Output "If you want to use BFG (requires Java and bfg.jar):"
            Write-Output "  1) Download bfg.jar (https://rtyley.github.io/bfg-repo-cleaner/)"
            Write-Output "  2) Run: java -jar bfg.jar --delete-files paths-to-remove.txt"
            Write-Output "  3) Then run: git reflog expire --expire=now --all && git gc --prune=now --aggressive"
            Write-Output "  4) Finally: git push --force --all && git push --force --tags"
        }
    } else { Write-Output "Skipped history purge." }
}

Write-Output "Prepare-for-publish complete. Review changes and push when ready." 
