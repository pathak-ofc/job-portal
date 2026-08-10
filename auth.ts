import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import connectDb from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
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
        const ipLimit = rateLimit(`login-ip:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 });
        const emailLimit = rateLimit(`login-email:${email}`, { limit: 5, windowMs: 15 * 60 * 1000 });
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