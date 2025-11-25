import { getConnection } from "./connection"
import sql from "mssql"
import bcrypt from "bcryptjs"

let seeded = false

export async function seedDatabase() {
  if (seeded) {
    return
  }

  try {
    const pool = await getConnection()
    
    // Check if data already exists
    const userCount = await pool.request().query(`
      SELECT COUNT(*) as count FROM users
    `)

    const count = userCount.recordset[0]?.count || 0
    if (count > 1) {
      // More than just the default admin user exists
      console.log(`Database already has ${count} users, skipping seed`)
      seeded = true
      return
    }

    console.log("Seeding database with realistic data...")
    
    const tx = new sql.Transaction(pool)
    await tx.begin()

    try {
      // Seed data in order
      await seedUsers(tx)
      const clientIds = await seedClients(tx)
      await seedClientContacts(tx, clientIds)
      await seedProjects(tx)
      await seedProjectPhases(tx)
      await seedTasks(tx)
      await seedTimeEntries(tx)
      await seedAssets(tx)
      await seedInventory(tx)
      await seedSkills(tx)
      await seedUserSkills(tx)
      await seedProjectAssignments(tx)

      await tx.commit()
      seeded = true
      console.log("Database seeded successfully with realistic data!")
    } catch (error) {
      await tx.rollback()
      throw error
    }
  } catch (error) {
    console.error("Database seeding error:", error)
    throw error
  }
}

async function seedUsers(tx: any) {
  const users = [
    {
      email: "rajesh.kumar@iterp.com",
      password: "password123",
      firstName: "Rajesh",
      lastName: "Kumar",
      employeeId: "EMP002",
      phone: "+91-9876543210",
      role: "admin",
    },
    {
      email: "priya.sharma@iterp.com",
      password: "password123",
      firstName: "Priya",
      lastName: "Sharma",
      employeeId: "EMP003",
      phone: "+91-9876543211",
      role: "manager",
    },
    {
      email: "amit.patel@iterp.com",
      password: "password123",
      firstName: "Amit",
      lastName: "Patel",
      employeeId: "EMP004",
      phone: "+91-9876543212",
      role: "manager",
    },
    {
      email: "neha.verma@iterp.com",
      password: "password123",
      firstName: "Neha",
      lastName: "Verma",
      employeeId: "EMP008",
      phone: "+91-9876543216",
      role: "manager",
    },
    {
      email: "ananya.singh@iterp.com",
      password: "password123",
      firstName: "Ananya",
      lastName: "Singh",
      employeeId: "EMP005",
      phone: "+91-9876543213",
      role: "employee",
    },
    {
      email: "vikram.reddy@iterp.com",
      password: "password123",
      firstName: "Vikram",
      lastName: "Reddy",
      employeeId: "EMP006",
      phone: "+91-9876543214",
      role: "employee",
    },
    {
      email: "kavya.nair@iterp.com",
      password: "password123",
      firstName: "Kavya",
      lastName: "Nair",
      employeeId: "EMP007",
      phone: "+91-9876543215",
      role: "employee",
    },
  ]

  // Get roles and department
  const rolesResult = await tx.request().query(`
    SELECT id, name FROM roles
  `)
  const roles = rolesResult.recordset.reduce((acc: any, r: any) => {
    acc[r.name] = r.id
    return acc
  }, {})

  const deptResult = await tx.request().query(`
    SELECT id FROM departments WHERE code = 'IT'
  `)
  const departmentId = deptResult.recordset[0]?.id

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10)
    const request = tx.request()

    request.input("email", user.email)
    request.input("password_hash", passwordHash)
    request.input("first_name", user.firstName)
    request.input("last_name", user.lastName)
    request.input("employee_id", user.employeeId)
    request.input("phone", user.phone)
    request.input("department_id", departmentId)
    request.input("role_id", roles[user.role])
    request.input("is_active", true)

    await request.query(`
      IF NOT EXISTS (SELECT * FROM users WHERE email = @email)
      BEGIN
        INSERT INTO users (email, password_hash, first_name, last_name, employee_id, 
                          phone, department_id, role_id, is_active, hire_date, created_at, updated_at)
        VALUES (@email, @password_hash, @first_name, @last_name, @employee_id, 
                @phone, @department_id, @role_id, @is_active, DATEADD(day, -RAND() * 365, GETDATE()), GETDATE(), GETDATE());
      END
    `)
  }

  // Set manager relationships
  await tx.request().query(`
    UPDATE users SET manager_id = (SELECT id FROM users WHERE email = 'priya.sharma@iterp.com')
    WHERE email = 'ananya.singh@iterp.com'
  `)

  await tx.request().query(`
    UPDATE users SET manager_id = (SELECT id FROM users WHERE email = 'amit.patel@iterp.com')
    WHERE email = 'vikram.reddy@iterp.com'
  `)

  await tx.request().query(`
    UPDATE users SET manager_id = (SELECT id FROM users WHERE email = 'neha.verma@iterp.com')
    WHERE email = 'kavya.nair@iterp.com'
  `)
}

