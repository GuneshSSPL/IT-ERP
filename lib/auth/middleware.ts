import { NextRequest, NextResponse } from "next/server"
import { verifyToken, JWTPayload } from "./jwt"

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

export async function authenticateRequest(
  request: NextRequest
): Promise<{ user: JWTPayload } | { error: NextResponse }> {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const token = authHeader.substring(7)

  try {
    const user = verifyToken(token)
    return { user }
  } catch (error) {
    return {
      error: NextResponse.json({ error: "Invalid token" }, { status: 401 }),
    }
  }
}

export function requireAuth(
  handler: (
    req: AuthenticatedRequest,
    user: JWTPayload,
    context?: { params?: Promise<Record<string, string>> }
  ) => Promise<NextResponse>
) {
  return async (
    req: NextRequest,
    context?: { params?: Promise<Record<string, string>> }
  ) => {
    const authResult = await authenticateRequest(req)

    if ("error" in authResult) {
      return authResult.error
    }

    const authenticatedReq = req as AuthenticatedRequest
    authenticatedReq.user = authResult.user

    return handler(authenticatedReq, authResult.user, context)
  }
}

