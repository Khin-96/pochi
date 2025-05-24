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

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: rememberMe ? TOKEN_EXPIRY * 2 : TOKEN_EXPIRY,
    });

    const isProduction = process.env.NODE_ENV === "production";
    const isVercel = !!process.env.VERCEL;
    const isNetlify = !!process.env.NETLIFY;
    const isHttps = isProduction || isVercel || isNetlify;

    const cookieStore = await cookies(); // ✅ Await cookies()
    cookieStore.set({
      name: TOKEN_NAME,
      value: token,
      httpOnly: true,
      secure: isHttps,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: rememberMe ? TOKEN_EXPIRY * 2 : TOKEN_EXPIRY,
      path: "/",
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error("Login error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to login");
  }
}

export async function logout() {
  const isProduction = process.env.NODE_ENV === "production";

  const cookieStore = await cookies(); // ✅ Await cookies()
  cookieStore.set({
    name: TOKEN_NAME,
    value: "",
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 0,
    path: "/",
  });

  return { success: true };
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies(); // ✅ Await cookies()
    const token = cookieStore.get(TOKEN_NAME)?.value;
    if (!token) return null;

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await findUserById(decoded.userId);
      if (!user) return null;

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      await logout(); // Clean up invalid token
      return null;
    }
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}

export async function forgotPassword(email: string) {
  return { success: true };
}
