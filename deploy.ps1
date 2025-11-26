# IT ERP System - One-Command Deployment Script (PowerShell)
# This script creates docker-compose.yml and starts the system

@"
version: '3.8'

services:
  nextjs-app:
    image: sipamara/iterp-app:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_USERNAME=sa
      - DB_PASSWORD=sipamara
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
      - SA_PASSWORD=sipamara
      - MSSQL_PID=Developer
    ports:
      - "1433:1433"
    volumes:
      - mssql-data:/var/opt/mssql
    networks:
      - iterp-network
    restart: unless-stopped
    healthcheck:
      test: /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P sipamara -Q "SELECT 1" || exit 1
      interval: 10s
      timeout: 3s
      retries: 10

networks:
  iterp-network:
    driver: bridge

volumes:
  mssql-data:
"@ | Out-File -FilePath docker-compose.yml -Encoding utf8

Write-Host "Starting IT ERP System..." -ForegroundColor Green
docker-compose up -d

Write-Host ""
Write-Host "✅ IT ERP System is starting!" -ForegroundColor Green
Write-Host "📊 Access at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔑 Login: admin@iterp.com / admin123" -ForegroundColor Cyan
Write-Host ""
Write-Host "View logs: docker-compose logs -f" -ForegroundColor Yellow
Write-Host "Stop system: docker-compose down" -ForegroundColor Yellow

