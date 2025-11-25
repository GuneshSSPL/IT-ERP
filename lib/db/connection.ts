import sql from "mssql"

const config: sql.config = {
  user: process.env.DB_USERNAME || "sa",
  password: process.env.DB_PASSWORD || "sipamara",
  database: "master", // Connect to master first to create database if needed
  server: process.env.DB_HOST || "127.0.0.1",
  port: parseInt(process.env.DB_PORT || "1433"),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

const dbConfig: sql.config = {
  ...config,
  database: process.env.DB_DATABASE || "ITERP",
}

let pool: sql.ConnectionPool | null = null

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (pool) {
    return pool
  }

  try {
    // First, ensure database exists
    await ensureDatabaseExists()
    
    // Then connect to the actual database
    pool = await sql.connect(dbConfig)
    console.log("Connected to MSSQL database:", dbConfig.database)
    return pool
  } catch (error) {
    console.error("Database connection error:", error)
    throw error
  }
}

async function ensureDatabaseExists() {
  try {
    const masterPool = await sql.connect(config)
    const dbName = process.env.DB_DATABASE || "ITERP"
    
    const result = await masterPool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${dbName}')
      BEGIN
        CREATE DATABASE [${dbName}];
      END
    `)
    
    await masterPool.close()
    console.log(`Database ${dbName} ensured to exist`)
  } catch (error: any) {
    // If database already exists, that's fine
    if (!error.message?.includes("already exists")) {
      console.warn("Database creation check:", error.message)
    }
  }
}

export async function closeConnection(): Promise<void> {
  if (pool) {
    await pool.close()
    pool = null
  }
}

export async function query<T = any>(
  queryString: string,
  params?: Record<string, any>
): Promise<T[]> {
  const pool = await getConnection()
  const request = pool.request()

  if (params) {
    Object.keys(params).forEach((key) => {
      request.input(key, params[key])
    })
  }

  const result = await request.query(queryString)
  return result.recordset as T[]
}

export async function execute<T = any>(
  procedureName: string,
  params?: Record<string, any>
): Promise<T[]> {
  const pool = await getConnection()
  const request = pool.request()

  if (params) {
    Object.keys(params).forEach((key) => {
      request.input(key, params[key])
    })
  }

  const result = await request.execute(procedureName)
  return result.recordset as T[]
}

// Transaction helper for ACID compliance
export async function transaction<T>(
  callback: (transaction: sql.Transaction) => Promise<T>
): Promise<T> {
  const pool = await getConnection()
  const transaction = new sql.Transaction(pool)
  
  try {
    await transaction.begin()
    const result = await callback(transaction)
    await transaction.commit()
    return result
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
