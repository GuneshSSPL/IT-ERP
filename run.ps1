# IT ERP System - True One-Command Deployment (PowerShell)
# Just run: Invoke-WebRequest -Uri https://raw.githubusercontent.com/GuneshSSPL/IT-ERP/main/run.ps1 | Invoke-Expression

Write-Host "🚀 IT ERP System - One-Command Deployment" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Create docker-compose.yml
@"
services:
  nextjs-app:
    image: sipamara/iterp-app:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_USERNAME=sa
      - DB_PASSWORD=Sipamara123!
      - DB_DATABASE=ITERP
      - DB_HOST=mssql
      - DB_PORT=1433
      - DB_DIALECT=mssql
      - JWT_SECRET=your-super-secret-jwt-key-change-in-production
      - JWT_EXPIRES_IN=7d
      - NEXT_PUBLIC_APP_URL=http://localhost:3000
    depends_on:
      mssql:
        condition: service_healthy
    networks:
      - iterp-network
    restart: unless-stopped
    # Resource limits for Next.js app
    mem_limit: 2g
    mem_reservation: 512m
    cpus: 2.0

  mssql:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=Sipamara123!
      - MSSQL_PID=Developer
      - MSSQL_AGENT_ENABLED=true
      - MSSQL_MEMORY_LIMIT_MB=6144
    ports:
      - "1433:1433"
    volumes:
      - mssql-data:/var/opt/mssql
    networks:
      - iterp-network
    restart: unless-stopped
    # MSSQL optimized with 6GB RAM for faster startup
    mem_limit: 6g
    mem_reservation: 4g
    cpus: 4.0
    healthcheck:
      # FIXED: Use correct tools path for SQL Server 2022
      test: ["CMD-SHELL", "/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P Sipamara123! -C -Q \"SELECT 1\" -b || exit 1"]
      interval: 10s
      timeout: 10s
      retries: 30
      # FIXED: Increased start period for SQL Server 2022 initialization
      start_period: 180s

networks:
  iterp-network:
    driver: bridge

volumes:
  mssql-data:
"@ | Out-File -FilePath docker-compose.yml -Encoding utf8

Write-Host "✅ Created docker-compose.yml" -ForegroundColor Green
Write-Host "📦 Pulling images..." -ForegroundColor Cyan
Write-Host ""

# Pull images
docker pull sipamara/iterp-app:latest

Write-Host ""
Write-Host "🚀 Starting IT ERP System..." -ForegroundColor Green
Write-Host ""

# Start everything
docker-compose up -d

Write-Host ""
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Write-Host "   (This may take 3-4 minutes for SQL Server to initialize)" -ForegroundColor Gray

# Wait for MSSQL to become healthy
$maxWait = 300  # 5 minutes
$elapsed = 0
$containerName = "docker-demo-iterp-mssql-1"

while ($elapsed -lt $maxWait) {
    $status = docker inspect $containerName --format '{{.State.Health.Status}}' 2>$null
    if ($status -eq "healthy") {
        Write-Host "   ✓ Database is healthy!" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 10
    $elapsed += 10
    Write-Host "." -NoNewline -ForegroundColor Gray
}

Write-Host ""

# Configure SQL Server max memory (optional but recommended)
if ($status -eq "healthy") {
    Write-Host "🔧 Configuring SQL Server memory settings..." -ForegroundColor Yellow
    
    # Configure max server memory to 5632 MB (leaves 512MB for OS)
    docker exec $containerName /opt/mssql-tools18/bin/sqlcmd `
        -S localhost `
        -U sa `
        -P Sipamara123! `
        -C `
        -Q "EXEC sp_configure 'show advanced options', 1; RECONFIGURE; EXEC sp_configure 'max server memory (MB)', 5632; RECONFIGURE;" `
        2>&1 | Out-Null
    
    Write-Host "   ✓ SQL Server memory configured to 5632 MB" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ IT ERP System is running!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Access the application at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔑 Default login:" -ForegroundColor Cyan
Write-Host "   Email: admin@iterp.com" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "📝 Useful commands:" -ForegroundColor Yellow
Write-Host "   View logs: docker-compose logs -f" -ForegroundColor White
Write-Host "   Stop: docker-compose down" -ForegroundColor White
Write-Host "   Restart: docker-compose restart" -ForegroundColor White
Write-Host ""

