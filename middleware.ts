import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);


const authPages = ["/login", "/register"];
const protectedPagePrefixes = ["/dashboard"]; // for later phases

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;

  // 1. Logged-in users shouldn't see login/register — bounce to home
  if (isLoggedIn && authPages.includes(path)) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // 2. Protect page routes, redirect to login with callbackUrl attached
  const isProtectedPage = protectedPagePrefixes.some((p) => path.startsWith(p));
  if (isProtectedPage && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Existing API protection (jobs) — unchanged
  const apiProtectedPaths = ["/api/jobs"];
  const isProtectedApi =
    apiProtectedPaths.some((p) => path.startsWith(p)) &&
    (req.method === "POST" || req.method === "PATCH" || req.method === "DELETE");

  if (isProtectedApi && !isLoggedIn) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/api/jobs/:path*", "/login", "/register", "/dashboard/:path*"],
};