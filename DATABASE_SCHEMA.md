# Database Schema Documentation

## Overview

The IT ERP system uses Microsoft SQL Server with a fully normalized database schema following **3rd Normal Form (3NF)** and **ACID properties** for data integrity.

## Normalization

### 1st Normal Form (1NF)
- ✅ All tables have atomic values (no repeating groups)
- ✅ Each column contains single values
- ✅ No duplicate rows

### 2nd Normal Form (2NF)
- ✅ All tables are in 1NF
- ✅ All non-key attributes are fully dependent on the primary key
- ✅ No partial dependencies

### 3rd Normal Form (3NF)
- ✅ All tables are in 2NF
- ✅ No transitive dependencies
- ✅ All non-key attributes depend only on the primary key

## ACID Properties

### Atomicity
- ✅ All database operations use transactions
- ✅ Schema creation wrapped in transaction (all or nothing)
- ✅ Default data insertion in same transaction

### Consistency
- ✅ Foreign key constraints ensure referential integrity
- ✅ Check constraints validate data ranges and values
- ✅ Unique constraints prevent duplicates
- ✅ NOT NULL constraints ensure required data

### Isolation
- ✅ Transaction isolation levels prevent concurrent access issues
- ✅ Proper indexing for performance

### Durability
- ✅ All committed transactions are persisted
- ✅ Database uses proper logging

## Table Structure

### Core Tables (22 tables total)

1. **roles** - RBAC roles (admin, manager, employee)
2. **permissions** - System permissions
3. **role_permissions** - Many-to-many relationship
4. **departments** - Organizational departments
5. **users** - Employee accounts with authentication
6. **clients** - Client companies
7. **client_contacts** - Contact persons at clients
8. **projects** - Client projects
9. **project_phases** - Project milestones/phases
10. **project_assignments** - Employee-project assignments
11. **tasks** - Project tasks
12. **time_entries** - Time tracking entries
13. **assets** - IT assets (hardware/software)
14. **inventory** - Inventory items
15. **inventory_transactions** - Inventory movements
16. **leave_requests** - Employee leave management
17. **skills** - Employee skills/competencies
18. **user_skills** - User-skill mapping
19. **project_skills_required** - Skills needed for projects
20. **notifications** - System notifications
21. **activity_logs** - System activity audit trail

## Constraints

### Foreign Keys
- All foreign keys properly defined
- Cascade deletes where appropriate
- Referential integrity maintained

### Check Constraints
- Status values validated (e.g., project status, task status)
- Date ranges validated (end_date >= start_date)
- Numeric ranges validated (hours > 0, percentages 0-100)
- Email format validation

### Unique Constraints
- Email addresses
- Employee IDs
- Project codes
- SKUs
- Serial numbers

## Indexes

### Performance Indexes
- Primary keys (clustered indexes)
- Foreign keys (non-clustered indexes)
- Frequently queried columns (status, dates, etc.)
- Composite indexes for common queries

## Automatic Initialization

The database initializes automatically when:
1. Server starts (background initialization)
2. First API call is made (lazy initialization)
3. Health check endpoint is called
4. Login endpoint is accessed

## Default Data

On initialization, the following is created:
- **Roles**: admin, manager, employee
- **Department**: IT
- **Admin User**: 
  - Email: admin@iterp.com
  - Password: admin123
  - Employee ID: EMP001

## Data Integrity Features

1. **Transactions**: All schema creation in single transaction
2. **Constraints**: Data validation at database level
3. **Foreign Keys**: Referential integrity
4. **Indexes**: Query performance and uniqueness
5. **Audit Trail**: Activity logs for all changes
6. **Soft Deletes**: Status fields for soft deletion where needed