async function seedClients(tx: any): Promise<number[]> {
  const clientIds: number[] = []
  const clients = [
    {
      name: "TechCorp Solutions Pvt Ltd",
      industry: "Technology",
      website: "https://techcorp.in",
      phone: "+91-11-23456789",
      email: "contact@techcorp.in",
      address: "Sector 18, Noida, Uttar Pradesh 201301",
      status: "active",
      accountManager: "priya.sharma@iterp.com",
    },
    {
      name: "Global Finance Services",
      industry: "Finance",
      website: "https://globalfinance.com",
      phone: "+91-22-34567890",
      email: "info@globalfinance.com",
      address: "Bandra Kurla Complex, Mumbai, Maharashtra 400051",
      status: "active",
      accountManager: "amit.patel@iterp.com",
    },
    {
      name: "RetailMax India",
      industry: "Retail",
      website: "https://retailmax.in",
      phone: "+91-80-45678901",
      email: "support@retailmax.in",
      address: "MG Road, Bangalore, Karnataka 560001",
      status: "active",
      accountManager: "priya.sharma@iterp.com",
    },
    {
      name: "Healthcare Innovations",
      industry: "Healthcare",
      website: "https://healthcareinnov.com",
      phone: "+91-44-56789012",
      email: "hello@healthcareinnov.com",
      address: "Anna Salai, Chennai, Tamil Nadu 600002",
      status: "active",
      accountManager: "amit.patel@iterp.com",
    },
    {
      name: "EduTech Platforms",
      industry: "Education",
      website: "https://edutech.in",
      phone: "+91-33-67890123",
      email: "contact@edutech.in",
      address: "Park Street, Kolkata, West Bengal 700016",
      status: "active",
      accountManager: "priya.sharma@iterp.com",
    },
    {
      name: "Manufacturing Hub",
      industry: "Manufacturing",
      website: "https://manufacturinghub.com",
      phone: "+91-79-78901234",
      email: "info@manufacturinghub.com",
      address: "SG Highway, Ahmedabad, Gujarat 380015",
      status: "active",
      accountManager: "amit.patel@iterp.com",
    },
  ]

  for (const client of clients) {
    const managerResult = await tx.request().query(`
      SELECT id FROM users WHERE email = '${client.accountManager}'
    `)
    const managerId = managerResult.recordset[0]?.id

    const request = tx.request()
    request.input("name", client.name)
    request.input("industry", client.industry)
    request.input("website", client.website)
    request.input("phone", client.phone)
    request.input("email", client.email)
    request.input("address", client.address)
    request.input("status", client.status)
    request.input("account_manager_id", managerId)

    const result = await request.query(`
      IF NOT EXISTS (SELECT * FROM clients WHERE name = @name)
      BEGIN
        INSERT INTO clients (name, industry, website, phone, email, address, status, 
                            account_manager_id, created_at, updated_at)
        OUTPUT INSERTED.id
        VALUES (@name, @industry, @website, @phone, @email, @address, @status, 
                @account_manager_id, DATEADD(day, -RAND() * 180, GETDATE()), GETDATE());
      END
      ELSE
      BEGIN
        SELECT id FROM clients WHERE name = @name
      END
    `)
    
    if (result.recordset.length > 0) {
      clientIds.push(result.recordset[0].id)
    }
  }

  return clientIds
}

