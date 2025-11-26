# Quick Fix Script for MSSQL Container Issue
# Run this script to fix the MSSQL container problem

Write-Host "🔧 Fixing MSSQL Container Configuration..." -ForegroundColor Yellow
Write-Host ""

# Step 1: Stop and remove containers
Write-Host "Step 1: Stopping and removing containers..." -ForegroundColor Cyan
docker-compose down -v

Write-Host ""
Write-Host "Step 2: Starting with fixed configuration..." -ForegroundColor Cyan
Write-Host ""

# Step 2: Start with updated docker-compose.yml
docker-compose up -d

Write-Host ""
Write-Host "⏳ Waiting for MSSQL to initialize (this takes 60-90 seconds)..." -ForegroundColor Yellow
Write-Host ""

# Wait a bit
Start-Sleep -Seconds 15

# Check status
Write-Host "📊 Container Status:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "📝 Monitoring MSSQL logs (press Ctrl+C to stop):" -ForegroundColor Yellow
Write-Host "   Run this in another terminal: docker-compose logs -f mssql" -ForegroundColor White
Write-Host ""
Write-Host "✅ Fix applied! MSSQL should be healthy in 60-90 seconds." -ForegroundColor Green
Write-Host ""
Write-Host "🔑 Updated Database Password: Sipamara123!" -ForegroundColor Cyan
Write-Host "🌐 Access: http://localhost:3000" -ForegroundColor Cyan
Write-Host "👤 Login: admin@iterp.com / admin123" -ForegroundColor Cyan
Write-Host ""

