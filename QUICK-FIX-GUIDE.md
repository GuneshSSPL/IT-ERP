# Quick Fix Guide for run.ps1 Script Update

## 🎯 What You Need to Change

### 1. Fix Healthcheck Path (CRITICAL)

**OLD (Broken):**
```yaml
healthcheck:
  test: ["CMD-SHELL", "/opt/mssql-tools/bin/sqlcmd ..."]
```

**NEW (Fixed):**
```yaml
healthcheck:
  test: ["CMD-SHELL", "/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P Sipamara123! -C -Q \"SELECT 1\" -b || exit 1"]
```

**Why:** SQL Server 2022 uses `mssql-tools18`, not `mssql-tools`.

---

### 2. Increase Healthcheck Start Period

**OLD:**
```yaml
healthcheck:
  start_period: 120s
```

**NEW:**
```yaml
healthcheck:
  start_period: 180s  # or 240s for slower systems
```

**Why:** SQL Server 2022 needs more time to initialize.

---

### 3. Add Memory Limits to MSSQL Service

**ADD THESE LINES to mssql service:**
```yaml
mssql:
  # ... existing config ...
  mem_limit: 6g
  mem_reservation: 4g
  cpus: 4.0
```

**Why:** Ensures stable database operation and prevents OOM kills.

---

### 4. Add Memory Limits to Next.js App

**ADD THESE LINES to nextjs-app service:**
```yaml
nextjs-app:
  # ... existing config ...
  mem_limit: 2g
  mem_reservation: 512m
  cpus: 2.0
```

**Why:** Prevents resource contention and ensures predictable behavior.

---

## 📝 Complete Updated docker-compose.yml Template

Use this as your template in run.ps1:

```yaml
services:
  nextjs-app:
    image: sipamara/iterp-app:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_USERNAME=sa
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_DATABASE=ITERP
      - DB_HOST=mssql
      - DB_PORT=1433
      - DB_DIALECT=mssql
      - JWT_SECRET=${JWT_SECRET}
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
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=${DB_PASSWORD}
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
      test: ["CMD-SHELL", "/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P ${DB_PASSWORD} -C -Q \"SELECT 1\" -b || exit 1"]
      interval: 10s
      timeout: 10s
      retries: 30
      start_period: 180s

networks:
  iterp-network:
    driver: bridge

volumes:
  mssql-data:
```

---

## 🔧 PowerShell Code for run.ps1

### Option 1: Simple String Replacement

```powershell
# In your run.ps1, when generating docker-compose.yml:

$dockerComposeYml = @"
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
    image: mcr.microsoft.com/mssql/server:2022-latest
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
      test: ["CMD-SHELL", "/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P $dbPassword -C -Q `"SELECT 1`" -b || exit 1"]
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

$dockerComposeYml | Out-File -FilePath "docker-compose.yml" -Encoding utf8
```

### Option 2: Detect SQL Server Version (Advanced)

```powershell
# Detect SQL Server version and use correct tools path
$sqlServerImage = "mcr.microsoft.com/mssql/server:2022-latest"
$sqlcmdPath = if ($sqlServerImage -match "2022") {
    "/opt/mssql-tools18/bin/sqlcmd"
} else {
    "/opt/mssql-tools/bin/sqlcmd"
}

# Use $sqlcmdPath in healthcheck
healthcheck:
  test: ["CMD-SHELL", "$sqlcmdPath -S localhost -U sa -P $dbPassword -C -Q `"SELECT 1`" -b || exit 1"]
```

---

## ✅ Optional: Configure SQL Server Max Memory

Add this after containers start to configure SQL Server's internal memory limit:

```powershell
# Wait for SQL Server to be ready
Write-Host "Waiting for SQL Server to be ready..." -ForegroundColor Yellow
$maxWait = 300
$elapsed = 0
$containerName = "docker-demo-iterp-mssql-1"

while ($elapsed -lt $maxWait) {
    $status = docker inspect $containerName --format '{{.State.Health.Status}}' 2>$null
    if ($status -eq "healthy") {
        break
    }
    Start-Sleep -Seconds 10
    $elapsed += 10
    Write-Host "." -NoNewline
}

if ($status -eq "healthy") {
    Write-Host "`nConfiguring SQL Server memory settings..." -ForegroundColor Yellow
    
    # Configure max server memory to 5632 MB (leaves 512MB for OS)
    docker exec $containerName /opt/mssql-tools18/bin/sqlcmd `
        -S localhost `
        -U sa `
        -P $dbPassword `
        -C `
        -Q "EXEC sp_configure 'show advanced options', 1; RECONFIGURE; EXEC sp_configure 'max server memory (MB)', 5632; RECONFIGURE;" `
        2>&1 | Out-Null
    
    Write-Host "✓ SQL Server memory configured to 5632 MB" -ForegroundColor Green
} else {
    Write-Host "`n⚠ SQL Server did not become healthy in time. Skipping memory configuration." -ForegroundColor Yellow
}
```

---

## 🧪 Testing Your Updated Script

After updating run.ps1, test these:

1. **Healthcheck passes:**
   ```powershell
   docker-compose ps
   # Should show: (healthy) after 3-4 minutes
   ```

2. **Memory limits applied:**
   ```powershell
   docker stats --no-stream
   # MSSQL should show: X.XXGiB / 6GiB
   ```

3. **SQL Server accessible:**
   ```powershell
   docker exec docker-demo-iterp-mssql-1 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P Sipamara123! -C -Q "SELECT 1"
   ```

4. **Application starts:**
   ```powershell
   # Check Next.js app logs
   docker-compose logs nextjs-app
   # Should not show database connection errors
   ```

---

## 📊 Summary of Changes

| What | Where | Change |
|------|-------|--------|
| Healthcheck path | mssql service | `/opt/mssql-tools/` → `/opt/mssql-tools18/` |
| Start period | mssql healthcheck | `120s` → `180s` |
| Memory limit | mssql service | Add `mem_limit: 6g` |
| Memory reservation | mssql service | Add `mem_reservation: 4g` |
| CPU limit | mssql service | Add `cpus: 4.0` |
| App memory limit | nextjs-app service | Add `mem_limit: 2g` |
| App memory reservation | nextjs-app service | Add `mem_reservation: 512m` |
| App CPU limit | nextjs-app service | Add `cpus: 2.0` |

---

## 🚀 Quick Copy-Paste Fix

If you just want to fix the healthcheck (minimum change):

**Find this line in your run.ps1:**
```powershell
test: ["CMD-SHELL", "/opt/mssql-tools/bin/sqlcmd
```

**Replace with:**
```powershell
test: ["CMD-SHELL", "/opt/mssql-tools18/bin/sqlcmd
```

**And change:**
```powershell
start_period: 120s
```

**To:**
```powershell
start_period: 180s
```

That's the minimum fix to prevent the "unhealthy" error!

---

**Last Updated:** 2025-11-26

