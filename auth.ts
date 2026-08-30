import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import connectDb from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      // initial login
      if (user) {
        const typedUser = user as unknown as { id: string; role: string };
        token.id = typedUser.id;
        token.role = typedUser.role as typeof token.role;
        (token as unknown as Record<string, unknown>).roleUpdatedAt = Date.now();
        return token;
      }
      // On subsequent requests, optionally refresh role from DB (e.g. after admin promotion)
      // This avoids stale JWT after a DB role change without requiring re-login.
      // We throttle to once per 5 minutes to avoid DB hit on every request.
      const needsRefresh =
        trigger === "update" ||
        !(token as unknown as Record<string, unknown>).roleUpdatedAt ||
        Date.now() - ((token as unknown as Record<string, unknown>).roleUpdatedAt as number) > 5 * 60 * 1000;
      if (token.id && needsRefresh) {
        try {
          await connectDb();
          const fresh = await User.findById(token.id).select("role").lean();
          if (fresh && (fresh as unknown as { role: string }).role !== token.role) {
            token.role = (fresh as unknown as { role: typeof token.role }).role;
          }
          (token as unknown as Record<string, unknown>).roleUpdatedAt = Date.now();
        } catch {
          // ignore — keep existing token if DB unavailable
        }
      }
      // also run the base config's jwt if present (it just copies role on first login, already handled)
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as typeof session.user.role;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        // Rate limit by IP + email together: stops both a single attacker
        // brute-forcing many accounts, and distributed attempts against one account.
        const ip = getClientIp(request);
        const ipLimit = await rateLimit(`login-ip:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 });
        const emailLimit = await rateLimit(`login-email:${email}`, { limit: 5, windowMs: 15 * 60 * 1000 });
        if (!ipLimit.allowed || !emailLimit.allowed) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        await connectDb();
        const user = await User.findOne({ email }).select("+password");
        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
});