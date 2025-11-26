#!/bin/bash
# Startup script for standalone container

# Start MSSQL Server in background
/opt/mssql/bin/sqlservr &
MSSQL_PID=$!

# Wait for MSSQL to be ready
echo "Waiting for MSSQL Server to start..."
for i in {1..60}; do
    if /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P sipamara -Q "SELECT 1" &> /dev/null; then
        echo "MSSQL Server is ready!"
        break
    fi
    echo "Waiting... ($i/60)"
    sleep 2
done

# Start Next.js application
echo "Starting Next.js application..."
cd /app
exec node_modules/.bin/next start

