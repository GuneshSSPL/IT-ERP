import jwt, { SignOptions } from "jsonwebtoken"

const JWT_SECRET: string = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production"
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d"

export interface JWTPayload {
  userId: number
  email: string
  roleId: number
  employeeId: string
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions)
}

export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded as JWTPayload
  } catch (error) {
    throw new Error("Invalid or expired token")
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload
  } catch {
    return null
  }
}

