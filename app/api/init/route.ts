import { NextResponse } from "next/server"
import { initializeDatabase } from "@/lib/db/init"

export async function POST() {
  try {
    await initializeDatabase()
    return NextResponse.json({ 
      message: "Database initialized successfully",
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error("Initialization error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to initialize database" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    await initializeDatabase()
    return NextResponse.json({ 
      status: "initialized",
      message: "Database is ready",
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message },
      { status: 500 }
    )
  }
}
