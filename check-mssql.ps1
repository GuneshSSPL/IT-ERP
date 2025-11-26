# Diagnostic script to check MSSQL container status
Write-Host "🔍 Checking MSSQL Container Status..." -ForegroundColor Cyan
Write-Host ""

# Check if container exists
$containerName = "docker-demo-iterp-mssql-1"
$container = docker ps -a --filter "name=$containerName" --format "{{.Names}}"

if (-not $container) {
    Write-Host "❌ MSSQL container not found!" -ForegroundColor Red
    Write-Host "   Run: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "📊 Container Status:" -ForegroundColor Cyan
docker ps -a --filter "name=$containerName" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host ""

# Check health status
Write-Host "🏥 Health Check Status:" -ForegroundColor Cyan
$health = docker inspect --format='{{.State.Health.Status}}' $containerName 2>$null
if ($health) {
    Write-Host "   Status: $health" -ForegroundColor $(if ($health -eq "healthy") { "Green" } else { "Yellow" })
} else {
    Write-Host "   Status: No health check configured" -ForegroundColor Yellow
}
Write-Host ""

# Check logs (last 20 lines)
Write-Host "📝 Recent Logs (last 20 lines):" -ForegroundColor Cyan
docker logs --tail 20 $containerName
Write-Host ""

# Check resource usage
Write-Host "💻 Resource Usage:" -ForegroundColor Cyan
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" $containerName
Write-Host ""

# Try to connect
Write-Host "🔌 Testing Connection:" -ForegroundColor Cyan
$testResult = docker exec $containerName /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'Sipamara123!' -Q "SELECT @@VERSION" -h -1 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Connection successful!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Connection failed!" -ForegroundColor Red
    Write-Host "   Error: $testResult" -ForegroundColor Red
}
Write-Host ""

# Recommendations
Write-Host "💡 Recommendations:" -ForegroundColor Yellow
if ($health -ne "healthy") {
    Write-Host "   1. Wait 60-90 seconds for MSSQL to fully initialize" -ForegroundColor White
    Write-Host "   2. Check if you have at least 8GB RAM available" -ForegroundColor White
    Write-Host "   3. Run: docker-compose logs -f mssql" -ForegroundColor White
    Write-Host "   4. If still failing, try: docker-compose restart mssql" -ForegroundColor White
} else {
    Write-Host "   ✅ MSSQL is healthy and ready!" -ForegroundColor Green
}
Write-Host ""

