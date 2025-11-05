Write-Output 'Firewall rule:'
try { Get-NetFirewallRule -DisplayName 'Allow PHP dev server 8000' -ErrorAction Stop | Select DisplayName,Enabled,Direction,Action,Profile | Format-Table -AutoSize } catch { Write-Output 'Not found' }

Write-Output "`nPHP processes:"
Get-Process -Name php -ErrorAction SilentlyContinue | Select-Object Id,ProcessName,StartTime | Format-Table -AutoSize

Write-Output "`nNetstat entries for :8000"
netstat -aon | Select-String ':8000'

Write-Output "`nLocal IPv4 addresses:"
ipconfig | Select-String 'IPv4' -Context 0,0
