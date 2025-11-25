import { getConnection } from "./connection"
import sql from "mssql"
import bcrypt from "bcryptjs"

let initialized = false
let initPromise: Promise<void> | null = null

export async function initializeDatabase() {
  if (initialized) {
    return
  }

  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    try {
      console.log("Initializing database...")
      const pool = await getConnection()

      // Use transaction for ACID compliance - all or nothing
      const tx = new sql.Transaction(pool)
      try {
        await tx.begin()
        
        // Execute schema creation statements in order
        await executeSchemaStatements(tx)

        // Insert default data
        await insertDefaultData(tx)

        // Create default admin user
        await createDefaultUser(tx)
        
        await tx.commit()
      } catch (error) {
        await tx.rollback()
        throw error
      }
      
      // Seed realistic data (outside transaction, non-critical)
      const { seedDatabase } = await import("./seed")
      await seedDatabase().catch((error) => {
        console.warn("Seeding failed (non-critical):", error.message)
      })

      initialized = true
      console.log("Database initialized successfully!")
    } catch (error) {
      console.error("Database initialization error:", error)
      initialized = false
      initPromise = null
      throw error
    }
  })()

  return initPromise
}

async function executeSchemaStatements(tx: any) {
  const statements = [
    // 1. Roles - Base table for RBAC
    `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[roles]') AND type in (N'U'))
     BEGIN
         CREATE TABLE [dbo].[roles] (
             [id] INT IDENTITY(1,1) PRIMARY KEY,
             [name] NVARCHAR(100) NOT NULL UNIQUE,
             [description] NVARCHAR(MAX),
             [created_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             [updated_at] DATETIME2 DEFAULT GETDATE() NOT NULL
         );
         CREATE INDEX IX_roles_name ON [dbo].[roles]([name]);
     END`,
    
    // 2. Permissions - System permissions
    `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[permissions]') AND type in (N'U'))
     BEGIN
         CREATE TABLE [dbo].[permissions] (
             [id] INT IDENTITY(1,1) PRIMARY KEY,
             [name] NVARCHAR(100) NOT NULL UNIQUE,
             [resource] NVARCHAR(100) NOT NULL,
             [action] NVARCHAR(50) NOT NULL,
             [created_at] DATETIME2 DEFAULT GETDATE() NOT NULL
         );
         CREATE INDEX IX_permissions_resource ON [dbo].[permissions]([resource]);
     END`,
    
    // 3. Role Permissions - Many-to-many relationship
    `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[role_permissions]') AND type in (N'U'))
     BEGIN
         CREATE TABLE [dbo].[role_permissions] (
             [id] INT IDENTITY(1,1) PRIMARY KEY,
             [role_id] INT NOT NULL,
             [permission_id] INT NOT NULL,
             FOREIGN KEY ([role_id]) REFERENCES [dbo].[roles]([id]) ON DELETE CASCADE,
             FOREIGN KEY ([permission_id]) REFERENCES [dbo].[permissions]([id]) ON DELETE CASCADE,
             CONSTRAINT UQ_role_permission UNIQUE([role_id], [permission_id])
         );
         CREATE INDEX IX_role_permissions_role_id ON [dbo].[role_permissions]([role_id]);
         CREATE INDEX IX_role_permissions_permission_id ON [dbo].[role_permissions]([permission_id]);
     END`,
    
    // 4. Departments - Organizational structure
    `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[departments]') AND type in (N'U'))
     BEGIN
         CREATE TABLE [dbo].[departments] (
             [id] INT IDENTITY(1,1) PRIMARY KEY,
             [name] NVARCHAR(100) NOT NULL,
             [code] NVARCHAR(50) NOT NULL UNIQUE,
             [head_id] INT NULL,
             [description] NVARCHAR(MAX),
             [created_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             [updated_at] DATETIME2 DEFAULT GETDATE() NOT NULL
         );
         CREATE INDEX IX_departments_code ON [dbo].[departments]([code]);
     END`,
    
    // 5. Users - Employee accounts (must be after roles and departments)
    `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
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
             [is_active] BIT DEFAULT 1 NOT NULL,
             [hire_date] DATE,
             [created_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             [updated_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             FOREIGN KEY ([department_id]) REFERENCES [dbo].[departments]([id]),
             FOREIGN KEY ([manager_id]) REFERENCES [dbo].[users]([id]),
             FOREIGN KEY ([role_id]) REFERENCES [dbo].[roles]([id]),
             CONSTRAINT CHK_email_format CHECK ([email] LIKE '%@%.%')
         );
         CREATE INDEX IX_users_email ON [dbo].[users]([email]);
         CREATE INDEX IX_users_employee_id ON [dbo].[users]([employee_id]);
         CREATE INDEX IX_users_department_id ON [dbo].[users]([department_id]);
         CREATE INDEX IX_users_role_id ON [dbo].[users]([role_id]);
     END`,
    
    // 6. Update Departments FK after users table exists
    `IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_departments_head_id')
     BEGIN
         ALTER TABLE [dbo].[departments]
         ADD CONSTRAINT FK_departments_head_id
         FOREIGN KEY ([head_id]) REFERENCES [dbo].[users]([id]);
     END`,
    
    // 7. Clients - Client companies
    `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[clients]') AND type in (N'U'))
     BEGIN
         CREATE TABLE [dbo].[clients] (
             [id] INT IDENTITY(1,1) PRIMARY KEY,
             [name] NVARCHAR(255) NOT NULL,
             [industry] NVARCHAR(100),
             [website] NVARCHAR(255),
             [phone] NVARCHAR(20),
             [email] NVARCHAR(255),
             [address] NVARCHAR(MAX),
             [status] NVARCHAR(50) DEFAULT 'active' NOT NULL,
             [account_manager_id] INT,
             [created_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             [updated_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             FOREIGN KEY ([account_manager_id]) REFERENCES [dbo].[users]([id]),
             CONSTRAINT CHK_client_status CHECK ([status] IN ('active', 'inactive', 'prospect'))
         );
         CREATE INDEX IX_clients_status ON [dbo].[clients]([status]);
         CREATE INDEX IX_clients_account_manager ON [dbo].[clients]([account_manager_id]);
     END`,
    
    // 8. Client Contacts - Contact persons at client companies
    `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[client_contacts]') AND type in (N'U'))
     BEGIN
         CREATE TABLE [dbo].[client_contacts] (
             [id] INT IDENTITY(1,1) PRIMARY KEY,
             [client_id] INT NOT NULL,
             [first_name] NVARCHAR(100) NOT NULL,
             [last_name] NVARCHAR(100) NOT NULL,
             [email] NVARCHAR(255),
             [phone] NVARCHAR(20),
             [job_title] NVARCHAR(100),
             [is_primary] BIT DEFAULT 0 NOT NULL,
             [created_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             [updated_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             FOREIGN KEY ([client_id]) REFERENCES [dbo].[clients]([id]) ON DELETE CASCADE
         );
         CREATE INDEX IX_client_contacts_client_id ON [dbo].[client_contacts]([client_id]);
     END`,
    
    // 9. Projects - Client projects
    `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[projects]') AND type in (N'U'))
     BEGIN
         CREATE TABLE [dbo].[projects] (
             [id] INT IDENTITY(1,1) PRIMARY KEY,
             [name] NVARCHAR(255) NOT NULL,
             [code] NVARCHAR(50) NOT NULL UNIQUE,
             [client_id] INT NOT NULL,
             [project_manager_id] INT NOT NULL,
             [status] NVARCHAR(50) DEFAULT 'planning' NOT NULL,
             [priority] NVARCHAR(50) DEFAULT 'medium' NOT NULL,
             [start_date] DATE,
             [end_date] DATE,
             [budget] DECIMAL(18,2),
             [actual_cost] DECIMAL(18,2) DEFAULT 0 NOT NULL,
             [description] NVARCHAR(MAX),
             [created_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             [updated_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             FOREIGN KEY ([client_id]) REFERENCES [dbo].[clients]([id]),
             FOREIGN KEY ([project_manager_id]) REFERENCES [dbo].[users]([id]),
             CONSTRAINT CHK_project_status CHECK ([status] IN ('planning', 'in_progress', 'on_hold', 'completed', 'cancelled')),
             CONSTRAINT CHK_project_priority CHECK ([priority] IN ('low', 'medium', 'high', 'urgent')),
             CONSTRAINT CHK_project_dates CHECK ([end_date] IS NULL OR [start_date] IS NULL OR [end_date] >= [start_date]),
             CONSTRAINT CHK_project_budget CHECK ([budget] IS NULL OR [budget] >= 0),
             CONSTRAINT CHK_project_cost CHECK ([actual_cost] >= 0)
         );
         CREATE INDEX IX_projects_client_id ON [dbo].[projects]([client_id]);
         CREATE INDEX IX_projects_status ON [dbo].[projects]([status]);
         CREATE INDEX IX_projects_code ON [dbo].[projects]([code]);
     END`,
    
    // 10. Project Phases - Project milestones/phases
    `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[project_phases]') AND type in (N'U'))
     BEGIN
         CREATE TABLE [dbo].[project_phases] (
             [id] INT IDENTITY(1,1) PRIMARY KEY,
             [project_id] INT NOT NULL,
             [name] NVARCHAR(255) NOT NULL,
             [description] NVARCHAR(MAX),
             [start_date] DATE,
             [end_date] DATE,
             [status] NVARCHAR(50) DEFAULT 'not_started' NOT NULL,
             [sequence] INT NOT NULL,
             [created_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             [updated_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE CASCADE,
             CONSTRAINT CHK_phase_status CHECK ([status] IN ('not_started', 'in_progress', 'completed', 'blocked')),
             CONSTRAINT CHK_phase_dates CHECK ([end_date] IS NULL OR [start_date] IS NULL OR [end_date] >= [start_date])
         );
         CREATE INDEX IX_project_phases_project_id ON [dbo].[project_phases]([project_id]);
     END`,
    
    // 11. Project Assignments - Employee-project assignments
    `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[project_assignments]') AND type in (N'U'))
     BEGIN
         CREATE TABLE [dbo].[project_assignments] (
             [id] INT IDENTITY(1,1) PRIMARY KEY,
             [project_id] INT NOT NULL,
             [user_id] INT NOT NULL,
             [role] NVARCHAR(100),
             [allocation_percentage] INT DEFAULT 100 NOT NULL,
             [start_date] DATE,
             [end_date] DATE,
             [hourly_rate] DECIMAL(18,2),
             [created_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             [updated_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE CASCADE,
             FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE,
             CONSTRAINT UQ_project_user UNIQUE([project_id], [user_id]),
             CONSTRAINT CHK_allocation_percentage CHECK ([allocation_percentage] >= 0 AND [allocation_percentage] <= 100),
             CONSTRAINT CHK_assignment_dates CHECK ([end_date] IS NULL OR [start_date] IS NULL OR [end_date] >= [start_date])
         );
         CREATE INDEX IX_project_assignments_project_id ON [dbo].[project_assignments]([project_id]);
         CREATE INDEX IX_project_assignments_user_id ON [dbo].[project_assignments]([user_id]);
     END`,
    
    // 12. Tasks - Project tasks
    `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[tasks]') AND type in (N'U'))
     BEGIN
         CREATE TABLE [dbo].[tasks] (
             [id] INT IDENTITY(1,1) PRIMARY KEY,
             [project_id] INT NOT NULL,
             [phase_id] INT NULL,
             [title] NVARCHAR(255) NOT NULL,
             [description] NVARCHAR(MAX),
             [assigned_to] INT NOT NULL,
             [created_by] INT NOT NULL,
             [status] NVARCHAR(50) DEFAULT 'todo' NOT NULL,
             [priority] NVARCHAR(50) DEFAULT 'medium' NOT NULL,
             [estimated_hours] DECIMAL(10,2),
             [actual_hours] DECIMAL(10,2) DEFAULT 0 NOT NULL,
             [due_date] DATETIME2,
             [completed_at] DATETIME2 NULL,
             [created_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             [updated_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE CASCADE,
             FOREIGN KEY ([phase_id]) REFERENCES [dbo].[project_phases]([id]),
             FOREIGN KEY ([assigned_to]) REFERENCES [dbo].[users]([id]),
             FOREIGN KEY ([created_by]) REFERENCES [dbo].[users]([id]),
             CONSTRAINT CHK_task_status CHECK ([status] IN ('todo', 'in_progress', 'review', 'done', 'blocked')),
             CONSTRAINT CHK_task_priority CHECK ([priority] IN ('low', 'medium', 'high', 'urgent')),
             CONSTRAINT CHK_task_hours CHECK ([estimated_hours] IS NULL OR [estimated_hours] >= 0),
             CONSTRAINT CHK_task_actual_hours CHECK ([actual_hours] >= 0)
         );
         CREATE INDEX IX_tasks_project_id ON [dbo].[tasks]([project_id]);
         CREATE INDEX IX_tasks_assigned_to ON [dbo].[tasks]([assigned_to]);
         CREATE INDEX IX_tasks_status ON [dbo].[tasks]([status]);
         CREATE INDEX IX_tasks_due_date ON [dbo].[tasks]([due_date]) WHERE [due_date] IS NOT NULL;
     END`,
    
    // 13. Time Entries - Time tracking
    `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[time_entries]') AND type in (N'U'))
     BEGIN
         CREATE TABLE [dbo].[time_entries] (
             [id] INT IDENTITY(1,1) PRIMARY KEY,
             [user_id] INT NOT NULL,
             [project_id] INT NOT NULL,
             [task_id] INT NULL,
             [date] DATE NOT NULL,
             [hours] DECIMAL(10,2) NOT NULL,
             [description] NVARCHAR(MAX),
             [billable] BIT DEFAULT 1 NOT NULL,
             [approved_by] INT NULL,
             [approved_at] DATETIME2 NULL,
             [created_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             [updated_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]),
             FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]),
             FOREIGN KEY ([task_id]) REFERENCES [dbo].[tasks]([id]),
             FOREIGN KEY ([approved_by]) REFERENCES [dbo].[users]([id]),
             CONSTRAINT CHK_time_hours CHECK ([hours] > 0 AND [hours] <= 24)
         );
         CREATE INDEX IX_time_entries_user_id ON [dbo].[time_entries]([user_id]);
         CREATE INDEX IX_time_entries_project_id ON [dbo].[time_entries]([project_id]);
         CREATE INDEX IX_time_entries_date ON [dbo].[time_entries]([date]);
         CREATE INDEX IX_time_entries_task_id ON [dbo].[time_entries]([task_id]) WHERE [task_id] IS NOT NULL;
     END`,
    
    // 14. Assets - IT assets
    `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[assets]') AND type in (N'U'))
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
             [status] NVARCHAR(50) DEFAULT 'available' NOT NULL,
             [location] NVARCHAR(255),
             [warranty_expiry] DATE NULL,
             [created_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             [updated_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             FOREIGN KEY ([assigned_to]) REFERENCES [dbo].[users]([id]),
             CONSTRAINT CHK_asset_status CHECK ([status] IN ('available', 'assigned', 'maintenance', 'retired')),
             CONSTRAINT CHK_asset_cost CHECK ([purchase_cost] IS NULL OR [purchase_cost] >= 0)
         );
         CREATE INDEX IX_assets_type ON [dbo].[assets]([type]);
         CREATE INDEX IX_assets_status ON [dbo].[assets]([status]);
         CREATE INDEX IX_assets_assigned_to ON [dbo].[assets]([assigned_to]) WHERE [assigned_to] IS NOT NULL;
     END`,
    
    // 15. Inventory - Inventory items
    `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[inventory]') AND type in (N'U'))
     BEGIN
         CREATE TABLE [dbo].[inventory] (
             [id] INT IDENTITY(1,1) PRIMARY KEY,
             [name] NVARCHAR(255) NOT NULL,
             [category] NVARCHAR(100),
             [sku] NVARCHAR(100) NOT NULL UNIQUE,
             [unit] NVARCHAR(50) DEFAULT 'piece' NOT NULL,
             [current_stock] INT DEFAULT 0 NOT NULL,
             [min_stock] INT DEFAULT 0 NOT NULL,
             [max_stock] INT,
             [unit_cost] DECIMAL(18,2),
             [supplier] NVARCHAR(255),
             [reorder_point] INT DEFAULT 0 NOT NULL,
             [created_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             [updated_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             CONSTRAINT CHK_inventory_stock CHECK ([current_stock] >= 0),
             CONSTRAINT CHK_inventory_min_stock CHECK ([min_stock] >= 0),
             CONSTRAINT CHK_inventory_max_stock CHECK ([max_stock] IS NULL OR [max_stock] >= [min_stock]),
             CONSTRAINT CHK_inventory_cost CHECK ([unit_cost] IS NULL OR [unit_cost] >= 0)
         );
         CREATE INDEX IX_inventory_sku ON [dbo].[inventory]([sku]);
         CREATE INDEX IX_inventory_category ON [dbo].[inventory]([category]) WHERE [category] IS NOT NULL;
     END`,
    
    // 16. Inventory Transactions - Inventory movements
    `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[inventory_transactions]') AND type in (N'U'))
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
             [created_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             FOREIGN KEY ([inventory_id]) REFERENCES [dbo].[inventory]([id]),
             FOREIGN KEY ([created_by]) REFERENCES [dbo].[users]([id]),
             CONSTRAINT CHK_transaction_type CHECK ([transaction_type] IN ('in', 'out', 'adjustment', 'transfer')),
             CONSTRAINT CHK_transaction_quantity CHECK ([quantity] != 0)
         );
         CREATE INDEX IX_inventory_transactions_inventory_id ON [dbo].[inventory_transactions]([inventory_id]);
         CREATE INDEX IX_inventory_transactions_date ON [dbo].[inventory_transactions]([created_at]);
     END`,
    
    // 17. Leave Requests - Employee leave management
    `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[leave_requests]') AND type in (N'U'))
     BEGIN
         CREATE TABLE [dbo].[leave_requests] (
             [id] INT IDENTITY(1,1) PRIMARY KEY,
             [user_id] INT NOT NULL,
             [leave_type] NVARCHAR(50) NOT NULL,
             [start_date] DATE NOT NULL,
             [end_date] DATE NOT NULL,
             [days] DECIMAL(5,2) NOT NULL,
             [reason] NVARCHAR(MAX),
             [status] NVARCHAR(50) DEFAULT 'pending' NOT NULL,
             [approved_by] INT NULL,
             [approved_at] DATETIME2 NULL,
             [created_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             [updated_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]),
             FOREIGN KEY ([approved_by]) REFERENCES [dbo].[users]([id]),
             CONSTRAINT CHK_leave_dates CHECK ([end_date] >= [start_date]),
             CONSTRAINT CHK_leave_days CHECK ([days] > 0),
             CONSTRAINT CHK_leave_status CHECK ([status] IN ('pending', 'approved', 'rejected', 'cancelled'))
         );
         CREATE INDEX IX_leave_requests_user_id ON [dbo].[leave_requests]([user_id]);
         CREATE INDEX IX_leave_requests_status ON [dbo].[leave_requests]([status]);
         CREATE INDEX IX_leave_requests_dates ON [dbo].[leave_requests]([start_date], [end_date]);
     END`,
    
    // 18. Skills - Employee skills/competencies
    `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[skills]') AND type in (N'U'))
     BEGIN
         CREATE TABLE [dbo].[skills] (
             [id] INT IDENTITY(1,1) PRIMARY KEY,
             [name] NVARCHAR(100) NOT NULL,
             [category] NVARCHAR(100),
             [created_at] DATETIME2 DEFAULT GETDATE() NOT NULL
         );
         CREATE INDEX IX_skills_category ON [dbo].[skills]([category]) WHERE [category] IS NOT NULL;
     END`,
    
    // 19. User Skills - User-skill mapping
    `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[user_skills]') AND type in (N'U'))
     BEGIN
         CREATE TABLE [dbo].[user_skills] (
             [id] INT IDENTITY(1,1) PRIMARY KEY,
             [user_id] INT NOT NULL,
             [skill_id] INT NOT NULL,
             [proficiency_level] NVARCHAR(50),
             [years_experience] INT,
             [certified] BIT DEFAULT 0 NOT NULL,
             [created_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             [updated_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE,
             FOREIGN KEY ([skill_id]) REFERENCES [dbo].[skills]([id]) ON DELETE CASCADE,
             CONSTRAINT UQ_user_skill UNIQUE([user_id], [skill_id]),
             CONSTRAINT CHK_proficiency_level CHECK ([proficiency_level] IN ('beginner', 'intermediate', 'advanced', 'expert')),
             CONSTRAINT CHK_years_experience CHECK ([years_experience] IS NULL OR [years_experience] >= 0)
         );
         CREATE INDEX IX_user_skills_user_id ON [dbo].[user_skills]([user_id]);
         CREATE INDEX IX_user_skills_skill_id ON [dbo].[user_skills]([skill_id]);
     END`,
    
    // 20. Project Skills Required - Skills needed for projects
    `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[project_skills_required]') AND type in (N'U'))
     BEGIN
         CREATE TABLE [dbo].[project_skills_required] (
             [id] INT IDENTITY(1,1) PRIMARY KEY,
             [project_id] INT NOT NULL,
             [skill_id] INT NOT NULL,
             [required_level] NVARCHAR(50),
             [created_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             FOREIGN KEY ([project_id]) REFERENCES [dbo].[projects]([id]) ON DELETE CASCADE,
             FOREIGN KEY ([skill_id]) REFERENCES [dbo].[skills]([id]) ON DELETE CASCADE
         );
         CREATE INDEX IX_project_skills_project_id ON [dbo].[project_skills_required]([project_id]);
     END`,
    
    // 21. Notifications - System notifications
    `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[notifications]') AND type in (N'U'))
     BEGIN
         CREATE TABLE [dbo].[notifications] (
             [id] INT IDENTITY(1,1) PRIMARY KEY,
             [user_id] INT NOT NULL,
             [type] NVARCHAR(50) NOT NULL,
             [title] NVARCHAR(255) NOT NULL,
             [message] NVARCHAR(MAX),
             [link] NVARCHAR(500),
             [read] BIT DEFAULT 0 NOT NULL,
             [created_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE
         );
         CREATE INDEX IX_notifications_user_id ON [dbo].[notifications]([user_id]);
         CREATE INDEX IX_notifications_read ON [dbo].[notifications]([read]);
         CREATE INDEX IX_notifications_created_at ON [dbo].[notifications]([created_at]);
     END`,
    
    // 22. Activity Logs - System activity audit trail
    `IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[activity_logs]') AND type in (N'U'))
     BEGIN
         CREATE TABLE [dbo].[activity_logs] (
             [id] INT IDENTITY(1,1) PRIMARY KEY,
             [user_id] INT,
             [action] NVARCHAR(100) NOT NULL,
             [resource_type] NVARCHAR(100),
             [resource_id] INT,
             [details] NVARCHAR(MAX),
             [ip_address] NVARCHAR(50),
             [created_at] DATETIME2 DEFAULT GETDATE() NOT NULL,
             FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id])
         );
         CREATE INDEX IX_activity_logs_user_id ON [dbo].[activity_logs]([user_id]) WHERE [user_id] IS NOT NULL;
         CREATE INDEX IX_activity_logs_resource ON [dbo].[activity_logs]([resource_type], [resource_id]) WHERE [resource_type] IS NOT NULL;
         CREATE INDEX IX_activity_logs_created_at ON [dbo].[activity_logs]([created_at]);
     END`,
  ]

  for (const statement of statements) {
    try {
      const request = tx.request()
      await request.query(statement)
    } catch (error: any) {
      // Ignore errors for existing objects, but log others
      if (!error.message?.includes("already exists") && 
          !error.message?.includes("There is already") &&
          !error.message?.includes("duplicate") &&
          !error.message?.includes("UNIQUE")) {
        console.warn("Schema execution warning:", error.message?.substring(0, 200))
        throw error // Re-throw to rollback transaction
      }
    }
  }
}

