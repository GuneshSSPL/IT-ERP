# Detailed Fixes Applied - For Image Generation Script Update

## Overview
This document details all the fixes applied to resolve the Docker container healthcheck and memory configuration issues. Use this information to update the `run.ps1` script in your GitHub repository so these fixes are included by default.

---

## Issue #1: Incorrect Healthcheck Path

### Problem
The original healthcheck was using the wrong SQL Server tools path:
```yaml
healthcheck:
  test: ["CMD-SHELL", "/opt/mssql-tools/bin/sqlcmd ..."]
```

### Root Cause
SQL Server 2022 uses `mssql-tools18` instead of `mssql-tools`. The old path doesn't exist in SQL Server 2022 containers.

### Fix Applied
Changed the healthcheck path to use the correct tools location:
```yaml
healthcheck:
  test: ["CMD-SHELL", "/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P Sipamara123! -C -Q \"SELECT 1\" -b || exit 1"]
```

### Verification Command
```bash
# Test if the path exists
docker exec <container> ls -la /opt/mssql-tools18/bin/sqlcmd

# Test the healthcheck manually
docker exec <container> /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P <password> -C -Q "SELECT 1" -b
```

### What to Update in run.ps1
Find the healthcheck section in the docker-compose.yml generation and ensure it uses:
- Path: `/opt/mssql-tools18/bin/sqlcmd` (NOT `/opt/mssql-tools/bin/sqlcmd`)
- For SQL Server 2019 and earlier: `/opt/mssql-tools/bin/sqlcmd`
- For SQL Server 2022: `/opt/mssql-tools18/bin/sqlcmd`

---

## Issue #2: Insufficient Healthcheck Start Period

### Problem
The original start_period was too short (120s), causing healthcheck failures during SQL Server initialization.

### Root Cause
SQL Server 2022 takes longer to initialize, especially on first startup when it needs to:
- Upgrade system databases
- Initialize tempdb
- Start all services
- Complete recovery

### Fix Applied
Increased the start_period to allow more time for initialization:
```yaml
healthcheck:
  start_period: 180s  # Increased from 120s
```

### Recommended Values
- **Minimum**: 180s (3 minutes) for SQL Server 2022
- **Safe**: 240s (4 minutes) for slower systems
- **For production**: 300s (5 minutes) to be extra safe

### What to Update in run.ps1
Set `start_period: 180s` or higher in the healthcheck configuration.

---

## Issue #3: Missing Memory Resource Limits

### Problem
The original docker-compose.yml didn't have explicit memory limits, causing:
- Unpredictable memory usage
- Potential OOM (Out of Memory) kills
- No guarantee of stable database operation

### Fix Applied
Added explicit memory and CPU limits:
```yaml
mssql:
  # ... other config ...
  mem_limit: 6g
  mem_reservation: 4g
  cpus: 4.0
```

### Memory Configuration Details

#### Container Memory Limits
- **mem_limit: 6g** - Maximum memory the container can use
- **mem_reservation: 4g** - Guaranteed minimum memory (prevents eviction)

#### SQL Server Memory Configuration
- **MSSQL_MEMORY_LIMIT_MB: 6144** - OS-level memory limit (already in original)
- **Max Server Memory: 5632 MB** - SQL Server internal limit (configured via SQL)

### Why 6GB?
- SQL Server needs substantial memory for:
  - Buffer pool (data caching)
  - Query execution memory
  - System overhead
- 6GB provides:
  - Stable operation for medium workloads
  - Room for growth
  - Prevents memory pressure

### What to Update in run.ps1
Add these lines to the mssql service in docker-compose.yml:
```yaml
mssql:
  # ... existing environment variables ...
  mem_limit: 6g
  mem_reservation: 4g
  cpus: 4.0
```

---

## Issue #4: SQL Server Max Memory Not Configured

### Problem
SQL Server's `max server memory` was set to unlimited (2,147,483,647 MB), which could cause:
- SQL Server trying to allocate more than container allows
- Potential OOM kills
- Unpredictable behavior

### Fix Applied
Configured SQL Server's max server memory to 5,632 MB (leaving ~512MB for OS):
```sql
EXEC sp_configure 'show advanced options', 1;
RECONFIGURE;
EXEC sp_configure 'max server memory (MB)', 5632;
RECONFIGURE;
```

### Calculation
- Container limit: 6,144 MB (6GB)
- OS overhead: ~512 MB
- SQL Server max: 5,632 MB (safe buffer)

### What to Update in run.ps1
You have two options:

#### Option 1: Add to docker-compose.yml as init script
Create an initialization script that runs after SQL Server starts:
```yaml
mssql:
  # ... existing config ...
  command: >
    /opt/mssql/bin/sqlservr &
    sleep 30
    /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P Sipamara123! -C -Q "EXEC sp_configure 'show advanced options', 1; RECONFIGURE; EXEC sp_configure 'max server memory (MB)', 5632; RECONFIGURE;"
```

#### Option 2: Add to healthcheck or use entrypoint script
Create a custom entrypoint that:
1. Starts SQL Server
2. Waits for it to be ready
3. Configures max server memory
4. Continues normal operation

---

## Issue #5: Missing Next.js App Resource Limits

### Problem
The Next.js app had no resource limits, which could cause:
- Unpredictable resource usage
- Potential resource contention with database

