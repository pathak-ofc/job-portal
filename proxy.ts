import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";
import type { Role } from "./types/next-auth";

const { auth } = NextAuth(authConfig);

const authPages = ["/login", "/register"];

// Each dashboard sub-area is restricted to a single role. Any other logged-in
// role hitting a mismatched section gets redirected to their own dashboard
// instead of silently rendering (defense-in-depth on top of the API's own
// role checks, and prevents a confusing "forbidden" UI flash).
const dashboardRoleForPrefix: { prefix: string; role: Role }[] = [
  { prefix: "/dashboard/student", role: "student" },
  { prefix: "/dashboard/company", role: "company" },
  { prefix: "/dashboard/admin", role: "admin" },
];

const dashboardHomeForRole: Record<Role, string> = {
  student: "/dashboard/student",
  company: "/dashboard/company",
  admin: "/dashboard/admin",
};

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const path = req.nextUrl.pathname;

  // 1. Logged-in users shouldn't see login/register — bounce to their dashboard
  if (isLoggedIn && authPages.includes(path)) {
    const home = role ? dashboardHomeForRole[role] : "/";
    return NextResponse.redirect(new URL(home, req.nextUrl));
  }

  // 2. Protect /dashboard pages — must be logged in, and in the right role's section
  if (path.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.nextUrl);
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }

    const matchedSection = dashboardRoleForPrefix.find((s) => path.startsWith(s.prefix));
    if (matchedSection && role !== matchedSection.role) {
      const home = role ? dashboardHomeForRole[role] : "/";
      return NextResponse.redirect(new URL(home, req.nextUrl));
    }
  }

  // 3. API mutation routes require at least a logged-in session.
  // Fine-grained role/ownership checks still happen inside each route handler —
  // this is just a first line of defense so unauthenticated requests never
  // reach a DB call.
  const apiProtectedPrefixes = [
    "/api/jobs",
    "/api/applications",
    "/api/bookmarks",
    "/api/profile",
    "/api/admin",
    "/api/upload",
  ];
  const mutatingMethods = ["POST", "PATCH", "PUT", "DELETE"];
  const isProtectedApi = apiProtectedPrefixes.some((p) => path.startsWith(p));

  if (isProtectedApi && !isLoggedIn) {
    // admin/profile/bookmarks/upload are never public, even for GET
    const alwaysAuthed = ["/api/admin", "/api/profile", "/api/upload", "/api/bookmarks", "/api/applications"];
    const requiresAuth =
      alwaysAuthed.some((p) => path.startsWith(p)) || mutatingMethods.includes(req.method);

    if (requiresAuth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/api/jobs/:path*",
    "/api/applications/:path*",
    "/api/bookmarks/:path*",
    "/api/profile/:path*",
    "/api/admin/:path*",
    "/api/upload/:path*",
    "/login",
    "/register",
    "/dashboard/:path*",
  ],
};
