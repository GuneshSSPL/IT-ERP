# MSSQL Container Optimization - 6GB RAM Configuration

## Changes Applied

### Resource Allocation
- **Memory Limit**: Increased from 2GB to **6GB**
- **Memory Reservation**: Increased from 1GB to **4GB**
- **CPU Limit**: Added **4 CPUs**
- **CPU Reservation**: Added **2 CPUs**

### Health Check Optimization
- **Start Period**: Increased from 60s to **90s** (gives MSSQL more time to initialize)
- **Interval**: Reduced from 15s to **10s** (checks more frequently once started)
- **Timeout**: Reduced from 10s to **5s** (faster failure detection)
- **Retries**: Increased from 20 to **30** (more attempts before marking unhealthy)

## Why These Changes?

1. **6GB RAM**: MSSQL Server 2022 performs significantly better with more memory, especially during startup
2. **4 CPUs**: Allows parallel processing during initialization
3. **90s Start Period**: MSSQL can take 60-90 seconds to fully initialize, especially on first run
4. **More Retries**: Prevents false negatives during the startup window

## Expected Performance

- **First Startup**: 60-90 seconds (database initialization)
- **Subsequent Starts**: 30-45 seconds (faster with existing data)
- **Health Check**: Passes within 90-120 seconds total

## System Requirements

**Minimum System Requirements:**
- **RAM**: 8GB total (6GB for MSSQL + 2GB for OS/Next.js)
- **CPU**: 4 cores recommended
- **Disk**: 10GB free space

**Recommended System Requirements:**
- **RAM**: 16GB total
- **CPU**: 8 cores
- **Disk**: 20GB free space (SSD recommended)

## Troubleshooting

### If Still Failing After 90 Seconds

1. **Check System Resources**:
   ```powershell
   docker stats
   ```
   Ensure you have enough RAM available.

2. **Check MSSQL Logs**:
   ```powershell
   docker-compose logs mssql | tail -100
   ```
   Look for memory or initialization errors.

3. **Test MSSQL Manually**:
   ```powershell
   docker exec -it docker-demo-iterp-mssql-1 /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P 'Sipamara123!' -Q "SELECT @@VERSION"
   ```

4. **Reduce Resources (if needed)**:
   If your system has less than 8GB RAM, edit `docker-compose.yml`:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 4G  # Reduce if needed
         cpus: '2.0'
       reservations:
         memory: 2G
         cpus: '1.0'
   ```

## Verification

After startup, verify resources:
```powershell
# Check container resources
docker stats docker-demo-iterp-mssql-1

# Should show ~4-6GB memory usage
```

