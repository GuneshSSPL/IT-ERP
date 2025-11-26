# IT ERP - Deploy Right Now (No GitHub Scripts Needed)

## 🚀 Quick Deployment - Works Immediately

Since the scripts aren't in GitHub yet, here's how to deploy **right now** on any laptop:

### Step 1: Create docker-compose.yml

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

### Step 2: Run These 2 Commands

```bash
# Command 1: Pull your application image
docker pull sipamara/iterp-app:latest

# Command 2: Start everything (pulls database automatically)
docker-compose up -d
```

## ✅ That's It!

The system will:
- ✅ Pull your app image
- ✅ Pull MSSQL image automatically
- ✅ Start both containers
- ✅ Initialize database automatically
- ✅ Create tables, default user, and seed data

## 📊 Access

- **URL:** http://localhost:3000
- **Login:** `admin@iterp.com` / `admin123`

## 📝 Useful Commands

```bash
# View logs
docker-compose logs -f

# Stop system
docker-compose down

# Restart system
docker-compose restart

# Check status
docker-compose ps
```

## 🎯 Summary

**2 Steps:**
1. Create `docker-compose.yml` (copy from above)
2. Run: `docker pull sipamara/iterp-app:latest && docker-compose up -d`

**Everything else is automatic!** 🚀