### Fix Applied
Added resource limits to Next.js app:
```yaml
nextjs-app:
  # ... existing config ...
  mem_limit: 2g
  mem_reservation: 512m
  cpus: 2.0
```

### What to Update in run.ps1
Add resource limits to the nextjs-app service:
```yaml
nextjs-app:
  # ... existing config ...
  mem_limit: 2g
  mem_reservation: 512m
  cpus: 2.0
```

---

## Complete Fixed docker-compose.yml Structure

Here's the complete structure with all fixes:

```yaml
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
    # Resource limits for SQL Server
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
```

---

## Recommended run.ps1 Updates

### 1. Detect SQL Server Version
Add logic to detect SQL Server version and use the correct tools path:

```powershell
# Detect SQL Server version from image tag
$sqlServerImage = "mcr.microsoft.com/mssql/server:2022-latest"
if ($sqlServerImage -match "2022") {
    $sqlcmdPath = "/opt/mssql-tools18/bin/sqlcmd"
} else {
    $sqlcmdPath = "/opt/mssql-tools/bin/sqlcmd"
}
```

### 2. Generate docker-compose.yml with All Fixes
Update the docker-compose.yml generation to include:

```powershell
$dockerComposeContent = @"
services:
  nextjs-app:
    image: sipamara/iterp-app:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_USERNAME=sa
      - DB_PASSWORD=$dbPassword
      - DB_DATABASE=ITERP
      - DB_HOST=mssql
      - DB_PORT=1433
      - DB_DIALECT=mssql
      - JWT_SECRET=$jwtSecret
      - JWT_EXPIRES_IN=7d
      - NEXT_PUBLIC_APP_URL=http://localhost:3000
    depends_on:
      mssql:
        condition: service_healthy
    networks:
      - iterp-network
    restart: unless-stopped
    mem_limit: 2g
    mem_reservation: 512m
    cpus: 2.0

  mssql:
    image: $sqlServerImage
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=$dbPassword
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
    mem_limit: 6g
    mem_reservation: 4g
    cpus: 4.0
    healthcheck:
      test: ["CMD-SHELL", "$sqlcmdPath -S localhost -U sa -P $dbPassword -C -Q `"SELECT 1`" -b || exit 1"]
      interval: 10s
      timeout: 10s
      retries: 30
      start_period: 180s

networks:
  iterp-network:
    driver: bridge

volumes:
  mssql-data:
"@
```

### 3. Optional: Configure SQL Server Max Memory
Add a post-startup script to configure SQL Server max memory:

```powershell
# After containers start, configure SQL Server max memory
Write-Host "Configuring SQL Server memory settings..." -ForegroundColor Yellow
Start-Sleep -Seconds 30  # Wait for SQL Server to be ready

docker exec docker-demo-iterp-mssql-1 $sqlcmdPath `
    -S localhost `
    -U sa `
    -P $dbPassword `
    -C `
    -Q "EXEC sp_configure 'show advanced options', 1; RECONFIGURE; EXEC sp_configure 'max server memory (MB)', 5632; RECONFIGURE;" `
    2>&1 | Out-Null

Write-Host "SQL Server memory configured to 5632 MB" -ForegroundColor Green
```

---

## Testing Checklist

After updating run.ps1, test:

1. ✅ Healthcheck passes within 3-4 minutes
2. ✅ Container shows as "healthy" status
3. ✅ Next.js app starts successfully
4. ✅ Memory limits are applied (check with `docker stats`)
5. ✅ SQL Server max memory is configured (check with SQL query)
6. ✅ Application is accessible at http://localhost:3000
7. ✅ No "unhealthy" container errors

---

## Summary of Changes

| Issue | Original | Fixed | Impact |
|-------|----------|-------|--------|
| Healthcheck Path | `/opt/mssql-tools/bin/sqlcmd` | `/opt/mssql-tools18/bin/sqlcmd` | Critical - Prevents healthcheck failures |
| Start Period | 120s | 180s | High - Allows SQL Server to initialize |
| Memory Limits | None | 6GB limit, 4GB reservation | High - Ensures stable operation |
| CPU Limits | None | 4.0 CPUs | Medium - Prevents resource contention |
| SQL Max Memory | Unlimited | 5632 MB | High - Prevents OOM issues |
| App Memory Limits | None | 2GB limit, 512MB reservation | Medium - Resource management |

---

## Additional Recommendations

### 1. Make Memory Configurable
Allow users to specify memory limits:
```powershell
param(
    [int]$DatabaseMemoryGB = 6,
    [int]$AppMemoryGB = 2
)
```

### 2. Add Validation
Check Docker Desktop resources before starting:
```powershell
$dockerInfo = docker info --format '{{.MemTotal}}'
if ([int64]$dockerInfo -lt 8589934592) {  # 8GB in bytes
    Write-Warning "Docker Desktop has less than 8GB RAM. Recommended: 10-12GB"
}
```

### 3. Add Healthcheck Verification
After containers start, verify healthcheck:
```powershell
$maxWait = 300  # 5 minutes
$elapsed = 0
while ($elapsed -lt $maxWait) {
    $status = docker inspect docker-demo-iterp-mssql-1 --format '{{.State.Health.Status}}'
    if ($status -eq "healthy") {
        Write-Host "Database is healthy!" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 10
    $elapsed += 10
}
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-26
**Applies To**: SQL Server 2022, Docker Compose deployments

