import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("pochiyangu");
    
    const user = await db.collection("users").findOne({ 
      _id: new ObjectId(session.user.id) 
    });

    // Return security settings (don't include sensitive data)
    const securitySettings = {
      twoFactorEnabled: user?.twoFactorEnabled || false,
      loginAlerts: user?.loginAlerts || true,
      sessionTimeout: user?.sessionTimeout || 24 // hours
    };

    return NextResponse.json({ securitySettings });
  } catch (error) {
    console.error("Security settings fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch security settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { securitySettings, currentPassword, newPassword } = body;

    const client = await clientPromise;
    const db = client.db("pochiyangu");
    
    // If password change is requested
    if (currentPassword && newPassword) {
      const user = await db.collection("users").findOne({ 
        _id: new ObjectId(session.user.id) 
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await db.collection("users").updateOne(
        { _id: new ObjectId(session.user.id) },
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date()
          } 
        }
      );
    }

    // Update security settings
    if (securitySettings) {
      await db.collection("users").updateOne(
        { _id: new ObjectId(session.user.id) },
        { 
          $set: { 
            twoFactorEnabled: securitySettings.twoFactorEnabled,
            loginAlerts: securitySettings.loginAlerts,
            sessionTimeout: securitySettings.sessionTimeout,
            updatedAt: new Date()
          } 
        }
      );
    }

    return NextResponse.json({ message: "Security settings updated successfully" });
  } catch (error) {
    console.error("Security settings update error:", error);
    return NextResponse.json(
      { error: "Failed to update security settings" },
      { status: 500 }
    );
  }
}