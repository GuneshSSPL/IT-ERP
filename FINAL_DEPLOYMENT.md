# IT ERP System - Final Deployment Guide

## ✅ Your Image is Ready!

**Docker Hub Image:** `sipamara/iterp-app:latest`  
**Status:** ✅ Pushed and ready to use  
**URL:** https://hub.docker.com/r/sipamara/iterp-app

## 🎯 Deployment Strategy: One Command

Since you need both the application and database, we use **docker-compose** to orchestrate them. But we make it **one command** with a simple script!

## 🚀 Deployment on Any Laptop (Just Docker Installed)

### Option 1: One-Command Script (Recommended)

**Linux/Mac:**
```bash
curl -sSL https://raw.githubusercontent.com/GuneshSSPL/IT-ERP/main/run.sh | bash
```

**Windows PowerShell:**
```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/GuneshSSPL/IT-ERP/main/run.ps1 | Invoke-Expression
```

**What this does:**
1. ✅ Creates `docker-compose.yml` automatically
2. ✅ Pulls your image (`sipamara/iterp-app:latest`)
3. ✅ Pulls MSSQL image automatically
4. ✅ Starts everything
5. ✅ Initializes database automatically

### Option 2: Manual (2 Steps)

**Step 1:** Create `docker-compose.yml`:
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

**Step 2:** Run:
```bash
docker-compose up -d
```

## ✅ What's Self-Contained in Your Image

Your `sipamara/iterp-app:latest` image contains:

✅ **Complete Next.js Application** (built and optimized)  
✅ **All Database Initialization Code** (embedded in `lib/db/init.ts`)  
✅ **All 21 Database Tables** (created automatically)  
✅ **Default Roles** (admin, manager, employee)  
✅ **Default Department** (IT)  
✅ **Default Admin User** (admin@iterp.com / admin123)  
✅ **Seed Data** (realistic demo data - 7 users, 12 projects, etc.)  
✅ **All Dependencies** (npm packages)  
✅ **Auto-Startup Logic** (runs on container start)  

**Everything runs automatically - no manual setup!**

## 🔍 Why docker-compose.yml is Needed

**Technical Reality:**
- Your application needs 2 services: Next.js app + MSSQL database
- Docker best practice: One service per container
- `docker-compose.yml` orchestrates both containers

**Solution:**
- Provide a script that creates `docker-compose.yml` automatically
- Makes it feel like "one command"
- Follows Docker best practices

## 📦 Complete Deployment Process

### On Target Laptop:

1. **Install Docker** (if not already installed)
2. **Run one command:**
   ```bash
   curl -sSL https://raw.githubusercontent.com/GuneshSSPL/IT-ERP/main/run.sh | bash
   ```

### What Happens:

1. Script creates `docker-compose.yml`
2. Pulls `sipamara/iterp-app:latest` from Docker Hub
3. Pulls `mcr.microsoft.com/mssql/server:2022-latest`
4. Creates Docker network
5. Creates Docker volume for database
6. Starts MSSQL container
7. Waits for database to be healthy
8. Starts application container
9. Application automatically:
   - Connects to database
   - Creates all tables
   - Creates default admin user
   - Adds seed data (if database is empty)

### Access:

- **URL:** http://localhost:3000
- **Login:** `admin@iterp.com` / `admin123`

## 🎯 Summary

**Your Docker image is 100% self-contained!**

The only external file needed is `docker-compose.yml`, which:
- Is just a configuration file (not part of the image)
- Can be generated automatically by the script
- Orchestrates the two containers (app + database)

**Deployment is truly one command:**
```bash
curl -sSL https://raw.githubusercontent.com/GuneshSSPL/IT-ERP/main/run.sh | bash
```

**That's it!** Everything else is automatic! 🚀