async function seedClientContacts(tx: any, clientIds: number[]) {
  const contactNames = [
    { first: "Rahul", last: "Gupta", title: "CTO" },
    { first: "Sneha", last: "Mehta", title: "Project Manager" },
    { first: "Arjun", last: "Joshi", title: "Technical Lead" },
    { first: "Meera", last: "Desai", title: "Product Owner" },
    { first: "Karan", last: "Malhotra", title: "Director of Engineering" },
  ]

  for (let i = 0; i < clientIds.length; i++) {
    const clientId = clientIds[i]
    const contact = contactNames[i % contactNames.length]
    const isPrimary = i < 3 // First 3 are primary

    const request = tx.request()
    request.input("client_id", clientId)
    request.input("first_name", contact.first)
    request.input("last_name", contact.last)
    request.input("email", `${contact.first.toLowerCase()}.${contact.last.toLowerCase()}@client${i + 1}.com`)
    // Generate realistic Indian phone number
    const areaCodes = ["11", "22", "33", "44", "80", "79"]
    const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)]
    const number = Math.floor(Math.random() * 90000000) + 10000000
    request.input("phone", `+91-${areaCode}-${number}`)
    request.input("job_title", contact.title)
    request.input("is_primary", isPrimary)

    await request.query(`
      INSERT INTO client_contacts (client_id, first_name, last_name, email, phone, 
                                   job_title, is_primary, created_at, updated_at)
      VALUES (@client_id, @first_name, @last_name, @email, @phone, 
              @job_title, @is_primary, GETDATE(), GETDATE());
    `)
  }
}

async function seedProjects(tx: any) {
  const projects = [
    {
      name: "E-Commerce Platform Development",
      code: "PROJ-2024-001",
      client: "RetailMax India",
      manager: "priya.sharma@iterp.com",
      status: "in_progress",
      priority: "high",
      startDate: "2024-01-15",
      endDate: "2024-06-30",
      budget: 2500000,
    },
    {
      name: "Mobile Banking App",
      code: "PROJ-2024-002",
      client: "Global Finance Services",
      manager: "amit.patel@iterp.com",
      status: "in_progress",
      priority: "urgent",
      startDate: "2024-02-01",
      endDate: "2024-07-15",
      budget: 3200000,
    },
    {
      name: "Hospital Management System",
      code: "PROJ-2024-003",
      client: "Healthcare Innovations",
      manager: "amit.patel@iterp.com",
      status: "planning",
      priority: "high",
      startDate: "2024-03-01",
      endDate: "2024-09-30",
      budget: 1800000,
    },
    {
      name: "Learning Management Platform",
      code: "PROJ-2024-004",
      client: "EduTech Platforms",
      manager: "priya.sharma@iterp.com",
      status: "in_progress",
      priority: "medium",
      startDate: "2024-01-20",
      endDate: "2024-05-31",
      budget: 1500000,
    },
    {
      name: "ERP Integration Project",
      code: "PROJ-2024-005",
      client: "Manufacturing Hub",
      manager: "amit.patel@iterp.com",
      status: "in_progress",
      priority: "high",
      startDate: "2024-02-10",
      endDate: "2024-08-31",
      budget: 2800000,
    },
    {
      name: "Cloud Migration Initiative",
      code: "PROJ-2024-006",
      client: "TechCorp Solutions Pvt Ltd",
      manager: "priya.sharma@iterp.com",
      status: "in_progress",
      priority: "medium",
      startDate: "2024-01-05",
      endDate: "2024-06-15",
      budget: 2200000,
    },
    {
      name: "Customer Portal Redesign",
      code: "PROJ-2024-007",
      client: "RetailMax India",
      manager: "priya.sharma@iterp.com",
      status: "on_hold",
      priority: "low",
      startDate: "2024-03-15",
      endDate: "2024-07-30",
      budget: 800000,
    },
    {
      name: "API Gateway Development",
      code: "PROJ-2024-008",
      client: "TechCorp Solutions Pvt Ltd",
      manager: "amit.patel@iterp.com",
      status: "in_progress",
      priority: "high",
      startDate: "2024-02-20",
      endDate: "2024-05-31",
      budget: 1200000,
    },
    {
      name: "Data Analytics Dashboard",
      code: "PROJ-2024-009",
      client: "Global Finance Services",
      manager: "priya.sharma@iterp.com",
      status: "planning",
      priority: "medium",
      startDate: "2024-04-01",
      endDate: "2024-08-31",
      budget: 1900000,
    },
    {
      name: "Inventory Management System",
      code: "PROJ-2024-010",
      client: "Manufacturing Hub",
      manager: "amit.patel@iterp.com",
      status: "in_progress",
      priority: "high",
      startDate: "2024-01-10",
      endDate: "2024-05-20",
      budget: 1600000,
    },
    {
      name: "Telemedicine Platform",
      code: "PROJ-2024-011",
      client: "Healthcare Innovations",
      manager: "priya.sharma@iterp.com",
      status: "completed",
      priority: "medium",
      startDate: "2023-09-01",
      endDate: "2024-01-31",
      budget: 2100000,
      actualCost: 1950000,
    },
    {
      name: "Student Information System",
      code: "PROJ-2024-012",
      client: "EduTech Platforms",
      manager: "amit.patel@iterp.com",
      status: "in_progress",
      priority: "medium",
      startDate: "2024-02-15",
      endDate: "2024-07-31",
      budget: 1400000,
    },
  ]

  for (const project of projects) {
    const clientResult = await tx.request().query(`
      SELECT id FROM clients WHERE name = '${project.client}'
    `)
    const clientId = clientResult.recordset[0]?.id

    const managerResult = await tx.request().query(`
      SELECT id FROM users WHERE email = '${project.manager}'
    `)
    const managerId = managerResult.recordset[0]?.id

    if (!clientId || !managerId) continue

    const request = tx.request()
    request.input("name", project.name)
    request.input("code", project.code)
    request.input("client_id", clientId)
    request.input("project_manager_id", managerId)
    request.input("status", project.status)
    request.input("priority", project.priority)
    request.input("start_date", project.startDate)
    request.input("end_date", project.endDate)
    request.input("budget", project.budget)
    request.input("actual_cost", project.actualCost || 0)

    await request.query(`
      IF NOT EXISTS (SELECT * FROM projects WHERE code = @code)
      BEGIN
        INSERT INTO projects (name, code, client_id, project_manager_id, status, priority, 
                             start_date, end_date, budget, actual_cost, created_at, updated_at)
        VALUES (@name, @code, @client_id, @project_manager_id, @status, @priority, 
                @start_date, @end_date, @budget, @actual_cost, GETDATE(), GETDATE());
      END
    `)
  }
}

