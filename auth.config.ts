import type { NextAuthConfig, User } from "next-auth";
import type { Role } from "./types/next-auth";

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const typedUser = user as User & { role: Role };
        token.id = typedUser.id;
        token.role = typedUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [], // filled in by auth.ts
};