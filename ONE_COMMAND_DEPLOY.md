# IT ERP - True One-Command Deployment

## ✅ Everything is Self-Contained!

**Your Docker image (`sipamara/iterp-app:latest`) contains:**
- ✅ Complete Next.js application (built and optimized)
- ✅ All database initialization code (embedded in the app)
- ✅ Automatic table creation (runs on startup)
- ✅ Default admin user creation (automatic)
- ✅ Seed data injection (automatic)
- ✅ All dependencies bundled

**No external files needed in the image!** Everything is embedded in the code.

## 🚀 One-Command Deployment Options

### Option 1: Using Deployment Script (Recommended)

**Linux/Mac:**
```bash
curl -sSL https://raw.githubusercontent.com/GuneshSSPL/IT-ERP/main/deploy.sh | bash
```

**Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/GuneshSSPL/IT-ERP/main/deploy.ps1 -OutFile deploy.ps1; .\deploy.ps1
```

### Option 2: Single Command (Linux/Mac)

```bash
cat > docker-compose.yml << 'EOF'
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
EOF
docker-compose up -d
```

### Option 3: Manual (2 Steps)

**Step 1:** Create `docker-compose.yml` (copy from repository)

**Step 2:** Run:
```bash
docker-compose up -d
```

## 📦 What's Included in Your Image

The `sipamara/iterp-app:latest` image contains:

1. **Application Code**
   - All Next.js pages and components
   - All API routes
   - All business logic

2. **Database Initialization (Embedded)**
   - Complete schema creation (21 tables)
   - Default roles (admin, manager, employee)
   - Default department (IT)
   - Default admin user (admin@iterp.com / admin123)
   - Seed data injection (if database is empty)

3. **Dependencies**
   - All npm packages (production only)
   - Built and optimized Next.js application
   - All required libraries

4. **Configuration**
   - Environment variable support
   - Automatic database connection handling
   - Health checks

## 🔍 Verification: Everything is Self-Contained

✅ **Database Schema** → Embedded in `lib/db/init.ts`  
✅ **Default Data** → Embedded in `lib/db/init.ts`  
✅ **Seed Data** → Embedded in `lib/db/seed.ts`  
✅ **Initialization Logic** → Embedded in `lib/db/startup.ts`  
✅ **Auto-Start** → Called from `app/layout.tsx`  

**No external SQL files needed!** Everything runs from code.

## 🎯 Deployment Summary

**What you need on target system:**
- ✅ Docker installed
- ✅ Docker Compose installed
- ✅ `docker-compose.yml` file (or use script to generate it)

**What's NOT needed:**
- ❌ Node.js installation
- ❌ MSSQL installation
- ❌ npm install
- ❌ Database setup
- ❌ SQL scripts
- ❌ Configuration files
- ❌ Manual initialization

## 🚀 Quick Start

**Just run:**
```bash
docker-compose up -d
```

**Access:**
- URL: http://localhost:3000
- Login: `admin@iterp.com` / `admin123`

Everything else is automatic! 🎉

