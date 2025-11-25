-- IT ERP System Database Schema
-- Database: ITERP

USE ITERP;
GO

-- Roles Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[roles]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[roles] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [name] NVARCHAR(100) NOT NULL UNIQUE,
        [description] NVARCHAR(MAX),
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Permissions Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[permissions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[permissions] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [name] NVARCHAR(100) NOT NULL UNIQUE,
        [resource] NVARCHAR(100) NOT NULL,
        [action] NVARCHAR(50) NOT NULL,
        [created_at] DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Role Permissions Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[role_permissions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[role_permissions] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [role_id] INT NOT NULL,
        [permission_id] INT NOT NULL,
        FOREIGN KEY ([role_id]) REFERENCES [dbo].[roles]([id]) ON DELETE CASCADE,
        FOREIGN KEY ([permission_id]) REFERENCES [dbo].[permissions]([id]) ON DELETE CASCADE,
        UNIQUE([role_id], [permission_id])
    );
END
GO

-- Departments Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[departments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[departments] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [name] NVARCHAR(100) NOT NULL,
        [code] NVARCHAR(50) NOT NULL UNIQUE,
        [head_id] INT NULL,
        [description] NVARCHAR(MAX),
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Users Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[users] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [email] NVARCHAR(255) NOT NULL UNIQUE,
        [password_hash] NVARCHAR(255) NOT NULL,
        [first_name] NVARCHAR(100) NOT NULL,
        [last_name] NVARCHAR(100) NOT NULL,
        [employee_id] NVARCHAR(50) NOT NULL UNIQUE,
        [phone] NVARCHAR(20),
        [department_id] INT,
        [manager_id] INT NULL,
        [role_id] INT NOT NULL,
        [is_active] BIT DEFAULT 1,
        [hire_date] DATE,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY ([department_id]) REFERENCES [dbo].[departments]([id]),
        FOREIGN KEY ([manager_id]) REFERENCES [dbo].[users]([id]),
        FOREIGN KEY ([role_id]) REFERENCES [dbo].[roles]([id])
    );
END
GO

-- Update Departments to reference Users
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[departments]') AND type in (N'U'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_departments_head_id')
    BEGIN
        ALTER TABLE [dbo].[departments]
        ADD CONSTRAINT FK_departments_head_id
        FOREIGN KEY ([head_id]) REFERENCES [dbo].[users]([id]);
    END
END
GO

-- Clients Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[clients]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[clients] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [name] NVARCHAR(255) NOT NULL,
        [industry] NVARCHAR(100),
        [website] NVARCHAR(255),
        [phone] NVARCHAR(20),
        [email] NVARCHAR(255),
        [address] NVARCHAR(MAX),
        [status] NVARCHAR(50) DEFAULT 'active',
        [account_manager_id] INT,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY ([account_manager_id]) REFERENCES [dbo].[users]([id])
    );
END
GO

-- Client Contacts Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[client_contacts]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[client_contacts] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [client_id] INT NOT NULL,
        [first_name] NVARCHAR(100) NOT NULL,
        [last_name] NVARCHAR(100) NOT NULL,
        [email] NVARCHAR(255),
        [phone] NVARCHAR(20),
        [job_title] NVARCHAR(100),
        [is_primary] BIT DEFAULT 0,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY ([client_id]) REFERENCES [dbo].[clients]([id]) ON DELETE CASCADE
    );
END
GO

-- Projects Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[projects]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[projects] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [name] NVARCHAR(255) NOT NULL,
        [code] NVARCHAR(50) NOT NULL UNIQUE,
        [client_id] INT NOT NULL,
        [project_manager_id] INT NOT NULL,
        [status] NVARCHAR(50) DEFAULT 'planning',
        [priority] NVARCHAR(50) DEFAULT 'medium',
        [start_date] DATE,
        [end_date] DATE,
        [budget] DECIMAL(18,2),
        [actual_cost] DECIMAL(18,2) DEFAULT 0,
        [description] NVARCHAR(MAX),
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY ([client_id]) REFERENCES [dbo].[clients]([id]),
        FOREIGN KEY ([project_manager_id]) REFERENCES [dbo].[users]([id])
    );
END
GO

-- Project Phases Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[project_phases]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[project_phases] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [project_id] INT NOT NULL,
        [name] NVARCHAR(255) NOT NULL,
        [description] NVARCHAR(MAX),
        [start_date] DATE,
        [end_date] DATE,
        [status] NVARCHAR(50) DEFAULT 'not_started',
        [sequence] INT NOT NULL,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE CASCADE
    );
