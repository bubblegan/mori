import { prisma } from "@/utils/prisma";
import type { User as PrismaUser } from "@prisma/client";
import { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyPassword } from "./verifyPassword";

declare module "next-auth" {
  interface User {
    id: number;
  }
  interface Session {
    user: PrismaUser;
  }
}

export const nextAuthOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: {
          label: "Username",
          type: "usename",
        },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const result = await prisma.user.findFirst({
            where: { username: credentials?.username },
          });

          if (!result || !credentials?.password) return null;

          const isValidPassword = await verifyPassword(credentials.password, result.password);
          if (!isValidPassword) return null;

          return {
            id: result.id,
            username: result.username,
            email: result.email,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = Number(token.id);
      }
      return session;
    },
  },
  jwt: {
    maxAge: 15 * 24 * 30 * 60, // 15 days
  },
  pages: {
    signIn: "/sign-in",
    newUser: "/sign-up",
    error: "/sign-in",
  },
};