async function seedTasks(tx: any) {
  // Get projects and users
  const projectsResult = await tx.request().query(`
    SELECT id, name, code FROM projects ORDER BY created_at
  `)
  const projects = projectsResult.recordset

  const usersResult = await tx.request().query(`
    SELECT id, email, first_name, last_name FROM users WHERE is_active = 1
  `)
  const users = usersResult.recordset

  const taskTemplates = [
    { title: "Database Schema Design", status: "done", priority: "high", hours: 16 },
    { title: "API Endpoint Development", status: "in_progress", priority: "high", hours: 24 },
    { title: "Frontend Component Development", status: "in_progress", priority: "medium", hours: 20 },
    { title: "Unit Testing", status: "todo", priority: "medium", hours: 12 },
    { title: "Integration Testing", status: "todo", priority: "high", hours: 16 },
    { title: "Code Review", status: "review", priority: "medium", hours: 8 },
    { title: "Documentation", status: "todo", priority: "low", hours: 10 },
    { title: "Performance Optimization", status: "todo", priority: "medium", hours: 14 },
    { title: "Security Audit", status: "todo", priority: "high", hours: 12 },
    { title: "Deployment Setup", status: "in_progress", priority: "high", hours: 18 },
  ]

  for (const project of projects) {
    // Assign 3-5 tasks per project
    const taskCount = Math.floor(Math.random() * 3) + 3
    const projectTasks = taskTemplates.slice(0, taskCount)

    for (let i = 0; i < projectTasks.length; i++) {
      const template = projectTasks[i]
      const assignedUser = users[Math.floor(Math.random() * (users.length - 1)) + 1] // Skip admin
      const createdBy = users[Math.floor(Math.random() * users.length)]

      const request = tx.request()
      request.input("project_id", project.id)
      request.input("title", template.title)
      request.input("description", `Task for ${project.name}: ${template.title}`)
      request.input("assigned_to", assignedUser.id)
      request.input("created_by", createdBy.id)
      request.input("status", template.status)
      request.input("priority", template.priority)
      request.input("estimated_hours", template.hours)
      request.input("due_date", new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000))

      await request.query(`
        INSERT INTO tasks (project_id, title, description, assigned_to, created_by, status, 
                          priority, estimated_hours, actual_hours, due_date, created_at, updated_at)
        VALUES (@project_id, @title, @description, @assigned_to, @created_by, @status, 
                @priority, @estimated_hours, CASE WHEN @status = 'done' THEN @estimated_hours ELSE 0 END, 
                @due_date, DATEADD(day, -RAND() * 30, GETDATE()), GETDATE());
      `)
    }
  }
}

