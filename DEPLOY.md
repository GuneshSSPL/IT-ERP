# IT ERP System - Zero Dependency Deployment

## Complete Containerized Setup

**No external dependencies required!** Everything runs in Docker containers:
- ✅ Next.js application (containerized)
- ✅ MSSQL Database (containerized)
- ✅ Automatic database initialization
- ✅ Automatic table creation
- ✅ Automatic default user creation
- ✅ Automatic seed data

## Prerequisites

**ONLY Docker and Docker Compose** - Nothing else needed!

## Deployment (2 Commands)

### Step 1: Create docker-compose.yml

Create a file named `docker-compose.yml` in any directory:

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
# Command 1: Pull the application image
docker pull sipamara/iterp-app:latest

# Command 2: Start everything (pulls database image automatically)
docker-compose up -d
```

## That's It! 🎉

The system will automatically:
1. Pull the Next.js application image
2. Pull the MSSQL Server image
3. Start the database container
4. Wait for database to be healthy
5. Start the application container
6. Initialize database tables automatically
7. Create default admin user automatically
8. Add seed data automatically (if database is empty)

## Access the Application

- **URL**: http://localhost:3000
- **Default Admin**:
  - Email: `admin@iterp.com`
  - Password: `admin123`

## What Runs in Containers

✅ **Next.js Application** - Runs in `sipamara/iterp-app:latest` container  
✅ **MSSQL Database** - Runs in `mcr.microsoft.com/mssql/server:2022-latest` container  
✅ **Database Data** - Stored in Docker volume `mssql-data`  
✅ **Network** - Containers communicate via Docker network

## No External Dependencies

❌ No Node.js installation needed  
❌ No MSSQL installation needed  
❌ No npm install needed  
❌ No database setup needed  
❌ No manual configuration needed

**Just Docker and Docker Compose!**

## Useful Commands

```bash
# View logs
docker-compose logs -f

# View application logs only
docker-compose logs -f nextjs-app

# View database logs only
docker-compose logs -f mssql

# Stop the system
docker-compose down

# Stop and remove all data (fresh start)
docker-compose down -v

# Restart the system
docker-compose restart

# Check status
docker-compose ps

# Update to latest image
docker-compose pull sipamara/iterp-app:latest
docker-compose up -d
```

## Troubleshooting

**Port 3000 already in use?**
Change the port mapping in docker-compose.yml:
```yaml
ports:
  - "8080:3000"  # Use port 8080 instead
```

**Want to see what's happening?**
```bash
docker-compose logs -f
```

**Need to reset everything?**
```bash
docker-compose down -v
docker-compose up -d
```

## Production Deployment

For production, update these in `docker-compose.yml`:
- `DB_PASSWORD` - Use a strong password
- `JWT_SECRET` - Use a secure random string (minimum 32 characters)
- `NEXT_PUBLIC_APP_URL` - Set to your domain (e.g., `https://yourdomain.com`)

## Summary

**2 Files Needed:**
1. `docker-compose.yml` (the file above)

**2 Commands to Run:**
1. `docker pull sipamara/iterp-app:latest`
2. `docker-compose up -d`

**That's all!** Everything else is automatic. 🚀