async function insertDefaultData(tx: any) {
  // Insert default roles
  const roleStatements = [
    `IF NOT EXISTS (SELECT * FROM [dbo].[roles] WHERE [name] = 'admin')
     BEGIN
         INSERT INTO [dbo].[roles] ([name], [description]) VALUES ('admin', 'System Administrator with full access');
     END`,
    `IF NOT EXISTS (SELECT * FROM [dbo].[roles] WHERE [name] = 'manager')
     BEGIN
         INSERT INTO [dbo].[roles] ([name], [description]) VALUES ('manager', 'Project Manager with team management access');
     END`,
    `IF NOT EXISTS (SELECT * FROM [dbo].[roles] WHERE [name] = 'employee')
     BEGIN
         INSERT INTO [dbo].[roles] ([name], [description]) VALUES ('employee', 'Regular Employee with standard access');
     END`,
  ]

  for (const statement of roleStatements) {
    try {
      await tx.request().query(statement)
    } catch (error: any) {
      if (!error.message?.includes("already exists")) {
        throw error
      }
    }
  }

  // Insert default department
  try {
    await tx.request().query(`
      IF NOT EXISTS (SELECT * FROM [dbo].[departments] WHERE [code] = 'IT')
      BEGIN
          INSERT INTO [dbo].[departments] ([name], [code], [description]) VALUES ('Information Technology', 'IT', 'IT Department');
      END
    `)
  } catch (error: any) {
    if (!error.message?.includes("already exists")) {
      throw error
    }
  }
}

