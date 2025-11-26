declare module 'mssql' {
  export interface config {
    user?: string
    password?: string
    server?: string
    port?: number
    database?: string
    options?: {
      encrypt?: boolean
      trustServerCertificate?: boolean
      enableArithAbort?: boolean
    }
    pool?: {
      max?: number
      min?: number
      idleTimeoutMillis?: number
    }
  }

  export interface ConnectionPool {
    connected: boolean
    connect(): Promise<ConnectionPool>
    close(): Promise<void>
    request(): Request
    query<T = any>(query: string): Promise<{ recordset: T[] }>
  }

  export interface Request {
    input(name: string, value: any): Request
    input(name: string, type: any, value: any): Request
    query<T = any>(query: string): Promise<{ recordset: T[] }>
    execute<T = any>(procedure: string): Promise<{ recordset: T[] }>
  }

  export class Transaction {
    constructor(pool: ConnectionPool)
    begin(): Promise<void>
    commit(): Promise<void>
    rollback(): Promise<void>
    request(): Request
  }

  export function connect(config: config | string): Promise<ConnectionPool>

  // SQL Data Types
  export const Int: any
  export const VarChar: any
  export const NVarChar: any
  export const Bit: any
  export const DateTime: any
  export const Decimal: any
  export const Float: any

  namespace sql {
    export type config = config
    export type ConnectionPool = ConnectionPool
    export type Request = Request
    export type Transaction = Transaction
  }

  const sql: {
    config: typeof config
    ConnectionPool: new (config: config) => ConnectionPool
    Transaction: typeof Transaction
    Request: new (pool: ConnectionPool) => Request
    connect: typeof connect
    Int: typeof Int
    VarChar: typeof VarChar
    NVarChar: typeof NVarChar
    Bit: typeof Bit
    DateTime: typeof DateTime
    Decimal: typeof Decimal
    Float: typeof Float
  }

  export default sql
}

