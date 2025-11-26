# IT ERP - True Single Image Deployment

## 🎯 Goal: Pull One Image, Run One Command

You want to install Docker, pull an image, and run it - nothing else!

## ⚠️ Technical Reality

**The Challenge:** Your application needs TWO services:
1. **Next.js Application** (your code)
2. **MSSQL Database Server** (separate service)

Docker images are designed to run ONE process per container. Running both in one container is possible but:
- ❌ Not a best practice (anti-pattern)
- ❌ Harder to maintain
- ❌ Larger image size
- ❌ More complex startup

## ✅ Best Solution: One-Command Deployment

Instead of one image, we provide **one command** that does everything:

### Option 1: Single Command (Linux/Mac)

```bash
curl -sSL https://raw.githubusercontent.com/GuneshSSPL/IT-ERP/main/run.sh | bash
```

### Option 2: Single Command (Windows PowerShell)

```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/GuneshSSPL/IT-ERP/main/run.ps1 | Invoke-Expression
```

### Option 3: Manual (Still Simple)

```bash
# Step 1: Create docker-compose.yml (copy from repo)
# Step 2: Run
docker-compose up -d
```

## 🔍 What Happens Automatically

The deployment script/command:
1. ✅ Creates `docker-compose.yml` automatically
2. ✅ Pulls `sipamara/iterp-app:latest` from Docker Hub
3. ✅ Pulls `mcr.microsoft.com/mssql/server:2022-latest` automatically
4. ✅ Starts both containers
5. ✅ Sets up networking
6. ✅ Waits for database to be ready
7. ✅ Application auto-initializes database
8. ✅ Everything runs!

## 📦 What's in Your Image

Your `sipamara/iterp-app:latest` image contains:
- ✅ Complete Next.js application (built)
- ✅ All database initialization code (embedded)
- ✅ All seed data (embedded)
- ✅ All dependencies
- ✅ Auto-startup logic

**Everything is self-contained in the image!**

## 🚀 Deployment Comparison

### Current Approach (Recommended)
- **Command**: `docker-compose up -d` (after creating docker-compose.yml)
- **Images**: 2 containers (app + database)
- **Best Practice**: ✅ Yes
- **Maintainable**: ✅ Yes
- **Size**: Smaller (each service optimized)

### Alternative: Single Container (Not Recommended)
- **Command**: `docker run sipamara/iterp-app:standalone`
- **Images**: 1 container (app + database together)
- **Best Practice**: ❌ Anti-pattern
- **Maintainable**: ❌ Harder
- **Size**: Larger (includes both services)

## 💡 Recommendation

**Use the one-command deployment script!**

It gives you:
- ✅ True "one command" experience
- ✅ Best practices (separate containers)
- ✅ Easy maintenance
- ✅ Optimal performance
- ✅ Standard Docker architecture

## 🎯 Final Answer

**For true "pull and run":**

1. **Install Docker** (only requirement)
2. **Run one command:**
   ```bash
   curl -sSL https://raw.githubusercontent.com/GuneshSSPL/IT-ERP/main/run.sh | bash
   ```

That's it! The script handles everything else automatically.

**Your image is already self-contained** - the script just orchestrates the containers for you.

