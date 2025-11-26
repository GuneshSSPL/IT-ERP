# IT ERP - Single Command Deployment

## Completely Self-Sufficient - Zero External Dependencies

Everything runs in containers. No MSSQL installation, no Node.js, nothing external!

## One File + One Command

### Step 1: Save docker-compose.yml

Create a file named `docker-compose.yml` with this content:

```yaml
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
```

### Step 2: Run This ONE Command

```bash
docker-compose up -d
```

**That's it!** This single command will:
- ✅ Pull `sipamara/iterp-app:latest` from Docker Hub
- ✅ Pull `mcr.microsoft.com/mssql/server:2022-latest` from Docker Hub
- ✅ Create Docker network
- ✅ Create Docker volume for database
- ✅ Start MSSQL container
- ✅ Wait for database to be healthy
- ✅ Start application container
- ✅ Automatically initialize database (tables, users, seed data)

## Access

- **URL**: http://localhost:3000
- **Login**: `admin@iterp.com` / `admin123`

## Everything is Containerized

✅ **Application** → Runs in `sipamara/iterp-app:latest` container  
✅ **Database** → Runs in `mcr.microsoft.com/mssql/server:2022-latest` container  
✅ **Data Storage** → Docker volume (persistent)  
✅ **Network** → Docker internal network  
✅ **Database Init** → Automatic (no manual setup)

## No External Dependencies

❌ No MSSQL installation  
❌ No Node.js installation  
❌ No npm install  
❌ No database configuration  
❌ No manual setup  

**Just Docker and Docker Compose!**

## Quick Commands

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Stop and remove all data (fresh start)
docker-compose down -v

# Check status
docker-compose ps
```

## Summary

**1 File**: `docker-compose.yml`  
**1 Command**: `docker-compose up -d`  
**Result**: Fully functional IT ERP system running in containers!

Everything is self-contained. Just pull the images and run! 🚀

