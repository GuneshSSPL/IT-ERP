# MSSQL Container Fix Guide

## Problem
MSSQL container fails health check and shows as "unhealthy"

## Root Causes
1. **Password Complexity**: MSSQL requires strong passwords (8+ chars, uppercase, lowercase, numbers, special chars)
2. **Startup Time**: MSSQL takes 30-60 seconds to fully start
3. **Memory Requirements**: MSSQL needs at least 2GB RAM
4. **Health Check Timing**: Health check runs too early or too frequently

## Solution Applied

### Updated Password
- **Old**: `sipamara` (doesn't meet complexity)
- **New**: `Sipamara123!` (meets all requirements)

### Updated Health Check
- Increased `interval` from 10s to 15s
- Increased `timeout` from 3s to 10s
- Increased `retries` from 10 to 20
- Added `start_period: 60s` (gives MSSQL 60 seconds before first health check)

### Added Memory Limits
- Minimum: 1GB reserved
- Maximum: 2GB limit

## Quick Fix Commands

### Step 1: Stop and Remove Old Containers
```bash
docker-compose down -v
```

### Step 2: Update docker-compose.yml
The file has been updated with the fixes above.

### Step 3: Start Fresh
```bash
docker-compose up -d
```

### Step 4: Monitor Startup
```bash
# Watch MSSQL logs
docker-compose logs -f mssql

# Check health status
docker-compose ps
```

## Expected Behavior

1. **0-30 seconds**: MSSQL container starts, initializes
2. **30-60 seconds**: MSSQL becomes ready, health checks begin
3. **60+ seconds**: Health check passes, Next.js app starts
4. **90+ seconds**: System fully operational

## Troubleshooting

### If Still Failing

#### Check MSSQL Logs
```bash
docker-compose logs mssql | tail -50
```

Look for:
- Password errors
- Memory errors
- Permission errors

#### Test MSSQL Manually
```bash
docker exec -it docker-demo-iterp-mssql-1 /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P 'Sipamara123!' -Q "SELECT @@VERSION"
```

#### Check System Resources
```bash
# Check available memory
docker system df

# Check container resources
docker stats
```

#### Increase Memory (if needed)
Edit `docker-compose.yml`:
```yaml
deploy:
  resources:
    limits:
      memory: 4G  # Increase if you have more RAM
```

### Alternative: Use Simpler Password (Less Secure)

If you must use a simpler password, you can disable password complexity:

```yaml
environment:
  - ACCEPT_EULA=Y
  - SA_PASSWORD=sipamara
  - MSSQL_PID=Developer
  - MSSQL_COLLATION=SQL_Latin1_General_CP1_CI_AS
```

**Note**: This is less secure and not recommended for production.

## Verification

Once running, verify:

```bash
# Check both containers are healthy
docker-compose ps

# Test database connection
docker exec docker-demo-iterp-nextjs-app-1 node -e "
  const sql = require('mssql');
  sql.connect({
    user: 'sa',
    password: 'Sipamara123!',
    server: 'mssql',
    database: 'ITERP',
    options: { encrypt: false, trustServerCertificate: true }
  }).then(() => console.log('Connected!')).catch(console.error);
"

# Access application
curl http://localhost:3000/api/health
```

## Updated Credentials

**Database:**
- Username: `sa`
- Password: `Sipamara123!`
- Database: `ITERP`
- Host: `mssql` (within Docker network)

**Application:**
- URL: http://localhost:3000
- Admin Email: `admin@iterp.com`
- Admin Password: `admin123`