async function createDefaultUser(tx: any) {
  try {
    // Check if admin user exists
    const checkResult = await tx.request().query(`
      SELECT id FROM users WHERE email = 'admin@iterp.com'
    `)

    if (checkResult.recordset.length > 0) {
      console.log("Default admin user already exists")
      return
    }

    // Get admin role
    const adminRoleResult = await tx.request().query(`
      SELECT id FROM roles WHERE name = 'admin'
    `)

    if (adminRoleResult.recordset.length === 0) {
      console.warn("Admin role not found, skipping default user creation")
      return
    }

    // Get IT department
    const deptResult = await tx.request().query(`
      SELECT id FROM departments WHERE code = 'IT'
    `)

    let departmentId = null
    if (deptResult.recordset.length > 0) {
      departmentId = deptResult.recordset[0].id
    }

    // Create default admin user
    const passwordHash = await bcrypt.hash("admin123", 10)
    const request = tx.request()

    request.input("email", "admin@iterp.com")
    request.input("password_hash", passwordHash)
    request.input("first_name", "Admin")
    request.input("last_name", "User")
    request.input("employee_id", "EMP001")
    request.input("department_id", departmentId)
    request.input("role_id", adminRoleResult.recordset[0].id)
    request.input("is_active", true)

    await request.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, employee_id, 
                         department_id, role_id, is_active, hire_date, created_at, updated_at)
      VALUES (@email, @password_hash, @first_name, @last_name, @employee_id, 
              @department_id, @role_id, @is_active, GETDATE(), GETDATE(), GETDATE())
    `)

    console.log("Default admin user created:")
    console.log("  Email: admin@iterp.com")
    console.log("  Password: admin123")
    console.log("  Employee ID: EMP001")
  } catch (error: any) {
    // Ignore if user already exists
    if (!error.message?.includes("duplicate") && !error.message?.includes("UNIQUE")) {
      throw error
    }
  }
}
