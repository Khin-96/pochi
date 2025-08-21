import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "./mongodb";
import bcrypt from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuthUser } from "./auth";

export const authOptions = {
  // Configure MongoDB adapter
  adapter: MongoDBAdapter(clientPromise),

  // Session configuration
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  // Use JWT for session handling
  jwt: {
    secret: process.env.NEXTAUTH_SECRET || "your-fallback-secret",
    encryption: true,
  },

  // Configure providers (Credentials for email/password)
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Connect to database
          const client = await clientPromise;
          const db = client.db("pochiyangu");
          
          // Find user by email
          const user = await db.collection("users").findOne({
            email: credentials?.email?.toLowerCase().trim(),
          });

          if (!user) {
            throw new Error("No user found with this email");
          }

          // Verify password
          const isValid = await bcrypt.compare(
            credentials?.password || "",
            user.password
          );

          if (!isValid) {
            throw new Error("Invalid password");
          }

          // Return user object without password
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone,
            balance: user.balance,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],

  // Callbacks to customize session and JWT
  callbacks: {
    async jwt({ token, user }) {
      // Add user data to the token
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.phone = user.phone;
        token.balance = user.balance;
      }
      return token;
    },
    async session({ session, token }) {
      // Add token data to the session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.phone = token.phone as string;
        session.user.balance = token.balance as number;
      }
      return session;
    },
  },

  // Pages configuration (custom login page)
  pages: {
    signIn: "/login",
    error: "/login", // Error code passed in query string as ?error=
  },

  // Enable debug in development
  debug: process.env.NODE_ENV === "development",
};