async function seedProjectPhases(tx: any) {
  const projectsResult = await tx.request().query(`
    SELECT id, name, start_date, end_date FROM projects
  `)
  const projects = projectsResult.recordset

  const phaseTemplates = [
    { name: "Planning & Requirements", sequence: 1, status: "completed", duration: 0.15 },
    { name: "Design & Architecture", sequence: 2, status: "completed", duration: 0.20 },
    { name: "Development", sequence: 3, status: "in_progress", duration: 0.40 },
    { name: "Testing & QA", sequence: 4, status: "not_started", duration: 0.15 },
    { name: "Deployment & Launch", sequence: 5, status: "not_started", duration: 0.10 },
  ]

  for (const project of projects) {
    if (!project.start_date || !project.end_date) continue

    const startDate = new Date(project.start_date)
    const endDate = new Date(project.end_date)
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    let currentDate = new Date(startDate)

    for (const phase of phaseTemplates) {
      const phaseDays = Math.floor(totalDays * phase.duration)
      const phaseEndDate = new Date(currentDate)
      phaseEndDate.setDate(phaseEndDate.getDate() + phaseDays)

      // Adjust status based on project status
      let phaseStatus = phase.status
      if (project.status === "completed") {
        phaseStatus = "completed"
      } else if (project.status === "planning") {
        if (phase.sequence <= 2) phaseStatus = "in_progress"
        else phaseStatus = "not_started"
      }

      const request = tx.request()
      request.input("project_id", project.id)
      request.input("name", phase.name)
      request.input("description", `${phase.name} phase for ${project.name}`)
      request.input("start_date", currentDate.toISOString().split("T")[0])
      request.input("end_date", phaseEndDate.toISOString().split("T")[0])
      request.input("status", phaseStatus)
      request.input("sequence", phase.sequence)

      await request.query(`
        INSERT INTO project_phases (project_id, name, description, start_date, end_date, 
                                    status, sequence, created_at, updated_at)
        VALUES (@project_id, @name, @description, @start_date, @end_date, 
                @status, @sequence, GETDATE(), GETDATE());
      `)

      currentDate = new Date(phaseEndDate)
      currentDate.setDate(currentDate.getDate() + 1) // Start next phase day after
    }
  }
}

