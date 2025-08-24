"use server";
import { cookies } from "next/headers";
import { verifyUserCredentials, createUser, findUserById } from "./db";
import type { User } from "./models";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-secret-for-development";
const TOKEN_NAME = "pochiyangu_token";
const TOKEN_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds
const REMEMBER_ME_EXPIRY = TOKEN_EXPIRY * 2; // 14 days

// Types
export type AuthUser = Omit<User, "password"> & { _id: string };
export type LoginCredentials = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

/**
 * Verify JWT token with proper error handling
 */
async function verifyToken(token: string): Promise<{ userId: string; email: string; exp: number }> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; exp: number };
    
    // Check if token is about to expire (within 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp - now < 300) {
      throw new jwt.TokenExpiredError("Token about to expire", new Date(decoded.exp * 1000));
    }
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Session expired. Please login again.");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      await clearAuthCookie();
      throw new Error("Invalid session. Please login again.");
    }
    throw new Error("Authentication failed");
  }
}

/**
 * Register a new user with proper data validation
 */
export async function signUp(
  userData: Omit<User, "_id" | "createdAt" | "balance">
): Promise<AuthUser> {
  try {
    if (!userData.email || !userData.password) {
      throw new Error("Email and password are required");
    }

    const user = await createUser(userData);
    const { password, ...userWithoutPassword } = user;
    return { ...userWithoutPassword, _id: user._id.toString() };
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
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const user = await verifyUserCredentials(email, password);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: rememberMe ? REMEMBER_ME_EXPIRY : TOKEN_EXPIRY,
      }
    );

    await setAuthCookie(token, rememberMe);

    const { password: _, ...userWithoutPassword } = user;
    return { ...userWithoutPassword, _id: user._id.toString() };
  } catch (error) {
    console.error("Login error:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to login"
    );
  }
}

/**
 * Clear authentication cookie and redirect
 */
export async function logout(): Promise<void> {
  await clearAuthCookie();
  redirect("/login");
}

/**
 * Get current authenticated user with enhanced error handling
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const token = await getAuthCookie();
    if (!token) {
      return null;
    }

    const decoded = await verifyToken(token);
    const user = await findUserById(decoded.userId);
    
    if (!user) {
      await clearAuthCookie();
      return null;
    }

    const { password, ...userWithoutPassword } = user;
    return { ...userWithoutPassword, _id: user._id.toString() };
  } catch (error) {
    console.error("Authentication error:", error);
    await clearAuthCookie();
    return null;
  }
}

/**
 * Get token with proper validation
 */
export async function getToken(): Promise<string | null> {
  try {
    const token = await getAuthCookie();
    if (!token) return null;

    await verifyToken(token);
    return token;
  } catch (error) {
    console.error("Token validation error:", error);
    await clearAuthCookie();
    return null;
  }
}

export async function getUserProfile(): Promise<AuthUser | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }

    // Fetch additional profile data if needed
    const client = await clientPromise;
    const db = client.db("pochiyangu");
    
    const userData = await db.collection("users").findOne({ 
      _id: new ObjectId(user._id) 
    });

    if (!userData) {
      return null;
    }

    const { password, ...userWithoutPassword } = userData;
    return { ...userWithoutPassword, _id: user._id.toString() };
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return null;
  }
}

// Helper functions
async function setAuthCookie(token: string, rememberMe: boolean = false): Promise<void> {
  const isProduction = process.env.NODE_ENV === "production";
  const secure = isProduction || !!process.env.VERCEL || !!process.env.NETLIFY;

  (await cookies()).set({
    name: TOKEN_NAME,
    value: token,
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: rememberMe ? REMEMBER_ME_EXPIRY : TOKEN_EXPIRY,
    path: "/",
  });
}

async function clearAuthCookie(): Promise<void> {
  (await cookies()).set({
    name: TOKEN_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

async function getAuthCookie(): Promise<string | undefined> {
  return (await cookies()).get(TOKEN_NAME)?.value;
}