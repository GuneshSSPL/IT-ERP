#!/bin/bash
# IT ERP System - True One-Command Deployment
# Just run: curl -sSL https://raw.githubusercontent.com/GuneshSSPL/IT-ERP/main/run.sh | bash

set -e

echo "🚀 IT ERP System - One-Command Deployment"
echo "=========================================="
echo ""

# Create docker-compose.yml
cat > docker-compose.yml << 'COMPOSE_EOF'
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
    ports:
      - "1433:1433"
    volumes:
      - mssql-data:/var/opt/mssql
    networks:
      - iterp-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
    healthcheck:
      test: ["CMD-SHELL", "/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'Sipamara123!' -Q 'SELECT 1' || exit 1"]
      interval: 15s
      timeout: 10s
      retries: 20
      start_period: 60s

networks:
  iterp-network:
    driver: bridge

volumes:
  mssql-data:
COMPOSE_EOF

echo "✅ Created docker-compose.yml"
echo "📦 Pulling images..."
echo ""

# Pull images
docker pull sipamara/iterp-app:latest

echo ""
echo "🚀 Starting IT ERP System..."
echo ""

# Start everything
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "✅ IT ERP System is running!"
echo ""
echo "📊 Access the application at: http://localhost:3000"
echo "🔑 Default login:"
echo "   Email: admin@iterp.com"
echo "   Password: admin123"
echo ""
echo "📝 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop: docker-compose down"
echo "   Restart: docker-compose restart"
echo ""