async function seedTimeEntries(tx: any) {
  // Get all active users
  const usersResult = await tx.request().query(`
    SELECT id, email FROM users WHERE is_active = 1 AND email != 'admin@iterp.com'
  `)
  const users = usersResult.recordset

  // Get projects with assignments
  const projectsResult = await tx.request().query(`
    SELECT DISTINCT p.id as project_id, pa.user_id
    FROM projects p
    INNER JOIN project_assignments pa ON p.id = pa.project_id
    WHERE p.status IN ('in_progress', 'planning')
  `)

  // Get tasks for time entries
  const tasksResult = await tx.request().query(`
    SELECT t.id, t.project_id, t.assigned_to as user_id, t.status
    FROM tasks t
    WHERE t.status IN ('todo', 'in_progress', 'done', 'review')
  `)

  // Create time entries for the last 60 days (more realistic)
  for (let day = 0; day < 60; day++) {
    const date = new Date()
    date.setDate(date.getDate() - day)
    const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday

    // Skip weekends (Saturday = 6, Sunday = 0) - 70% of the time
    if ((dayOfWeek === 0 || dayOfWeek === 6) && Math.random() > 0.3) {
      continue
    }

    // For each active user, create 1-3 time entries
    for (const user of users) {
      // 80% chance user logs time on a weekday
      if (dayOfWeek > 0 && dayOfWeek < 6 && Math.random() > 0.2) {
        // Get user's tasks or projects
        const userTasks = tasksResult.recordset.filter(
          (t: any) => t.user_id === user.id && t.status !== "done"
        )
        const userProjects = projectsResult.recordset.filter(
          (p: any) => p.user_id === user.id
        )

        if (userTasks.length === 0 && userProjects.length === 0) continue

        // 1-3 time entries per day per user
        const entryCount = Math.floor(Math.random() * 3) + 1

        for (let i = 0; i < entryCount; i++) {
          let taskId = null
          let projectId = null
          let description = ""

          // 70% chance entry is linked to a task
          if (userTasks.length > 0 && Math.random() > 0.3) {
            const task = userTasks[Math.floor(Math.random() * userTasks.length)]
            taskId = task.id
            projectId = task.project_id
            description = `Worked on task: ${task.id}`
          } else if (userProjects.length > 0) {
            const project = userProjects[Math.floor(Math.random() * userProjects.length)]
            projectId = project.project_id
            description = `Project work and meetings`
          } else {
            continue
          }

          // Realistic hours: 1-8 hours, most common 4-6 hours
          const hours = Math.random() < 0.7 
            ? Math.random() * 2 + 4  // 4-6 hours (70% of entries)
            : Math.random() * 4 + 1   // 1-5 or 6-8 hours (30% of entries)

          // 75% billable, 25% non-billable (internal work, meetings, etc.)
          const billable = Math.random() > 0.25

          // 60% of entries approved (older entries more likely approved)
          const approved = day > 7 && Math.random() > 0.4
          let approvedBy = null
          let approvedAt = null

          if (approved) {
            // Get a manager to approve
            const managersResult = await tx.request().query(`
              SELECT TOP 1 u.id FROM users u
              INNER JOIN roles r ON u.role_id = r.id
              WHERE r.name = 'manager' AND u.is_active = 1
            `)
            if (managersResult.recordset.length > 0) {
              approvedBy = managersResult.recordset[0].id
              approvedAt = new Date(date.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000)
            }
          }

          const request = tx.request()
          request.input("user_id", user.id)
          request.input("project_id", projectId)
          request.input("task_id", taskId)
          request.input("date", date.toISOString().split("T")[0])
          request.input("hours", Math.round(hours * 100) / 100)
          request.input("description", description)
          request.input("billable", billable)
          request.input("approved_by", approvedBy)
          request.input("approved_at", approvedAt)

          await request.query(`
            INSERT INTO time_entries (user_id, project_id, task_id, date, hours, description, 
                                     billable, approved_by, approved_at, created_at, updated_at)
            VALUES (@user_id, @project_id, @task_id, @date, @hours, @description, 
                    @billable, @approved_by, @approved_at, GETDATE(), GETDATE());
          `)
        }
      }
    }
  }
}

