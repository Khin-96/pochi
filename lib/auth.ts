"use server";
import { cookies } from "next/headers";
import { verifyUserCredentials, createUser, findUserById } from "./db";
import type { User } from "./models";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const TOKEN_NAME = "pochiyangu_token";
const TOKEN_EXPIRY = 60 * 60 * 24 * 7; // 7 days

export async function signUp(userData: Omit<User, "_id" | "createdAt" | "balance" | "testingBalance">) {
  try {
    const user = await createUser(userData);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error("Sign up error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to create user");
  }
}

export async function login({
  email,
  password,
  rememberMe,
}: { email: string; password: string; rememberMe?: boolean }) {
  try {
    const user = await verifyUserCredentials(email, password);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Create JWT token
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: rememberMe ? TOKEN_EXPIRY * 2 : TOKEN_EXPIRY,
    });

    // Detect environment
    const isProduction = process.env.NODE_ENV === "production";
    const isVercel = !!process.env.VERCEL;
    const isNetlify = !!process.env.NETLIFY;
    const isHttps = isProduction || isVercel || isNetlify;

    // Set cookie with environment-aware settings
    cookies().set({
      name: TOKEN_NAME,
      value: token,
      httpOnly: true,
      secure: isHttps, // true in production, Netlify, and Vercel
      sameSite: isProduction ? "strict" : "lax", // lax for development
      maxAge: rememberMe ? TOKEN_EXPIRY * 2 : TOKEN_EXPIRY,
      path: "/",
      // Optional: Uncomment if you need cross-subdomain support in production
      // ...(isProduction && { domain: ".yourdomain.com" }),
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error("Login error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to login");
  }
}

export async function logout() {
  // Delete cookie with same settings as login
  const isProduction = process.env.NODE_ENV === "production";
  
  cookies().set({
    name: TOKEN_NAME,
    value: "",
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 0, // Immediately expire
    path: "/",
  });
  
  return { success: true };
}

export async function getCurrentUser() {
  try {
    const token = cookies().get(TOKEN_NAME)?.value;
    if (!token) return null;

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await findUserById(decoded.userId);
      if (!user) return null;

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      // Token is invalid or expired
      await logout(); // Clean up invalid token
      return null;
    }
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

export async function forgotPassword(email: string) {
  // In a real app, this would send an email with a reset link
  // For now, we'll just simulate the process
  return { success: true };
}