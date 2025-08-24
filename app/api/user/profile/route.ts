import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: NextRequest) {
  try {
    // Use getServerSession with authOptions
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("pochiyangu");
    
    const user = await db.collection("users").findOne({ 
      _id: new ObjectId(session.user.id) 
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return user profile without sensitive data
    const profile = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      location: user.location || "",
      joinDate: user.createdAt || new Date().toISOString(),
      verificationStatus: user.verificationStatus || "pending",
      bio: user.bio || "",
      balance: user.balance || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
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
    const { name, email, phone, location, bio } = body;

    const client = await clientPromise;
    const db = client.db("pochiyangu");
    
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { 
        $set: { 
          name,
          email,
          phone,
          location,
          bio,
          updatedAt: new Date()
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 400 });
    }

    // Return updated profile
    const updatedUser = await db.collection("users").findOne({ 
      _id: new ObjectId(session.user.id) 
    });

    const profile = {
      _id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      location: updatedUser.location || "",
      joinDate: updatedUser.createdAt || new Date().toISOString(),
      verificationStatus: updatedUser.verificationStatus || "pending",
      bio: updatedUser.bio || "",
      balance: updatedUser.balance || 0
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}