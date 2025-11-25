# Troubleshooting Guide

## Browser Extension Errors

### "Not allowed to define cross-origin object as property on [Object] or [Array] XrayWrapper"

This error is typically caused by browser extensions (like password managers, ad blockers, or developer tools) that inject content scripts into the page. It's **not an error in your code**.

**Solutions:**
1. **Ignore it** - This error doesn't affect functionality
2. **Disable extensions** - Temporarily disable browser extensions to test
3. **Use incognito mode** - Test in incognito/private browsing mode
4. **Different browser** - Try a different browser

The code has been updated with safe localStorage utilities that handle these edge cases gracefully.

## Database Connection Issues

### "Database connection error"

**Check:**
1. MSSQL server is running
2. Database credentials are correct in `.env` file
3. Port 1433 is not blocked by firewall
4. Database `ITERP` exists (will be created automatically)

**Solution:**
- Verify database is accessible: `sqlcmd -S localhost -U sa -P sipamara`
- Check environment variables match your database setup

## Authentication Issues

### "Invalid email or password"

**Check:**
1. Default admin credentials:
   - Email: `admin@iterp.com`
   - Password: `admin123`
2. Database has been initialized
3. User exists in database

**Solution:**
- Access `/api/init` endpoint to reinitialize database
- Check database directly to verify user exists

## Build Errors

### CSS Parsing Errors

**Solution:**
- Clear `.next` folder: `rm -rf .next` (or `rmdir /s .next` on Windows)
- Reinstall dependencies: `npm install`
- Restart dev server

### TypeScript Errors

**Solution:**
- Run `npm run typecheck` to see all errors
- Fix any import issues
- Ensure all dependencies are installed

## Runtime Errors

### "Cannot read property of undefined"

**Check:**
1. Database is initialized
2. API routes are working
3. Authentication token is valid

**Solution:**
- Check browser console for detailed errors
- Verify API endpoints return data
- Check network tab for failed requests

## Docker Issues

### Container won't start

**Check:**
1. Docker is running
2. Ports 3000 and 1433 are available
3. Docker has enough resources

**Solution:**
- `docker-compose down -v` (removes volumes)
- `docker-compose up -d --build` (rebuilds containers)
- Check logs: `docker-compose logs`

### Database not initializing in Docker

**Solution:**
- Wait 30-60 seconds for MSSQL to start
- Check MSSQL logs: `docker-compose logs mssql`
- Verify health check: `docker-compose ps`

## Performance Issues

### Slow page loads

**Check:**
1. Database indexes are created
2. No N+1 query problems
3. Proper connection pooling

**Solution:**
- Check database query performance
- Review API response times
- Optimize database queries

