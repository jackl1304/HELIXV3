# Test all critical Helix endpoints
# Run this in a SEPARATE PowerShell window while dev server runs

Write-Host "`n=== Testing Helix Endpoints ===" -ForegroundColor Cyan
Write-Host "Server should be running on http://localhost:5000`n" -ForegroundColor Yellow

# Test 1: Health
Write-Host "[1/4] Testing /health..." -ForegroundColor Green
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get
    Write-Host "✅ Health check successful" -ForegroundColor Green
    $health | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 2: Ready
Write-Host "[2/4] Testing /ready..." -ForegroundColor Green
try {
    $ready = Invoke-RestMethod -Uri "http://localhost:5000/ready" -Method Get
    Write-Host "✅ Ready check successful" -ForegroundColor Green
    $ready | ConvertTo-Json -Depth 3
} catch {
    Write-Host "❌ Ready check failed: $_" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 3: Regulatory Updates (limit 3)
Write-Host "[3/4] Testing /api/regulatory-updates (limit=3)..." -ForegroundColor Green
try {
    $updates = Invoke-RestMethod -Uri "http://localhost:5000/api/regulatory-updates?limit=3" -Method Get
    Write-Host "✅ Regulatory updates successful, count: $($updates.Count)" -ForegroundColor Green

    # Check for source and publishedAt fields
    foreach ($update in $updates) {
        Write-Host "  - ID: $($update.id)" -ForegroundColor White
        Write-Host "    Source: $($update.source)" -ForegroundColor Cyan
        Write-Host "    PublishedAt: $($update.publishedAt)" -ForegroundColor Cyan
        Write-Host "    Title: $($update.title.Substring(0, [Math]::Min(60, $update.title.Length)))..." -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Regulatory updates failed: $_" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 4: Data Sources
Write-Host "[4/4] Testing /api/data-sources..." -ForegroundColor Green
try {
    $sources = Invoke-RestMethod -Uri "http://localhost:5000/api/data-sources" -Method Get
    Write-Host "✅ Data sources successful, count: $($sources.Count)" -ForegroundColor Green
    Write-Host "  First 5 sources:" -ForegroundColor White
    $sources | Select-Object -First 5 | ForEach-Object {
        Write-Host "    - $($_.name) ($($_.type))" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Data sources failed: $_" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
