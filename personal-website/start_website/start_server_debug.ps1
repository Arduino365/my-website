$ErrorActionPreference = 'Stop'
$php = 'D:\php\php.exe'
$site = 'D:\Microsoft VS Code\personal-website'
Write-Output "Attempting to start PHP dev server on 0.0.0.0:8000"
$proc = Start-Process -FilePath $php -ArgumentList ('-S','0.0.0.0:8000','-t',$site) -PassThru -WindowStyle Hidden
Start-Sleep -Milliseconds 500
if ($proc -and -not $proc.HasExited) {
    Write-Output "PHP process started. PID: $($proc.Id)"
} else {
    Write-Output 'Process did not stay running or failed to start.'
}
Write-Output ''
Write-Output 'Netstat for :8000'
netstat -aon | Select-String ':8000'
Write-Output ''
Write-Output 'Process list (php)'
Get-Process -Name php -ErrorAction SilentlyContinue | Select-Object Id,ProcessName,StartTime | Format-Table -AutoSize
