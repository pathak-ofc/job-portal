import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;

  const protectedPaths = ["/api/jobs"];

  const isProtected =
    protectedPaths.some((p) => path.startsWith(p)) &&
    (req.method === "POST" || req.method === "PATCH" || req.method === "DELETE");

  if (isProtected && !isLoggedIn) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/api/jobs/:path*"],
};