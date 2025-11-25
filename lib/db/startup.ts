// This file ensures database initialization happens on server startup
import { ensureDatabaseInitialized } from "./middleware"

// Initialize database when this module is imported (server-side only)
if (typeof window === "undefined") {
  // Don't block startup, but initialize in background
  ensureDatabaseInitialized().catch((error) => {
    console.error("Background database initialization failed:", error)
    // Don't throw - let the app start and initialize on first request
  })
}