async function seedAssets(tx: any) {
  const assets = [
    { name: "MacBook Pro 16-inch", type: "hardware", category: "Laptop", serial: "MBP-2024-001", manufacturer: "Apple", model: "M3 Pro", cost: 250000, assigned: "ananya.singh@iterp.com" },
    { name: "Dell XPS 15", type: "hardware", category: "Laptop", serial: "DLL-2024-002", manufacturer: "Dell", model: "XPS 15 9530", cost: 180000, assigned: "vikram.reddy@iterp.com" },
    { name: "HP EliteBook", type: "hardware", category: "Laptop", serial: "HP-2024-003", manufacturer: "HP", model: "EliteBook 840", cost: 120000, assigned: "kavya.nair@iterp.com" },
    { name: "Microsoft Office 365", type: "software", category: "Productivity", serial: "MS-2024-001", manufacturer: "Microsoft", model: "Office 365 Business", cost: 15000, assigned: null },
    { name: "Adobe Creative Suite", type: "software", category: "Design", serial: "ADB-2024-001", manufacturer: "Adobe", model: "Creative Cloud", cost: 25000, assigned: "ananya.singh@iterp.com" },
    { name: "External Monitor 27-inch", type: "hardware", category: "Monitor", serial: "MON-2024-001", manufacturer: "LG", model: "27UL850-W", cost: 35000, assigned: "vikram.reddy@iterp.com" },
    { name: "Mechanical Keyboard", type: "hardware", category: "Peripheral", serial: "KB-2024-001", manufacturer: "Keychron", model: "K8 Pro", cost: 8000, assigned: "kavya.nair@iterp.com" },
  ]

  for (const asset of assets) {
    let assignedToId = null
    if (asset.assigned) {
      const userResult = await tx.request().query(`
        SELECT id FROM users WHERE email = '${asset.assigned}'
      `)
      assignedToId = userResult.recordset[0]?.id
    }

    const request = tx.request()
    request.input("name", asset.name)
    request.input("type", asset.type)
    request.input("category", asset.category)
    request.input("serial_number", asset.serial)
    request.input("manufacturer", asset.manufacturer)
    request.input("model", asset.model)
    request.input("purchase_date", new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000))
    request.input("purchase_cost", asset.cost)
    request.input("assigned_to", assignedToId)
    request.input("status", assignedToId ? "assigned" : "available")
    request.input("location", "Office - Bangalore")

    await request.query(`
      IF NOT EXISTS (SELECT * FROM assets WHERE serial_number = @serial_number)
      BEGIN
        INSERT INTO assets (name, type, category, serial_number, manufacturer, model, 
                           purchase_date, purchase_cost, assigned_to, status, location, created_at, updated_at)
        VALUES (@name, @type, @category, @serial_number, @manufacturer, @model, 
                @purchase_date, @purchase_cost, @assigned_to, @status, @location, GETDATE(), GETDATE());
      END
    `)
  }
}

async function seedInventory(tx: any) {
  const inventory = [
    { name: "USB-C Cables", category: "Cables", sku: "INV-001", stock: 50, min: 20, cost: 500 },
    { name: "HDMI Cables", category: "Cables", sku: "INV-002", stock: 30, min: 15, cost: 300 },
    { name: "Wireless Mouse", category: "Peripherals", sku: "INV-003", stock: 25, min: 10, cost: 1500 },
    { name: "Webcam HD", category: "Peripherals", sku: "INV-004", stock: 15, min: 5, cost: 3500 },
    { name: "Laptop Stand", category: "Accessories", sku: "INV-005", stock: 20, min: 8, cost: 2500 },
  ]

  for (const item of inventory) {
    const request = tx.request()
    request.input("name", item.name)
    request.input("category", item.category)
    request.input("sku", item.sku)
    request.input("current_stock", item.stock)
    request.input("min_stock", item.min)
    request.input("max_stock", item.stock * 2)
    request.input("unit_cost", item.cost)
    request.input("supplier", "Tech Supplies India")
    request.input("reorder_point", item.min)

    await request.query(`
      IF NOT EXISTS (SELECT * FROM inventory WHERE sku = @sku)
      BEGIN
        INSERT INTO inventory (name, category, sku, current_stock, min_stock, max_stock, 
                              unit_cost, supplier, reorder_point, created_at, updated_at)
        VALUES (@name, @category, @sku, @current_stock, @min_stock, @max_stock, 
                @unit_cost, @supplier, @reorder_point, GETDATE(), GETDATE());
      END
    `)
  }
}

async function seedSkills(tx: any) {
  const skills = [
    { name: "React", category: "Frontend" },
    { name: "Next.js", category: "Frontend" },
    { name: "Node.js", category: "Backend" },
    { name: "TypeScript", category: "Programming" },
    { name: "Python", category: "Programming" },
    { name: "Java", category: "Programming" },
    { name: "SQL Server", category: "Database" },
    { name: "MongoDB", category: "Database" },
    { name: "Docker", category: "DevOps" },
    { name: "AWS", category: "Cloud" },
    { name: "Azure", category: "Cloud" },
    { name: "UI/UX Design", category: "Design" },
  ]

  for (const skill of skills) {
    const request = tx.request()
    request.input("name", skill.name)
    request.input("category", skill.category)

    await request.query(`
      IF NOT EXISTS (SELECT * FROM skills WHERE name = @name)
      BEGIN
        INSERT INTO skills (name, category, created_at)
        VALUES (@name, @category, GETDATE());
      END
    `)
  }
}

