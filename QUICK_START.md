# IT ERP System - Quick Start Guide

## One-Command Deployment

Deploy the complete IT ERP system with just Docker and Docker Compose - no other setup required!

### Prerequisites
- Docker installed
- Docker Compose installed

### Quick Start (3 Steps)

#### Step 1: Create deployment directory
```bash
mkdir iterp-deployment
cd iterp-deployment
```

#### Step 2: Download required files
Create `docker-compose.yml`:
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

Create `docker/mssql/init.sql`:
```sql
-- This file will be executed when MSSQL container starts
-- It creates the database and runs the schema

-- Wait for SQL Server to be ready
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ITERP')
BEGIN
    CREATE DATABASE ITERP;
END
GO

USE ITERP;
GO

PRINT 'Database ITERP initialized';
GO
```

#### Step 3: Run the system
```bash
docker-compose up -d
```

That's it! The system will:
- ✅ Pull the application image from Docker Hub
- ✅ Pull and start the MSSQL database
- ✅ Automatically create the database
- ✅ Initialize all tables and default data
- ✅ Start the application

### Access the Application

- **URL**: http://localhost:3000
- **Default Admin Login**:
  - Email: `admin@iterp.com`
  - Password: `admin123`

### What Happens Automatically

1. **Database Initialization**: Tables are created automatically on first startup
2. **Default Admin User**: Created automatically (admin@iterp.com / admin123)
3. **Seed Data**: Realistic demo data is added automatically (if database is empty)
4. **Health Checks**: Database health is monitored and app waits for DB to be ready

### Useful Commands

```bash
# View logs
docker-compose logs -f

# Stop the system
docker-compose down

# Stop and remove all data
docker-compose down -v

# Restart the system
docker-compose restart

# Update to latest image
docker-compose pull
docker-compose up -d
```

### Troubleshooting

**Port 3000 already in use?**
- Change the port in docker-compose.yml: `"8080:3000"` instead of `"3000:3000"`

**Database connection errors?**
- Wait a few seconds for MSSQL to fully start (health check handles this automatically)

**Need to reset everything?**
```bash
docker-compose down -v
docker-compose up -d
```

### Production Deployment

For production, update these environment variables in `docker-compose.yml`:
- `DB_PASSWORD` - Use a strong password
- `JWT_SECRET` - Use a secure random string
- `NEXT_PUBLIC_APP_URL` - Set to your domain

### That's All!

No Node.js installation, no npm install, no database setup - just Docker and you're ready to go! 🚀

