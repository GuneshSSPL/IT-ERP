# 🚨 Quick Fix for MSSQL Container Issue

## The Problem
MSSQL container shows as "unhealthy" and fails to start properly.

## The Solution (3 Steps)

### Step 1: Stop Everything
```bash
docker-compose down -v
```

### Step 2: Update docker-compose.yml
The file has been updated with:
- ✅ Stronger password: `Sipamara123!` (meets MSSQL complexity requirements)
- ✅ Better health check timing (60s startup period, more retries)
- ✅ Memory limits (2GB max, 1GB reserved)
- ✅ Removed obsolete `version` field

### Step 3: Start Fresh
```bash
docker-compose up -d
```

## Monitor Startup
```bash
# Watch MSSQL logs (wait 60-90 seconds)
docker-compose logs -f mssql

# In another terminal, check status
docker-compose ps
```

## Expected Timeline
- **0-30s**: MSSQL initializing
- **30-60s**: MSSQL becoming ready
- **60-90s**: Health check passes, Next.js app starts
- **90s+**: System ready at http://localhost:3000

## New Credentials
- **DB Password**: `Sipamara123!` (changed from `sipamara`)
- **App Login**: `admin@iterp.com` / `admin123` (unchanged)

## If Still Failing

### Check MSSQL Logs
```bash
docker-compose logs mssql | tail -100
```

### Test MSSQL Manually
```bash
docker exec -it docker-demo-iterp-mssql-1 /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P 'Sipamara123!' -Q "SELECT 1"
```

### Check System Memory
MSSQL needs at least 2GB RAM. If you have less:
1. Close other applications
2. Or reduce memory limit in docker-compose.yml:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 1.5G  # Reduce if needed
   ```

## Success Indicators
✅ Both containers show "Up" status  
✅ MSSQL shows "healthy"  
✅ You can access http://localhost:3000  
✅ Login works with `admin@iterp.com` / `admin123`

