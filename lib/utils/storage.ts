// Safe localStorage utilities with error handling

export function getStorageItem(key: string): string | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    return localStorage.getItem(key)
  } catch (error) {
    console.warn(`Failed to get localStorage item "${key}":`, error)
    return null
  }
}

export function setStorageItem(key: string, value: string): boolean {
  if (typeof window === "undefined") {
    return false
  }

  try {
    localStorage.setItem(key, value)
    return true
  } catch (error) {
    console.warn(`Failed to set localStorage item "${key}":`, error)
    return false
  }
}

export function removeStorageItem(key: string): boolean {
  if (typeof window === "undefined") {
    return false
  }

  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.warn(`Failed to remove localStorage item "${key}":`, error)
    return false
  }
}

export function getStoredUser(): any | null {
  const userData = getStorageItem("user")
  if (!userData) {
    return null
  }

  try {
    return JSON.parse(userData)
  } catch (error) {
    console.warn("Failed to parse stored user data:", error)
    removeStorageItem("user")
    return null
  }
}

export function getStoredToken(): string | null {
  return getStorageItem("token")
}

export function clearAuthStorage(): void {
  removeStorageItem("token")
  removeStorageItem("user")
}

