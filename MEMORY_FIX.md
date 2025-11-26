# MSSQL Memory Allocation Fix

## Problem Identified

The MSSQL container was only detecting **1.6GB of RAM** instead of the configured 6GB because:

1. **`deploy.resources` only works in Docker Swarm mode**, not regular docker-compose
2. The health check command had password escaping issues
3. Health check timeout was too short

## Solution Applied

### 1. Fixed Memory Allocation
Changed from `deploy.resources` (Swarm-only) to direct memory limits:

```yaml
# OLD (doesn't work in regular docker-compose):
deploy:
  resources:
    limits:
      memory: 6G

# NEW (works in docker-compose):
mem_limit: 6g
mem_reservation: 4g
cpus: 4.0
```

### 2. Improved Health Check
- Removed password quotes (causing escaping issues)
- Added `-C` flag (trust server certificate)
- Added `-b` flag (exit on error)
- Increased timeout from 5s to 10s
- Increased start_period from 90s to 120s

```yaml
# OLD:
test: ["CMD-SHELL", "/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'Sipamara123!' -Q 'SELECT 1' || exit 1"]

# NEW:
test: ["CMD-SHELL", "/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P Sipamara123! -C -Q \"SELECT 1\" -b || exit 1"]
```

## Verification

After applying the fix, verify memory allocation:

```powershell
# Check container memory
docker stats docker-demo-iterp-mssql-1 --no-stream

# Check MSSQL detected memory (should show ~6GB)
docker-compose logs mssql | grep "Detected.*RAM"
```

Expected output should show:
```
Detected 6144 MB of RAM (or similar, close to 6GB)
```

## Next Steps

1. Stop current containers:
   ```powershell
   docker-compose down -v
   ```

2. Start with fixed configuration:
   ```powershell
   docker-compose up -d
   ```

3. Monitor startup:
   ```powershell
   docker-compose logs -f mssql
   ```

4. Wait 120 seconds for MSSQL to fully initialize

5. Check health status:
   ```powershell
   docker-compose ps
   ```

## Expected Results

- ✅ MSSQL detects 6GB RAM
- ✅ Health check passes within 120 seconds
- ✅ Next.js app starts successfully
- ✅ Application accessible at http://localhost:3000

