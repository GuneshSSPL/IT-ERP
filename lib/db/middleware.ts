import { initializeDatabase } from "./init"

let initPromise: Promise<void> | null = null

export async function ensureDatabaseInitialized() {
  if (!initPromise) {
    initPromise = initializeDatabase()
  }
  return initPromise
}

