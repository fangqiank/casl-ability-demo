import {NextAuthOptions} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {db} from "./db";
import {users} from "./db/schema";
import {eq} from "drizzle-orm";
import {UserRole} from "./ability/types";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development-only",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {label: "Email", type: "email"},
        password: {label: "Password", type: "password"},
      },
      async authorize(credentials) {
        console.log("Authorize attempt:", credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        try {
          // 从数据库查询用户
          const user = db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email))
            .get();

          console.log("DB query result:", user);

          if (!user) {
            console.log("User not found:", credentials.email);
            return null;
          }

          console.log("User found:", user.email);

          // 简化版密码验证（实际应该使用 bcrypt）
          const expectedPassword =
            credentials.email === "admin@example.com" ? "admin123" : "user123";
          if (credentials.password === expectedPassword) {
            console.log("Password match, returning user");
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }

          console.log("Password mismatch");
          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({token, user}) {
      if (user) {
        token.id = user.id;
        token.role = user.role as UserRole;
      }
      return token;
    },
    async session({session, token}) {
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

  session: {
    strategy: "jwt",
  },

  debug: true,
};
