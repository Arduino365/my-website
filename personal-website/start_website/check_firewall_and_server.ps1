$ErrorActionPreference = 'Stop'
Write-Output "Checking firewall rule..."
$rule = Get-NetFirewallRule -DisplayName 'Allow PHP dev server 8000' -ErrorAction SilentlyContinue
if ($rule) {
    $rule | Select-Object DisplayName,Enabled,Direction,Action,Profile | Format-Table -AutoSize
} else {
    Write-Output 'Firewall rule not found.'
}

Write-Output "`nPHP processes:"
Get-Process -Name php -ErrorAction SilentlyContinue | Select-Object Id,ProcessName,StartTime | Format-Table -AutoSize

Write-Output "`nNetstat entries for :8000"
netstat -aon | Select-String ':8000'

Write-Output "`nLocal IPv4 addresses:"
ipconfig | Select-String 'IPv4' -Context 0,0
