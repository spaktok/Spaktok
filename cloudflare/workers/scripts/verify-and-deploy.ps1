# Usage: Right-click -> Run with PowerShell
# Prompts for a Cloudflare API token, verifies it, sets env var, then deploys the Worker.

param(
    [Parameter(Mandatory=$false)][string]$Token
)

if (-not $Token) {
    $Token = Read-Host -AsSecureString "Enter Cloudflare API Token"
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Token)
    $TokenPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
} else {
    $TokenPlain = $Token
}

# Verify token with curl.exe (not Invoke-WebRequest)
$env:CF_API_TOKEN = $TokenPlain
Write-Host "Verifying token..." -ForegroundColor Cyan
try {
    $verify = & curl.exe -sS -H "Authorization: Bearer $env:CF_API_TOKEN" https://api.cloudflare.com/client/v4/user/tokens/verify
    Write-Host $verify
} catch {
    Write-Error "Failed to verify token via curl.exe. $_"
}

# Set token for wrangler
$env:CLOUDFLARE_API_TOKEN = $TokenPlain

Write-Host "Running wrangler whoami..." -ForegroundColor Cyan
npx wrangler whoami

# Optional: set Stream token secret (interactive)
# npx wrangler secret put CLOUDFLARE_STREAM_API_TOKEN

Write-Host "Deploying Worker..." -ForegroundColor Cyan
npx wrangler deploy
