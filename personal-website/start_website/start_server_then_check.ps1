$ErrorActionPreference = 'Stop'
$php = 'D:\php\php.exe'
$site = 'D:\Microsoft VS Code\personal-website'
Write-Output "Starting PHP dev server: $php -S 0.0.0.0:8000 -t $site"
Start-Process -FilePath $php -ArgumentList ('-S','0.0.0.0:8000','-t',$site) -WindowStyle Hidden
Start-Sleep -Milliseconds 500
Write-Output 'Now running checks:'
& "$PSScriptRoot\check_firewall_and_server.ps1"
