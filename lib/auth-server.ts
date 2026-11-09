import "server-only";
import { getAdminAuth } from "@/lib/firebase/admin";
import { ApiError } from "@/lib/http";

export interface AuthUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  name: string;
}

export async function requireUser(request: Request): Promise<AuthUser> {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) throw new ApiError(401, "Sign in required.");
  const auth = getAdminAuth();
  if (!auth) {
    throw new ApiError(503, "Firebase Admin is not configured. Add the service account environment variables, then redeploy.");
  }
  try {
    const decoded = await auth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email || "",
      emailVerified: Boolean(decoded.email_verified),
      name: typeof decoded.name === "string" ? decoded.name : "",
    };
  } catch {
    throw new ApiError(401, "Your session has expired. Sign in again.");
  }
}

export function requireVerified(user: AuthUser) {
  if (!user.emailVerified) {
    throw new ApiError(
      403,
      "Verify your email before using this. Open the message from Firebase, then choose “I have verified” in the app.",
      "EMAIL_UNVERIFIED",
    );
  }
}
