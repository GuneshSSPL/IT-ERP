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
    # Use mem_limit for better compatibility with all Docker versions
    mem_limit: 6g
    mem_reservation: 4g
    cpus: 4
    healthcheck:
      test: ["CMD-SHELL", "/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'Sipamara123!' -Q 'SELECT 1' -h -1 || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 30
      start_period: 120s

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
Start-Sleep -Seconds 10

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