END
GO

-- Project Assignments Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[project_assignments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[project_assignments] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [project_id] INT NOT NULL,
        [user_id] INT NOT NULL,
        [role] NVARCHAR(100),
        [allocation_percentage] INT DEFAULT 100,
        [start_date] DATE,
        [end_date] DATE,
        [hourly_rate] DECIMAL(18,2),
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE CASCADE,
        FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE,
        UNIQUE([project_id], [user_id])
    );
END
GO

-- Tasks Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[tasks]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[tasks] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [project_id] INT NOT NULL,
        [phase_id] INT NULL,
        [title] NVARCHAR(255) NOT NULL,
        [description] NVARCHAR(MAX),
        [assigned_to] INT NOT NULL,
        [created_by] INT NOT NULL,
        [status] NVARCHAR(50) DEFAULT 'todo',
        [priority] NVARCHAR(50) DEFAULT 'medium',
        [estimated_hours] DECIMAL(10,2),
        [actual_hours] DECIMAL(10,2) DEFAULT 0,
        [due_date] DATETIME2,
        [completed_at] DATETIME2 NULL,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE CASCADE,
        FOREIGN KEY ([phase_id]) REFERENCES [dbo].[project_phases]([id]),
        FOREIGN KEY ([assigned_to]) REFERENCES [dbo].[users]([id]),
        FOREIGN KEY ([created_by]) REFERENCES [dbo].[users]([id])
    );
END
GO

-- Time Entries Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[time_entries]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[time_entries] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL,
        [project_id] INT NOT NULL,
        [task_id] INT NULL,
        [date] DATE NOT NULL,
        [hours] DECIMAL(10,2) NOT NULL,
        [description] NVARCHAR(MAX),
        [billable] BIT DEFAULT 1,
        [approved_by] INT NULL,
        [approved_at] DATETIME2 NULL,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]),
        FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]),
        FOREIGN KEY ([task_id]) REFERENCES [dbo].[tasks]([id]),
        FOREIGN KEY ([approved_by]) REFERENCES [dbo].[users]([id])
    );
END
GO

-- Assets Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[assets]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[assets] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [name] NVARCHAR(255) NOT NULL,
        [type] NVARCHAR(50) NOT NULL,
        [category] NVARCHAR(100),
        [serial_number] NVARCHAR(100) UNIQUE,
        [manufacturer] NVARCHAR(100),
        [model] NVARCHAR(100),
        [purchase_date] DATE,
        [purchase_cost] DECIMAL(18,2),
        [assigned_to] INT NULL,
        [status] NVARCHAR(50) DEFAULT 'available',
        [location] NVARCHAR(255),
        [warranty_expiry] DATE NULL,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY ([assigned_to]) REFERENCES [dbo].[users]([id])
    );
END
GO

-- Inventory Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[inventory]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[inventory] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [name] NVARCHAR(255) NOT NULL,
        [category] NVARCHAR(100),
        [sku] NVARCHAR(100) NOT NULL UNIQUE,
        [unit] NVARCHAR(50) DEFAULT 'piece',
        [current_stock] INT DEFAULT 0,
        [min_stock] INT DEFAULT 0,
        [max_stock] INT,
        [unit_cost] DECIMAL(18,2),
        [supplier] NVARCHAR(255),
        [reorder_point] INT DEFAULT 0,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- Inventory Transactions Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[inventory_transactions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[inventory_transactions] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [inventory_id] INT NOT NULL,
        [transaction_type] NVARCHAR(50) NOT NULL,
        [quantity] INT NOT NULL,
        [unit_cost] DECIMAL(18,2),
        [reference_type] NVARCHAR(50),
        [reference_id] INT,
        [notes] NVARCHAR(MAX),
        [created_by] INT NOT NULL,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY ([inventory_id]) REFERENCES [dbo].[inventory]([id]),
        FOREIGN KEY ([created_by]) REFERENCES [dbo].[users]([id])
    );
END
GO

-- Leave Requests Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[leave_requests]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[leave_requests] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL,
        [leave_type] NVARCHAR(50) NOT NULL,
        [start_date] DATE NOT NULL,
        [end_date] DATE NOT NULL,
        [days] DECIMAL(5,2) NOT NULL,
        [reason] NVARCHAR(MAX),
        [status] NVARCHAR(50) DEFAULT 'pending',
        [approved_by] INT NULL,
        [approved_at] DATETIME2 NULL,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]),
        FOREIGN KEY ([approved_by]) REFERENCES [dbo].[users]([id])
    );
