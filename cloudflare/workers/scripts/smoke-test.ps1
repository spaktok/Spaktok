param(
  [Parameter(Mandatory=$false)][string]$BaseUrl
)

if (-not $BaseUrl) {
  $BaseUrl = Read-Host "Enter Worker base URL (e.g., https://spaktok-edge.<subdomain>.workers.dev)"
}

function Invoke-Json($Method, $Url, $Body) {
  if ($Body) {
    return Invoke-RestMethod -Method $Method -Uri $Url -ContentType 'application/json' -Body ($Body | ConvertTo-Json -Depth 10)
  } else {
    return Invoke-RestMethod -Method $Method -Uri $Url
  }
}

Write-Host "Testing $BaseUrl" -ForegroundColor Cyan

# Payment intent (will fail if no STRIPE_SECRET configured)
try {
  $payment = Invoke-Json POST "$BaseUrl/api/payment-intent" @{ amount = 100; currency = 'usd' }
  Write-Host "payment-intent: OK" -ForegroundColor Green
} catch {
  Write-Warning "payment-intent: ${_}"
}

# Stream direct upload
try {
  $stream = Invoke-Json POST "$BaseUrl/api/stream/upload" $null
  if ($stream -and $stream.uploadURL) { Write-Host "stream/upload: OK" -ForegroundColor Green } else { Write-Warning "stream/upload: unexpected response" }
} catch {
  Write-Warning "stream/upload: ${_}"
}

# Agora token (fallback to memory/KV)
try {
  $agora = Invoke-Json GET "$BaseUrl/api/agora/token" $null
  if ($agora -and $agora.token) { Write-Host "agora/token: OK" -ForegroundColor Green } else { Write-Warning "agora/token: unexpected response" }
} catch {
  Write-Warning "agora/token: ${_}"
}

# Image optimize placeholder
try {
  $img = Invoke-Json GET "$BaseUrl/api/image/optimize?src=https://example.com/test.jpg" $null
  if ($img -and $img.optimized) { Write-Host "image/optimize: OK" -ForegroundColor Green } else { Write-Warning "image/optimize: unexpected response" }
} catch {
  Write-Warning "image/optimize: ${_}"
}

# Gift send enqueues event (will be NO-QUEUE if not bound)
try {
  $gift = Invoke-Json POST "$BaseUrl/api/gift/send" @{ giftId = 'g1'; senderId = 'u1'; receiverId='u2'; context='chat'; priceCoins=1 }
  if ($gift -and $gift.queued -ne $null) { Write-Host "gift/send: OK (queued=$($gift.queued))" -ForegroundColor Green } else { Write-Warning "gift/send: unexpected response" }
} catch {
  Write-Warning "gift/send: ${_}"
}

Write-Host "Smoke tests finished." -ForegroundColor Cyan
