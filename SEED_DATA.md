# Seed Data Documentation

## Overview

The database automatically seeds realistic data after initialization if no data exists (except the default admin user). This ensures a professional demo-ready state with Indian names and realistic business scenarios.

## Data Summary

### Users (7 total)
- **Admins (2)**:
  - admin@iterp.com (default)
  - rajesh.kumar@iterp.com
  
- **Managers (3)**:
  - priya.sharma@iterp.com
  - amit.patel@iterp.com
  - neha.verma@iterp.com

- **Employees (3)**:
  - ananya.singh@iterp.com (reports to Priya)
  - vikram.reddy@iterp.com (reports to Amit)
  - kavya.nair@iterp.com (reports to Neha)

**Default Password**: `password123` (for all seeded users)

### Clients (6 companies)
1. TechCorp Solutions Pvt Ltd - Technology (Noida)
2. Global Finance Services - Finance (Mumbai)
3. RetailMax India - Retail (Bangalore)
4. Healthcare Innovations - Healthcare (Chennai)
5. EduTech Platforms - Education (Kolkata)
6. Manufacturing Hub - Manufacturing (Ahmedabad)

### Projects (12 projects)
1. E-Commerce Platform Development - RetailMax India (In Progress)
2. Mobile Banking App - Global Finance Services (In Progress)
3. Hospital Management System - Healthcare Innovations (Planning)
4. Learning Management Platform - EduTech Platforms (In Progress)
5. ERP Integration Project - Manufacturing Hub (In Progress)
6. Cloud Migration Initiative - TechCorp Solutions (In Progress)
7. Customer Portal Redesign - RetailMax India (On Hold)
8. API Gateway Development - TechCorp Solutions (In Progress)
9. Data Analytics Dashboard - Global Finance Services (Planning)
10. Inventory Management System - Manufacturing Hub (In Progress)
11. Telemedicine Platform - Healthcare Innovations (Completed)
12. Student Information System - EduTech Platforms (In Progress)

### Tasks
- 3-5 tasks per project
- Various statuses: todo, in_progress, review, done
- Realistic task titles (Database Schema Design, API Development, etc.)
- Assigned to different team members

### Time Entries
- Time entries for last 30 days
- 2-4 entries per day
- Mix of billable and non-billable hours
- Linked to projects and tasks

### Assets (7 items)
- 3 Laptops (MacBook Pro, Dell XPS, HP EliteBook)
- 2 Software licenses (Office 365, Adobe Creative Suite)
- 2 Peripherals (Monitor, Keyboard)

### Inventory (5 items)
- USB-C Cables, HDMI Cables
- Wireless Mouse, Webcam HD
- Laptop Stand

### Skills (12 skills)
- Frontend: React, Next.js
- Backend: Node.js, Python, Java
- Database: SQL Server, MongoDB
- DevOps: Docker, AWS, Azure
- Design: UI/UX Design

### Project Assignments
- 2-4 team members per project
- Various roles: Developer, Senior Developer, Tech Lead, QA Engineer, DevOps Engineer
- Allocation percentages: 60-100%
- Hourly rates: ₹1,500 - ₹3,500

## How It Works

1. Database initializes with schema
2. Default admin user is created
3. Seed function checks if data exists
4. If only admin exists, seeds all data
5. If data exists, skips seeding

## Resetting Seed Data

To reset and re-seed:
1. Clear database tables (or drop and recreate database)
2. Restart the application
3. Seed will run automatically

## Demo Credentials

All seeded users can login with:
- **Email**: [user email from list above]
- **Password**: `password123`

Example:
- Email: `priya.sharma@iterp.com`
- Password: `password123`

