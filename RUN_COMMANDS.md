# 🚀 Commands to Run IT ERP System

## Quick Start (Recommended)

### Step 1: Stop Old Containers (if running)
```powershell
docker-compose down -v
```

### Step 2: Start Everything
```powershell
docker-compose up -d
```

### Step 3: Monitor Startup
```powershell
docker-compose logs -f
```

## Alternative: One-Command Script

### Windows PowerShell:
```powershell
.\fix-mssql.ps1
```

### Or use the deployment script:
```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/GuneshSSPL/IT-ERP/main/run.ps1 | Invoke-Expression
```

## Manual Docker Run (Without docker-compose)

If you prefer using `docker run` directly:

### Step 1: Create Network
```powershell
docker network create iterp-network
```

### Step 2: Start MSSQL
```powershell
docker run -d `
  --name mssql `
  --network iterp-network `
  -e ACCEPT_EULA=Y `
  -e SA_PASSWORD=Sipamara123! `
  -e MSSQL_PID=Developer `
  -p 1433:1433 `
  -v mssql-data:/var/opt/mssql `
  --restart unless-stopped `
  mcr.microsoft.com/mssql/server:2022-latest
```

### Step 3: Start Application
```powershell
docker run -d `
  --name iterp-app `
  --network iterp-network `
  -p 3000:3000 `
  -e NODE_ENV=production `
  -e DB_USERNAME=sa `
  -e DB_PASSWORD=Sipamara123! `
  -e DB_DATABASE=ITERP `
  -e DB_HOST=mssql `
  -e DB_PORT=1433 `
  -e JWT_SECRET=your-super-secret-jwt-key-change-in-production `
  -e JWT_EXPIRES_IN=7d `
  -e NEXT_PUBLIC_APP_URL=http://localhost:3000 `
  --restart unless-stopped `
  sipamara/iterp-app:latest
```

## Check Status

```powershell
# Check if containers are running
docker-compose ps

# Or with docker run:
docker ps
```

## Access Application

- **URL**: http://localhost:3000
- **Login**: `admin@iterp.com` / `admin123`

## Important Notes

⚠️ **Password Changed**: Database password is now `Sipamara123!` (was `sipamara`)

⏱️ **Startup Time**: MSSQL takes 60-90 seconds to become healthy. Be patient!

## Troubleshooting

### If containers won't start:
```powershell
# Check logs
docker-compose logs mssql
docker-compose logs nextjs-app

# Check if ports are in use
netstat -ano | findstr :3000
netstat -ano | findstr :1433
```

### If MSSQL is unhealthy:
```powershell
# Wait longer (MSSQL needs 60-90 seconds)
docker-compose logs -f mssql

# Check container resources
docker stats
```

## Stop Everything

```powershell
docker-compose down
```

## Remove Everything (including data)

```powershell
docker-compose down -v
```

