import {NextResponse} from "next/server";
import {getToken} from "next-auth/jwt";
import type {NextRequest} from "next/server";

const SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-for-development-only";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Get and verify JWT token
  const token = await getToken({
    req: request,
    secret: SECRET,
  });

  // Protect /todos routes
  if (path.startsWith("/todos") && !token) {
    console.log("Proxy: No token found, redirecting to login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  console.log("Proxy: Token found, allowing access");
  return NextResponse.next();
}

export const config = {
  matcher: ["/todos/:path*"],
};
