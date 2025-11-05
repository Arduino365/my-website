$ErrorActionPreference = 'Stop'
$ruleName = 'Allow PHP dev server 8000'
if (Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue) {
    Write-Output "$ruleName already exists."
    exit 0
}

New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8000 -Profile Any -Description 'Allow PHP dev server for local development'
Write-Output "Firewall rule '$ruleName' created."
