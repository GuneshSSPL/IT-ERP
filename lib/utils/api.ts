// API utility functions with token handling

import { getStoredToken } from "./storage"

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getStoredToken()

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  })

  // If unauthorized, clear storage and redirect
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      const { clearAuthStorage } = await import("./storage")
      clearAuthStorage()
      window.location.href = "/login"
    }
  }

  return response
}

export async function apiGet<T = any>(endpoint: string): Promise<T> {
  const response = await apiRequest(endpoint, { method: "GET" })
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`)
  }
  return response.json()
}

export async function apiPost<T = any>(
  endpoint: string,
  data: any
): Promise<T> {
  const response = await apiRequest(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || `API request failed: ${response.statusText}`)
  }
  return response.json()
}

