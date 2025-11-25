import { NextResponse } from "next/server"
import { ensureDatabaseInitialized } from "@/lib/db/middleware"

export async function GET() {
  try {
    // Initialize database on first health check (lazy initialization)
    await ensureDatabaseInitialized()
    return NextResponse.json({ 
      status: "ok", 
      message: "System is healthy",
      database: "initialized",
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json(
      { 
        status: "error", 
        message: error.message,
        database: "not_initialized"
      },
      { status: 500 }
    )
  }
}

