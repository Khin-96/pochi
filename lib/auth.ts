"use server";
import { cookies } from "next/headers";
import { verifyUserCredentials, createUser, findUserById } from "./db";
import type { User } from "./models";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";

// Configuration
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

const TOKEN_NAME = "pochiyangu_token";
const TOKEN_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds
const REMEMBER_ME_EXPIRY = TOKEN_EXPIRY * 2; // 14 days

// Types
export type AuthUser = Omit<User, "password">;
export type LoginCredentials = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

/**
 * Register a new user
 */
export async function signUp(
  userData: Omit<User, "_id" | "createdAt" | "balance">
): Promise<AuthUser> {
  try {
    const user = await createUser(userData);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error("Sign up error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to create user"
    );
  }
}

/**
 * Authenticate user and set session cookie
 */
export async function login({
  email,
  password,
  rememberMe = false,
}: LoginCredentials): Promise<AuthUser> {
  try {
    const user = await verifyUserCredentials(email, password);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      {
        expiresIn: rememberMe ? REMEMBER_ME_EXPIRY : TOKEN_EXPIRY,
      }
    );

    // Set secure cookie
    setAuthCookie(token, rememberMe);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error("Login error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to login"
    );
  }
}

/**
 * Clear authentication cookie
 */
export async function logout(): Promise<void> {
  clearAuthCookie();
  redirect("/login");
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const token = getAuthCookie();
    if (!token) return null;

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await findUserById(decoded.userId);
    if (!user) return null;

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    // Invalid token - clear it
    if (error instanceof jwt.JsonWebTokenError) {
      clearAuthCookie();
    }
    return null;
  }
}

/**
 * Password reset initiation
 */
export async function initiatePasswordReset(email: string): Promise<{ success: boolean }> {
  // TODO: Implement password reset logic
  return { success: true };
}

// Helper functions
function setAuthCookie(token: string, rememberMe: boolean = false): void {
  const isProduction = process.env.NODE_ENV === "production";
  const secure = isProduction || !!process.env.VERCEL || !!process.env.NETLIFY;

  cookies().set({
    name: TOKEN_NAME,
    value: token,
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: rememberMe ? REMEMBER_ME_EXPIRY : TOKEN_EXPIRY,
    path: "/",
  });
}

function clearAuthCookie(): void {
  cookies().set({
    name: TOKEN_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

function getAuthCookie(): string | undefined {
  return cookies().get(TOKEN_NAME)?.value;
}