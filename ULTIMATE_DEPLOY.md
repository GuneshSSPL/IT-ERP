# IT ERP - Ultimate One-Command Deployment

## 🎯 Your Goal: Install Docker → Pull Image → Run

**Perfect! Here's the simplest possible deployment:**

## ✅ One-Command Solution

### Linux/Mac:
```bash
curl -sSL https://raw.githubusercontent.com/GuneshSSPL/IT-ERP/main/run.sh | bash
```

### Windows PowerShell:
```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/GuneshSSPL/IT-ERP/main/run.ps1 | Invoke-Expression
```

## 📋 What This Does

1. ✅ **Automatically creates** `docker-compose.yml`
2. ✅ **Pulls** your image (`sipamara/iterp-app:latest`)
3. ✅ **Pulls** MSSQL image automatically
4. ✅ **Starts** both containers
5. ✅ **Initializes** database automatically
6. ✅ **Runs** the application

**Result:** Fully functional IT ERP system at http://localhost:3000

## 🔍 Why Not a Single Image?

**Technical Reality:**
- Your app needs 2 services: Next.js app + MSSQL database
- Docker best practice: One service per container
- Running both in one container is an anti-pattern

**Our Solution:**
- One command that orchestrates both containers
- Feels like "pull and run"
- Follows Docker best practices
- Easy to maintain and update

## ✅ Your Image is Self-Contained

**What's in `sipamara/iterp-app:latest`:**
- ✅ Complete application (built)
- ✅ Database initialization (embedded in code)
- ✅ All seed data (embedded in code)
- ✅ All dependencies
- ✅ Auto-startup

**No external files needed in the image!**

## 🚀 Alternative: If You Really Want Single Image

If you absolutely need a single image (not recommended), I can create `Dockerfile.standalone` that runs both services in one container using supervisord. However, this is:
- ❌ Anti-pattern
- ❌ Harder to maintain
- ❌ Larger image size
- ❌ More complex

**Recommendation:** Use the one-command script - it's the best of both worlds!

## 📝 Summary

**For deployment:**
1. Install Docker (only requirement)
2. Run: `curl -sSL https://raw.githubusercontent.com/GuneshSSPL/IT-ERP/main/run.sh | bash`

**That's it!** Everything else is automatic.

Your image is already pushed and ready. The script just makes deployment a single command! 🎉

