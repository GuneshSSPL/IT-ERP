# Docker Deployment Guide

Complete guide for building, transferring, and running the IT ERP System Docker image on any system.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Building the Docker Image](#building-the-docker-image)
3. [Transfer Methods](#transfer-methods)
4. [Running on Target System](#running-on-target-system)
5. [Verification & Troubleshooting](#verification--troubleshooting)
6. [Production Considerations](#production-considerations)

---

## Prerequisites

### Source System Requirements

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **Disk Space**: At least 5GB free space for image building
- **Memory**: Minimum 4GB RAM (8GB recommended for building)
- **Network**: Internet connection for pulling base images

### Target System Requirements

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher (if using docker-compose)
- **Disk Space**: At least 10GB free space
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Ports**: 
  - Port 3000 available for the Next.js application
  - Port 1433 available for MSSQL (or configure different port)

### Verify Docker Installation

```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker-compose --version

# Verify Docker is running
docker ps
```

---

## Building the Docker Image

### Method 1: Using Docker Compose (Recommended)

This method builds both the Next.js application and sets up the MSSQL database service.

```bash
# Navigate to project directory
cd /path/to/docker-demo

# Build all services
docker-compose build

# Or build and start in one command
docker-compose up -d --build
```

**What this does:**
- Builds the Next.js application using the multi-stage Dockerfile
- Pulls the MSSQL Server 2022 image
- Creates a Docker network for service communication
- Sets up named volumes for data persistence

### Method 2: Building Individual Images

If you need to build only the application image:

```bash
# Build the Next.js application image
docker build -t iterp-app:latest .

# Or with a specific tag
docker build -t iterp-app:v1.0.0 .
```

**Tagging Strategies:**

```bash
# Semantic versioning
docker build -t iterp-app:1.0.0 .

# With registry prefix (for Docker Hub)
docker build -t yourusername/iterp-app:1.0.0 .

# Latest tag
docker build -t iterp-app:latest .

# Multiple tags
docker build -t iterp-app:1.0.0 -t iterp-app:latest .
```

### Understanding the Multi-Stage Build

The Dockerfile uses a multi-stage build process:

1. **Builder Stage**: 
   - Installs all dependencies (dev + production)
   - Compiles TypeScript
   - Builds Next.js application
   - Creates optimized production bundle

2. **Runner Stage**:
   - Only includes production dependencies
   - Copies built application from builder
   - Runs as non-root user for security
   - Minimal image size (~200MB vs ~1GB with dev dependencies)

### Build Optimization Tips

```bash
# Use build cache for faster rebuilds
docker build --cache-from iterp-app:latest -t iterp-app:latest .

# Build without cache (clean build)
docker build --no-cache -t iterp-app:latest .

# Show build progress
docker build --progress=plain -t iterp-app:latest .
```

---

## Transfer Methods

### Method 1: Docker Hub (Recommended for Internet-Connected Systems)

Best for systems with internet access. Fast and reliable.

#### Step 1: Create Docker Hub Account

1. Go to https://hub.docker.com
2. Sign up for a free account
3. Create a repository (e.g., `iterp-app`)

#### Step 2: Push to Docker Hub

```bash
# Login to Docker Hub
docker login

# Tag your image with your Docker Hub username
docker tag iterp-app:latest yourusername/iterp-app:latest

# Push the image
docker push yourusername/iterp-app:latest

# Push with version tag
docker tag iterp-app:latest yourusername/iterp-app:1.0.0
docker push yourusername/iterp-app:1.0.0
```

#### Step 3: Pull on Target System

```bash
# Login (if using private repository)
docker login

# Pull the image
docker pull yourusername/iterp-app:latest

# Verify image
docker images yourusername/iterp-app:latest
```

#### Step 4: Update docker-compose.yml on Target System

Edit `docker-compose.yml` to use the pulled image:

```yaml
services:
  nextjs-app:
    image: yourusername/iterp-app:latest  # Use this instead of build
    # build:  # Comment out or remove build section
    #   context: .
    #   dockerfile: Dockerfile
    ports:
      - "3000:3000"
    # ... rest of configuration
```

**For Private Repositories:**

```bash
# Create private repository on Docker Hub
# Then push with same commands

# On target system, login first
docker login
docker pull yourusername/iterp-app:latest
```

**Advantages:**
- ✅ Fast transfer over internet
- ✅ Version management
- ✅ Easy updates
- ✅ No file size limits
- ✅ Works across platforms

**Disadvantages:**
- ❌ Requires internet connection
- ❌ Public repos are visible to everyone
- ❌ Private repos require paid plan (or use alternative registries)

---

### Method 2: Docker Save/Load (File Transfer)

Best for air-gapped systems or when internet is not available.

#### Step 1: Save Image to File

On the source system:

```bash
# Save single image
docker save iterp-app:latest -o iterp-app-latest.tar

# Save with compression (smaller file size)
docker save iterp-app:latest | gzip > iterp-app-latest.tar.gz

# Save multiple images (if needed)
docker save iterp-app:latest mcr.microsoft.com/mssql/server:2022-latest -o iterp-images.tar
```

**File Size Considerations:**
- Uncompressed: ~1-2GB
- Compressed: ~500MB-1GB
- Ensure target system has enough space

#### Step 2: Transfer the File

Choose one of these methods:

**Option A: USB Drive**
```bash
# Copy to USB drive
cp iterp-app-latest.tar.gz /media/usb-drive/

# On target system, copy from USB
cp /media/usb-drive/iterp-app-latest.tar.gz ./
```

**Option B: Network Transfer (SCP)**
```bash
# From source system
scp iterp-app-latest.tar.gz user@target-system:/path/to/destination/

# Or using rsync (resumable)
rsync -avz --progress iterp-app-latest.tar.gz user@target-system:/path/to/destination/
```

**Option C: Network Share**
```bash
# Mount network share and copy
mount -t cifs //server/share /mnt/share
cp iterp-app-latest.tar.gz /mnt/share/
```

**Option D: Cloud Storage**
- Upload to Google Drive, Dropbox, OneDrive, etc.
- Download on target system

#### Step 3: Load Image on Target System

```bash
# Load uncompressed tar
docker load -i iterp-app-latest.tar

# Load compressed tar
gunzip -c iterp-app-latest.tar.gz | docker load

# Or in one command
docker load < iterp-app-latest.tar.gz

# Verify loaded image
docker images iterp-app
```

#### Step 4: Load MSSQL Image (if not already present)

```bash
# Option 1: Pull from internet (if available)
docker pull mcr.microsoft.com/mssql/server:2022-latest

# Option 2: Save and transfer MSSQL image from source
# On source:
docker save mcr.microsoft.com/mssql/server:2022-latest | gzip > mssql-2022.tar.gz
# Transfer and load on target (same process as above)
```

**Advantages:**
- ✅ Works offline
- ✅ No registry account needed
- ✅ Complete control over distribution
- ✅ Can include multiple images in one file

**Disadvantages:**
- ❌ Large file sizes
- ❌ Manual transfer required
- ❌ No automatic updates
- ❌ Platform-specific (Linux/Windows)

---

### Method 3: Private Docker Registry

Best for organizations with multiple deployments or internal networks.

#### Step 1: Set Up Private Registry

**Option A: Docker Registry (Self-Hosted)**

```bash
# Run registry container
docker run -d -p 5000:5000 --name registry \
  -v registry-data:/var/lib/registry \
  --restart=always \
  registry:2

# Tag image for private registry
docker tag iterp-app:latest localhost:5000/iterp-app:latest

# Push to private registry
docker push localhost:5000/iterp-app:latest
```

**Option B: Harbor (Enterprise Registry)**

Harbor provides a full-featured registry with UI, vulnerability scanning, and more.

**Option C: AWS ECR, Google Container Registry, Azure Container Registry**

Cloud-provided private registries with integrated security and management.

#### Step 2: Pull from Private Registry

```bash
# Login to registry
docker login your-registry.com:5000

# Pull image
docker pull your-registry.com:5000/iterp-app:latest
```

**Advantages:**
- ✅ Full control
- ✅ Private and secure
- ✅ Version management
- ✅ Can be on-premises

**Disadvantages:**
- ❌ Requires setup and maintenance
- ❌ Network access needed
- ❌ Additional infrastructure

---

## Running on Target System

### Method 1: Using Docker Compose (Recommended)

This is the easiest method as it handles both the application and database.

#### Step 1: Prepare Files

Copy these files to the target system:
- `docker-compose.yml`
- `Dockerfile` (if building locally)
- `.env` file (optional, or edit docker-compose.yml directly)
- `docker/mssql/init.sql` (for database initialization)

#### Step 2: Configure Environment

Edit `docker-compose.yml` or create `.env` file:

```yaml
# docker-compose.yml environment section
environment:
  - NODE_ENV=production
  - DB_USERNAME=sa
  - DB_PASSWORD=your-secure-password  # CHANGE THIS!
  - DB_DATABASE=ITERP
  - DB_HOST=mssql
  - DB_PORT=1433
  - JWT_SECRET=your-super-secret-jwt-key-change-in-production  # CHANGE THIS!
  - JWT_EXPIRES_IN=7d
  - NEXT_PUBLIC_APP_URL=http://localhost:3000  # Or your domain
```

#### Step 3: Start Services

```bash
# Start in detached mode (background)
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f nextjs-app
docker-compose logs -f mssql
```

#### Step 4: Verify Services

```bash
# Check running containers
docker-compose ps

# Check container status
docker ps

# Test application
curl http://localhost:3000/api/health
```

#### Step 5: Access Application

- **Application**: http://localhost:3000 (or your server IP)
- **Default Admin Login**:
  - Email: `admin@iterp.com`
  - Password: `admin123`

### Method 2: Using Docker Run (Manual Setup)

For more control or if you prefer not to use docker-compose.

#### Step 1: Create Docker Network

```bash
docker network create iterp-network
```

#### Step 2: Start MSSQL Container

```bash
docker run -d \
  --name mssql \
  --network iterp-network \
  -e ACCEPT_EULA=Y \
  -e SA_PASSWORD=your-secure-password \
  -e MSSQL_PID=Developer \
  -p 1433:1433 \
  -v mssql-data:/var/opt/mssql \
  --restart unless-stopped \
  mcr.microsoft.com/mssql/server:2022-latest
```

#### Step 3: Start Application Container

```bash
docker run -d \
  --name iterp-app \
  --network iterp-network \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_USERNAME=sa \
  -e DB_PASSWORD=your-secure-password \
  -e DB_DATABASE=ITERP \
  -e DB_HOST=mssql \
  -e DB_PORT=1433 \
  -e JWT_SECRET=your-super-secret-jwt-key \
  -e JWT_EXPIRES_IN=7d \
  -e NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  --restart unless-stopped \
  iterp-app:latest
```

#### Step 4: Verify

```bash
# Check containers
docker ps

# Check logs
docker logs iterp-app
docker logs mssql

# Test connectivity
docker exec iterp-app ping mssql
```

### Port Configuration

If ports 3000 or 1433 are already in use, change them:

**In docker-compose.yml:**
```yaml
services:
  nextjs-app:
    ports:
      - "8080:3000"  # External:Internal
  mssql:
    ports:
      - "1434:1433"  # External:Internal
```

**With docker run:**
```bash
-p 8080:3000  # Map external port 8080 to container port 3000
```

### Volume Mounting

**Persistent Data:**
```yaml
volumes:
  mssql-data:  # Named volume (managed by Docker)
  # Or use bind mount:
  - ./data/mssql:/var/opt/mssql
```

**Application Logs:**
```yaml
volumes:
  - ./logs:/app/logs
```

---

## Verification & Troubleshooting

### Health Checks

#### Check Container Status

```bash
# All containers
docker-compose ps

# Specific container
docker ps | grep iterp

# Container details
docker inspect iterp-app
```

#### Check Application Health

```bash
# Health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {"status":"ok","database":"connected"}
```

#### Check Database Connection

```bash
# From application container
docker exec iterp-app npm run db:test

# Or connect directly
docker exec -it mssql /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P your-password \
  -Q "SELECT @@VERSION"
```

#### Check Logs

```bash
# All services
docker-compose logs

# Follow logs (real-time)
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service
docker-compose logs nextjs-app
docker-compose logs mssql

# Container logs
docker logs iterp-app
docker logs mssql

# With timestamps
docker logs -t iterp-app
```

### Common Issues and Solutions

#### Issue 1: Container Won't Start

**Symptoms:**
- Container exits immediately
- `docker ps -a` shows exited status

**Solutions:**
```bash
# Check exit code
docker inspect iterp-app | grep ExitCode

# View logs for error
docker logs iterp-app

# Common causes:
# - Port already in use: Change port mapping
# - Environment variables missing: Check docker-compose.yml
# - Database not ready: Check mssql container logs
```

#### Issue 2: Database Connection Failed

**Symptoms:**
- Application logs show "Connection refused" or "ECONNREFUSED"
- Health check fails

**Solutions:**
```bash
# Verify MSSQL is running
docker ps | grep mssql

# Check network connectivity
docker exec iterp-app ping mssql

# Verify environment variables
docker exec iterp-app env | grep DB_

# Check MSSQL logs
docker logs mssql

# Test direct connection
docker exec -it mssql /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P your-password -Q "SELECT 1"
```

#### Issue 3: Port Already in Use

**Symptoms:**
- Error: "port is already allocated"
- Cannot start container

**Solutions:**
```bash
# Find process using port
# Linux/Mac:
lsof -i :3000
# Windows:
netstat -ano | findstr :3000

# Kill process or change port in docker-compose.yml
```

#### Issue 4: Out of Disk Space

**Symptoms:**
- Build fails
- Container stops unexpectedly

**Solutions:**
```bash
# Check disk space
df -h

# Clean Docker system
docker system prune -a

# Remove unused volumes
docker volume prune

# Remove old images
docker image prune -a
```

#### Issue 5: Database Not Initializing

**Symptoms:**
- Tables not created
- Default user not available

**Solutions:**
```bash
# Check application logs for initialization
docker logs iterp-app | grep -i "database\|init"

# Manually trigger initialization
docker exec iterp-app curl http://localhost:3000/api/init

# Check database directly
docker exec -it mssql /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P your-password \
  -d ITERP -Q "SELECT name FROM sys.tables"
```

#### Issue 6: Slow Performance

**Symptoms:**
- Application responds slowly
- High CPU/Memory usage

**Solutions:**
```bash
# Check resource usage
docker stats

# Increase memory limit in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 2G
    reservations:
      memory: 1G

# Check for memory leaks
docker stats --no-stream
```

### Database Initialization Verification

```bash
# Check if tables exist
docker exec -it mssql /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P your-password \
  -d ITERP \
  -Q "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'"

# Check default admin user
docker exec -it mssql /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P your-password \
  -d ITERP \
  -Q "SELECT email, employee_id FROM users WHERE email = 'admin@iterp.com'"

# Check seeded data
docker exec -it mssql /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P your-password \
  -d ITERP \
  -Q "SELECT COUNT(*) as user_count FROM users"
```

### Useful Debugging Commands

```bash
# Enter container shell
docker exec -it iterp-app sh
docker exec -it mssql bash

# Check network
docker network inspect iterp-network

# Check volumes
docker volume ls
docker volume inspect mssql-data

# Container resource usage
docker stats iterp-app mssql

# Inspect container configuration
docker inspect iterp-app | jq '.[0].Config.Env'
```

---

## Production Considerations

### Security Best Practices

#### 1. Change Default Passwords

**Before deployment, update:**
- Database SA password
- JWT secret key
- Default admin password (after first login)

```yaml
# Use strong passwords
environment:
  - SA_PASSWORD=StrongPassword123!@#
  - JWT_SECRET=Use-A-Very-Long-Random-String-Here-Minimum-32-Characters
```

#### 2. Use Environment Files

Create `.env` file (add to `.gitignore`):

```bash
# .env
DB_PASSWORD=your-secure-password
JWT_SECRET=your-super-secret-jwt-key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

Update `docker-compose.yml`:
```yaml
env_file:
  - .env
```

#### 3. Enable HTTPS

Use reverse proxy (Nginx, Traefik) with SSL certificates:

```yaml
# docker-compose.yml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - nextjs-app
```

#### 4. Limit Container Resources

```yaml
services:
  nextjs-app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

#### 5. Use Non-Root User

Already implemented in Dockerfile, but verify:
```dockerfile
USER nextjs  # Non-root user
```

#### 6. Network Security

```yaml
# Don't expose MSSQL port publicly in production
services:
  mssql:
    ports:
      # Remove or comment out:
      # - "1433:1433"
    # Only accessible within Docker network
```

### Resource Limits

```yaml
services:
  nextjs-app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 512M
  
  mssql:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
```

### Backup Strategies

#### Database Backups

```bash
# Manual backup
docker exec mssql /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P your-password \
  -Q "BACKUP DATABASE ITERP TO DISK = '/var/opt/mssql/backup/iterp.bak'"

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec mssql /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U sa -P your-password \
  -Q "BACKUP DATABASE ITERP TO DISK = '/var/opt/mssql/backup/iterp_${DATE}.bak'"
docker cp mssql:/var/opt/mssql/backup/iterp_${DATE}.bak ${BACKUP_DIR}/
```

#### Volume Backups

```bash
# Backup MSSQL data volume
docker run --rm -v mssql-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/mssql-data-backup.tar.gz /data

# Restore volume
docker run --rm -v mssql-data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/mssql-data-backup.tar.gz -C /
```

### Update Procedures

#### Method 1: Rolling Update (Zero Downtime)

```bash
# Build new image
docker-compose build nextjs-app

# Start new container without stopping old
docker-compose up -d --no-deps nextjs-app

# Verify new container
docker-compose ps

# Remove old container
docker-compose rm -f nextjs-app
```

#### Method 2: Blue-Green Deployment

```bash
# Deploy new version on different port
docker-compose -f docker-compose.blue.yml up -d

# Test new version
curl http://localhost:3001/api/health

# Switch traffic (update load balancer/reverse proxy)
# Stop old version
docker-compose down
```

#### Method 3: Using Docker Hub

```bash
# Pull latest image
docker-compose pull nextjs-app

# Restart with new image
docker-compose up -d nextjs-app
```

### Monitoring

#### Health Checks

```yaml
services:
  nextjs-app:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

#### Log Management

```yaml
services:
  nextjs-app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Performance Optimization

#### 1. Use Multi-Stage Builds
Already implemented in Dockerfile.

#### 2. Layer Caching
```dockerfile
# Copy package files first (changes less frequently)
COPY package*.json ./
RUN npm ci

# Copy source code last (changes frequently)
COPY . .
```

#### 3. Production Dependencies Only
```dockerfile
RUN npm ci --only=production
```

#### 4. Use .dockerignore
```
node_modules
.next
.git
.env
*.md
```

### Scaling

#### Horizontal Scaling

```yaml
services:
  nextjs-app:
    deploy:
      replicas: 3
    # Use load balancer (Nginx, Traefik)
```

#### Database Scaling

- Use read replicas for MSSQL
- Consider connection pooling
- Implement caching layer (Redis)

---

## Quick Reference

### Essential Commands

```bash
# Build and start
docker-compose up -d --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart service
docker-compose restart nextjs-app

# Update and restart
docker-compose pull && docker-compose up -d

# Clean everything
docker-compose down -v
docker system prune -a
```

### File Transfer Quick Commands

```bash
# Save image
docker save iterp-app:latest | gzip > iterp-app.tar.gz

# Load image
gunzip -c iterp-app.tar.gz | docker load

# Push to Docker Hub
docker push yourusername/iterp-app:latest

# Pull from Docker Hub
docker pull yourusername/iterp-app:latest
```

---

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Verify health: `curl http://localhost:3000/api/health`
3. Review this guide's troubleshooting section
4. Check GitHub issues (if applicable)

---

**Last Updated**: 2024
**Version**: 1.0.0

