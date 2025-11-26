# Testing Guide - IT ERP System Deployment

## Quick Test Commands

### 1. Test the Deployment Script
```powershell
# Run the deployment script
Invoke-WebRequest -Uri https://raw.githubusercontent.com/GuneshSSPL/IT-ERP/main/run.ps1 | Invoke-Expression
```

### 2. Run Automated Tests
```powershell
# Run the test script
.\test-deployment.ps1
```

### 3. Manual Verification

#### Check Container Status
```powershell
docker-compose ps
```

**Expected Output:**
- `docker-demo-iterp-mssql-1` - Status: `Up (healthy)`
- `docker-demo-iterp-nextjs-app-1` - Status: `Up`

#### Check MSSQL Health
```powershell
docker exec docker-demo-iterp-mssql-1 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P Sipamara123! -C -Q "SELECT @@VERSION"
```

**Expected:** SQL Server version information

#### Check Application Health
```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/health
```

**Expected:** `{"status":"ok","database":"connected"}`

#### Check Resource Usage
```powershell
docker stats --no-stream
```

**Expected:**
- MSSQL: ~4-6GB memory usage
- Next.js: ~200-500MB memory usage

## Troubleshooting

### MSSQL Container Unhealthy

**Symptoms:**
- Container shows `(unhealthy)` status
- Health check fails

**Solutions:**
1. Check MSSQL logs:
   ```powershell
   docker-compose logs mssql | tail -50
   ```

2. Verify memory allocation:
   ```powershell
   docker stats docker-demo-iterp-mssql-1 --no-stream
   ```
   Should show ~6GB limit

3. Check healthcheck path:
   ```powershell
   docker exec docker-demo-iterp-mssql-1 ls -la /opt/mssql-tools18/bin/sqlcmd
   ```
   Should exist

4. Wait longer (MSSQL needs 3-4 minutes on first start)

### Application Not Starting

**Symptoms:**
- Next.js container exits immediately
- Application not accessible

**Solutions:**
1. Check application logs:
   ```powershell
   docker-compose logs nextjs-app
   ```

2. Verify MSSQL is healthy first:
   ```powershell
   docker-compose ps
   ```

3. Check database connection:
   ```powershell
   docker exec docker-demo-iterp-nextjs-app-1 env | grep DB_
   ```

### Memory Issues

**Symptoms:**
- Containers killed with OOM (Out of Memory)
- System slow

**Solutions:**
1. Check Docker Desktop memory allocation:
   - Docker Desktop → Settings → Resources
   - Ensure at least 8GB allocated

2. Reduce memory limits in `docker-compose.yml`:
   ```yaml
   mssql:
     mem_limit: 4g  # Reduce if needed
     mem_reservation: 2g
   ```

## Success Criteria

✅ All containers show `Up` status  
✅ MSSQL shows `(healthy)`  
✅ Application responds at http://localhost:3000  
✅ Health endpoint returns `{"status":"ok"}`  
✅ Can login with `admin@iterp.com` / `admin123`  
✅ No errors in logs  

## Performance Benchmarks

### Expected Startup Times
- **MSSQL Initialization**: 60-90 seconds (first run), 30-45 seconds (subsequent)
- **Health Check Pass**: 180-240 seconds total
- **Application Ready**: 240-300 seconds total

### Resource Usage
- **MSSQL**: 4-6GB RAM, 2-4 CPUs
- **Next.js**: 200-500MB RAM, 1-2 CPUs
- **Total**: ~6-7GB RAM, 3-6 CPUs

## Next Steps After Successful Test

1. ✅ Verify all features work
2. ✅ Test login and authentication
3. ✅ Check database initialization
4. ✅ Verify seeded data is present
5. ✅ Test key workflows (projects, employees, etc.)

## Reporting Issues

If tests fail, collect:
1. Output of `docker-compose ps`
2. Output of `docker-compose logs mssql`
3. Output of `docker-compose logs nextjs-app`
4. Output of `docker stats --no-stream`
5. System information (OS, Docker version, available RAM)

