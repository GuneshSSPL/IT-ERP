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
echo "   (This may take 3-4 minutes for SQL Server to initialize)"

# Wait for MSSQL to become healthy
max_wait=300  # 5 minutes
elapsed=0
container_name="docker-demo-iterp-mssql-1"

while [ $elapsed -lt $max_wait ]; do
    status=$(docker inspect $container_name --format '{{.State.Health.Status}}' 2>/dev/null || echo "starting")
    if [ "$status" = "healthy" ]; then
        echo "   ✓ Database is healthy!"
        break
    fi
    sleep 10
    elapsed=$((elapsed + 10))
    echo -n "."
done

echo ""

# Configure SQL Server max memory (optional but recommended)
if [ "$status" = "healthy" ]; then
    echo "🔧 Configuring SQL Server memory settings..."
    
    # Configure max server memory to 5632 MB (leaves 512MB for OS)
    docker exec $container_name /opt/mssql-tools18/bin/sqlcmd \
        -S localhost \
        -U sa \
        -P Sipamara123! \
        -C \
        -Q "EXEC sp_configure 'show advanced options', 1; RECONFIGURE; EXEC sp_configure 'max server memory (MB)', 5632; RECONFIGURE;" \
        >/dev/null 2>&1
    
    echo "   ✓ SQL Server memory configured to 5632 MB"
fi

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

