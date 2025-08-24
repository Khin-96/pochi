import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "@/lib/mongodb";
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

    // Return default notification preferences if none set
    const notificationPreferences = user?.notificationPreferences || {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      chamaUpdates: true,
      paymentReminders: true,
      securityAlerts: true
    };

    return NextResponse.json({ notificationPreferences });
  } catch (error) {
    console.error("Notification preferences fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification preferences" },
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
    const { notificationPreferences } = body;

    const client = await clientPromise;
    const db = client.db("pochiyangu");
    
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { 
        $set: { 
          notificationPreferences,
          updatedAt: new Date()
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to update notification preferences" }, { status: 400 });
    }

    return NextResponse.json({ message: "Notification preferences updated successfully" });
  } catch (error) {
    console.error("Notification preferences update error:", error);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}