END
GO

-- Skills Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[skills]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[skills] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [name] NVARCHAR(100) NOT NULL,
        [category] NVARCHAR(100),
        [created_at] DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- User Skills Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[user_skills]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[user_skills] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL,
        [skill_id] INT NOT NULL,
        [proficiency_level] NVARCHAR(50),
        [years_experience] INT,
        [certified] BIT DEFAULT 0,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        [updated_at] DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE,
        FOREIGN KEY ([skill_id]) REFERENCES [dbo].[skills]([id]) ON DELETE CASCADE,
        UNIQUE([user_id], [skill_id])
    );
END
GO

-- Project Skills Required Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[project_skills_required]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[project_skills_required] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [project_id] INT NOT NULL,
        [skill_id] INT NOT NULL,
        [required_level] NVARCHAR(50),
        [created_at] DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE CASCADE,
        FOREIGN KEY ([skill_id]) REFERENCES [dbo].[skills]([id]) ON DELETE CASCADE
    );
END
GO

-- Notifications Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[notifications]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[notifications] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT NOT NULL,
        [type] NVARCHAR(50) NOT NULL,
        [title] NVARCHAR(255) NOT NULL,
        [message] NVARCHAR(MAX),
        [link] NVARCHAR(500),
        [read] BIT DEFAULT 0,
        [created_at] DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE
    );
END
GO

-- Activity Logs Table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[activity_logs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[activity_logs] (
        [id] INT IDENTITY(1,1) PRIMARY KEY,
        [user_id] INT,
        [action] NVARCHAR(100) NOT NULL,
        [resource_type] NVARCHAR(100),
        [resource_id] INT,
        [details] NVARCHAR(MAX),
        [ip_address] NVARCHAR(50),
        [created_at] DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id])
    );
END
GO

-- Create Indexes for Performance
CREATE NONCLUSTERED INDEX IX_users_email ON [dbo].[users]([email]);
CREATE NONCLUSTERED INDEX IX_users_employee_id ON [dbo].[users]([employee_id]);
CREATE NONCLUSTERED INDEX IX_projects_client_id ON [dbo].[projects]([client_id]);
CREATE NONCLUSTERED INDEX IX_projects_status ON [dbo].[projects]([status]);
CREATE NONCLUSTERED INDEX IX_tasks_project_id ON [dbo].[tasks]([project_id]);
CREATE NONCLUSTERED INDEX IX_tasks_assigned_to ON [dbo].[tasks]([assigned_to]);
CREATE NONCLUSTERED INDEX IX_tasks_status ON [dbo].[tasks]([status]);
CREATE NONCLUSTERED INDEX IX_time_entries_user_id ON [dbo].[time_entries]([user_id]);
CREATE NONCLUSTERED INDEX IX_time_entries_project_id ON [dbo].[time_entries]([project_id]);
CREATE NONCLUSTERED INDEX IX_time_entries_date ON [dbo].[time_entries]([date]);
CREATE NONCLUSTERED INDEX IX_notifications_user_id ON [dbo].[notifications]([user_id]);
CREATE NONCLUSTERED INDEX IX_notifications_read ON [dbo].[notifications]([read]);
GO

-- Insert Default Roles
IF NOT EXISTS (SELECT * FROM [dbo].[roles] WHERE [name] = 'admin')
BEGIN
    INSERT INTO [dbo].[roles] ([name], [description]) VALUES ('admin', 'System Administrator with full access');
END
IF NOT EXISTS (SELECT * FROM [dbo].[roles] WHERE [name] = 'manager')
BEGIN
    INSERT INTO [dbo].[roles] ([name], [description]) VALUES ('manager', 'Project Manager with team management access');
END
IF NOT EXISTS (SELECT * FROM [dbo].[roles] WHERE [name] = 'employee')
BEGIN
    INSERT INTO [dbo].[roles] ([name], [description]) VALUES ('employee', 'Regular Employee with standard access');
END
GO

-- Insert Default Department
IF NOT EXISTS (SELECT * FROM [dbo].[departments] WHERE [code] = 'IT')
BEGIN
    INSERT INTO [dbo].[departments] ([name], [code], [description]) VALUES ('Information Technology', 'IT', 'IT Department');
END
GO

PRINT 'Database schema created successfully!';
GO

