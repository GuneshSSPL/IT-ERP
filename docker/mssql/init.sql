-- This file will be executed when MSSQL container starts
-- It creates the database and runs the schema

-- Wait for SQL Server to be ready
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ITERP')
BEGIN
    CREATE DATABASE ITERP;
END
GO

USE ITERP;
GO

-- The schema.sql file will be executed separately
-- This init script just ensures the database exists

PRINT 'Database ITERP initialized';
GO

