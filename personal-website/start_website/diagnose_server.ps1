$ErrorActionPreference = 'Stop'
Write-Output "--- Killing existing php processes (if any) ---"
Get-Process -Name php -ErrorAction SilentlyContinue | ForEach-Object { Write-Output ("Stopping pid: " + $_.Id); Stop-Process -Id $_.Id -Force }

Write-Output "`n--- Firewall rule (if present) ---"
Get-NetFirewallRule -DisplayName 'Allow PHP dev server 8000' -ErrorAction SilentlyContinue | Select-Object DisplayName,Enabled,Direction,Action,Profile | Format-Table -AutoSize

$php = 'D:\\php\\php.exe'
$site = 'D:\\Microsoft VS Code\\personal-website'
Write-Output "`n--- Starting PHP dev server with working directory set to project folder ---"
$proc = Start-Process -FilePath $php -ArgumentList ('-S','0.0.0.0:8000','-t','.') -WorkingDirectory $site -PassThru -WindowStyle Hidden
Start-Sleep -Milliseconds 700

if ($proc -and -not $proc.HasExited) {
    Write-Output "PHP process started. PID: $($proc.Id)"
} else {
    Write-Output "Process did not stay running or failed to start."
}

Write-Output "`n--- PHP processes ---"
Get-Process -Name php -ErrorAction SilentlyContinue | Select-Object Id,ProcessName,StartTime | Format-Table -AutoSize

Write-Output "`n--- Netstat entries for :8000 ---"
netstat -aon | Select-String ':8000'

Write-Output "`n--- Trying local request to http://127.0.0.1:8000 ---"
try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000' -UseBasicParsing -TimeoutSec 5
    Write-Output "Status: $($r.StatusCode)"
    Write-Output "Headers:"
    $r.Headers | Format-List
} catch {
    Write-Output "Local request failed: $($_.Exception.Message)"
}

Write-Output "`n--- Local IPs ---"
ipconfig | Select-String 'IPv4' -Context 0,0