async function seedUserSkills(tx: any) {
  const usersResult = await tx.request().query(`
    SELECT id, email FROM users WHERE is_active = 1 AND email != 'admin@iterp.com'
  `)
  const skillsResult = await tx.request().query(`
    SELECT id, name FROM skills
  `)

  const skillMap: Record<string, number> = {}
  skillsResult.recordset.forEach((s: any) => {
    skillMap[s.name] = s.id
  })

  const userSkills = [
    { email: "priya.sharma@iterp.com", skills: ["React", "Next.js", "TypeScript", "Node.js", "SQL Server", "AWS"] },
    { email: "amit.patel@iterp.com", skills: ["Python", "Java", "Docker", "AWS", "MongoDB", "Azure"] },
    { email: "neha.verma@iterp.com", skills: ["Java", "Spring Boot", "Microservices", "Kubernetes", "Docker"] },
    { email: "ananya.singh@iterp.com", skills: ["React", "Next.js", "TypeScript", "UI/UX Design"] },
    { email: "vikram.reddy@iterp.com", skills: ["Node.js", "Python", "SQL Server", "Docker"] },
    { email: "kavya.nair@iterp.com", skills: ["React", "TypeScript", "UI/UX Design", "Next.js"] },
  ]

  const levels = ["beginner", "intermediate", "advanced", "expert"]

  for (const userSkill of userSkills) {
    const user = usersResult.recordset.find((u: any) => u.email === userSkill.email)
    if (!user) continue

    for (const skillName of userSkill.skills) {
      const skillId = skillMap[skillName]
      if (!skillId) continue

      const level = levels[Math.floor(Math.random() * levels.length)]
      const years = Math.floor(Math.random() * 5) + 1

      const request = tx.request()
      request.input("user_id", user.id)
      request.input("skill_id", skillId)
      request.input("proficiency_level", level)
      request.input("years_experience", years)
      request.input("certified", Math.random() > 0.6)

      await request.query(`
        IF NOT EXISTS (SELECT * FROM user_skills WHERE user_id = @user_id AND skill_id = @skill_id)
        BEGIN
          INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_experience, 
                                   certified, created_at, updated_at)
          VALUES (@user_id, @skill_id, @proficiency_level, @years_experience, 
                  @certified, GETDATE(), GETDATE());
        END
      `)
    }
  }
}

async function seedProjectAssignments(tx: any) {
  const projectsResult = await tx.request().query(`
    SELECT id, name FROM projects
  `)
  const usersResult = await tx.request().query(`
    SELECT id, email FROM users WHERE is_active = 1 AND email != 'admin@iterp.com'
  `)

  const roles = ["Developer", "Senior Developer", "Tech Lead", "QA Engineer", "DevOps Engineer"]

  for (const project of projectsResult.recordset) {
    // Assign 2-4 team members per project
    const teamSize = Math.floor(Math.random() * 3) + 2
    const teamMembers = usersResult.recordset
      .sort(() => Math.random() - 0.5)
      .slice(0, teamSize)

    for (const member of teamMembers) {
      const allocation = Math.floor(Math.random() * 40) + 60 // 60-100%
      const hourlyRate = Math.floor(Math.random() * 2000) + 1500 // 1500-3500

      const request = tx.request()
      request.input("project_id", project.id)
      request.input("user_id", member.id)
      request.input("role", roles[Math.floor(Math.random() * roles.length)])
      request.input("allocation_percentage", allocation)
      request.input("start_date", new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000))
      request.input("hourly_rate", hourlyRate)

      await request.query(`
        IF NOT EXISTS (SELECT * FROM project_assignments WHERE project_id = @project_id AND user_id = @user_id)
        BEGIN
          INSERT INTO project_assignments (project_id, user_id, role, allocation_percentage, 
                                          start_date, hourly_rate, created_at, updated_at)
          VALUES (@project_id, @user_id, @role, @allocation_percentage, 
                  @start_date, @hourly_rate, GETDATE(), GETDATE());
        END
      `)
    }
  }
}

