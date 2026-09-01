$ErrorActionPreference = "Stop"

$rules = @(
  @{ Name = "LearnHub API (TCP 3000)"; Port = 3000 },
  @{ Name = "LearnHub Expo Metro (TCP 8081)"; Port = 8081 }
)

foreach ($rule in $rules) {
  $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
  if ($existing) {
    Set-NetFirewallRule -DisplayName $rule.Name -Enabled True -Direction Inbound -Action Allow -Profile Any
    Set-NetFirewallAddressFilter -AssociatedNetFirewallRule $existing -RemoteAddress LocalSubnet
  } else {
    New-NetFirewallRule -DisplayName $rule.Name -Direction Inbound -Action Allow -Protocol TCP -LocalPort $rule.Port -Profile Any -RemoteAddress LocalSubnet | Out-Null
  }
}

Write-Output "Firewall configurado para o LearnHub nas portas 3000 e 8081."
