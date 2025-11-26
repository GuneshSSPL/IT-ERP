# IT ERP System - Deployment Test Script
# This script tests the deployment and verifies all components are working

Write-Host "🧪 IT ERP System - Deployment Test" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Test Docker Compose File
Write-Host "Step 1: Validating docker-compose.yml..." -ForegroundColor Yellow
if (Test-Path "docker-compose.yml") {
    Write-Host "   ✓ docker-compose.yml exists" -ForegroundColor Green
    
    # Check for critical fixes
    $content = Get-Content "docker-compose.yml" -Raw
    
    if ($content -match "mssql-tools18") {
        Write-Host "   ✓ Healthcheck uses correct path (mssql-tools18)" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Healthcheck path may be incorrect" -ForegroundColor Red
    }
    
    if ($content -match "start_period:\s*180s") {
        Write-Host "   ✓ Start period is 180s" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Start period may be too short" -ForegroundColor Red
    }
    
    if ($content -match "mem_limit:\s*6g") {
        Write-Host "   ✓ MSSQL memory limit is 6GB" -ForegroundColor Green
    } else {
        Write-Host "   ✗ MSSQL memory limit missing or incorrect" -ForegroundColor Red
    }
    
    if ($content -match "MSSQL_MEMORY_LIMIT_MB=6144") {
        Write-Host "   ✓ MSSQL_MEMORY_LIMIT_MB is set" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ MSSQL_MEMORY_LIMIT_MB not found (optional)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✗ docker-compose.yml not found" -ForegroundColor Red
    Write-Host "   Run the deployment script first!" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 2: Check Docker is running
Write-Host "Step 2: Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "   ✓ Docker is installed: $dockerVersion" -ForegroundColor Green
    
    $dockerRunning = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Docker is running" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Docker is not running" -ForegroundColor Red
        Write-Host "   Start Docker Desktop and try again" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "   ✗ Docker is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Check if containers are running
Write-Host "Step 3: Checking container status..." -ForegroundColor Yellow
$containers = docker ps -a --filter "name=docker-demo-iterp" --format "{{.Names}} {{.Status}}"

if ($containers) {
    Write-Host "   Found containers:" -ForegroundColor Cyan
    $containers | ForEach-Object {
        if ($_ -match "healthy|Up") {
            Write-Host "   ✓ $_" -ForegroundColor Green
        } else {
            Write-Host "   ⚠ $_" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   ⚠ No containers found. Run deployment script first." -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Test MSSQL Connection
Write-Host "Step 4: Testing MSSQL connection..." -ForegroundColor Yellow
$mssqlContainer = "docker-demo-iterp-mssql-1"

if (docker ps --filter "name=$mssqlContainer" --format "{{.Names}}" | Select-String -Pattern $mssqlContainer) {
    try {
        $testResult = docker exec $mssqlContainer /opt/mssql-tools18/bin/sqlcmd `
            -S localhost `
            -U sa `
            -P Sipamara123! `
            -C `
            -Q "SELECT @@VERSION" `
            -h -1 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✓ MSSQL connection successful" -ForegroundColor Green
            Write-Host "   ✓ SQL Server is responding" -ForegroundColor Green
        } else {
            Write-Host "   ✗ MSSQL connection failed" -ForegroundColor Red
            Write-Host "   Error: $testResult" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ✗ Could not test MSSQL connection" -ForegroundColor Red
        Write-Host "   Error: $_" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ MSSQL container not running" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Test Application Endpoint
Write-Host "Step 5: Testing application endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✓ Application is responding" -ForegroundColor Green
        $healthData = $response.Content | ConvertFrom-Json
        if ($healthData.status -eq "ok") {
            Write-Host "   ✓ Health check passed" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "   ⚠ Application not responding yet" -ForegroundColor Yellow
    Write-Host "   This is normal if containers just started. Wait 1-2 minutes." -ForegroundColor Gray
}

Write-Host ""

# Step 6: Check Resource Usage
Write-Host "Step 6: Checking resource usage..." -ForegroundColor Yellow
$stats = docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" docker-demo-iterp-mssql-1 docker-demo-iterp-nextjs-app-1 2>&1

if ($LASTEXITCODE -eq 0 -and $stats) {
    Write-Host "   Container Resource Usage:" -ForegroundColor Cyan
    Write-Host $stats
} else {
    Write-Host "   ⚠ Could not retrieve resource stats" -ForegroundColor Yellow
}

Write-Host ""

# Step 7: Summary
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Configuration checks completed" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. If containers are not running, run the deployment script:" -ForegroundColor White
Write-Host "   Invoke-WebRequest -Uri https://raw.githubusercontent.com/GuneshSSPL/IT-ERP/main/run.ps1 | Invoke-Expression" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Wait 3-4 minutes for MSSQL to initialize" -ForegroundColor White
Write-Host ""
Write-Host "3. Check container status:" -ForegroundColor White
Write-Host "   docker-compose ps" -ForegroundColor Gray
Write-Host ""
Write-Host "4. View logs if issues:" -ForegroundColor White
Write-Host "   docker-compose logs -f mssql" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Access application:" -ForegroundColor White
Write-Host "   http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Login: admin@iterp.com / admin123" -ForegroundColor Cyan
Write-Host ""

