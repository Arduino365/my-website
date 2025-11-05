$ErrorActionPreference = 'Stop'
Write-Output 'Killing php.exe processes (if any)...'
Get-Process -Name php -ErrorAction SilentlyContinue | ForEach-Object { Write-Output ("Killing pid: " + $_.Id); Stop-Process -Id $_.Id -Force }
Start-Sleep -Milliseconds 200
$sitePath = 'D:\Microsoft VS Code\personal-website'
$phpExe = 'D:\php\php.exe'
Write-Output "Starting PHP dev server: $phpExe -S 0.0.0.0:8000 -t \"$sitePath\""
# Start the server detached
Start-Process -FilePath $phpExe -ArgumentList ('-S','0.0.0.0:8000','-t', $sitePath) -WindowStyle Hidden
Start-Sleep -Milliseconds 400
Write-Output 'Issued start command. Active php processes:'
Get-Process -Name php -ErrorAction SilentlyContinue | Select-Object Id,ProcessName | Format-Table -AutoSize
