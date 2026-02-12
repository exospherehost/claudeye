import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/lib/auth";

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const authUsers = process.env.CLAUDEYE_AUTH_USERS;
  if (!authUsers) return NextResponse.next(); // no auth configured → pass through

  const { pathname } = request.nextUrl;
  if (pathname === "/login") return NextResponse.next(); // login page itself

  const cookie = request.cookies.get("claudeye_session")?.value;
  const secret = process.env.CLAUDEYE_AUTH_SECRET ?? "";
  const username = cookie ? await verifySessionCookie(cookie, secret) : null;

  if (!username) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|exospheresmall).*)"],
};
