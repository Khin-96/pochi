// app/api/chamas/[id]/route.ts
// This file defines the API endpoint for fetching details of a specific chama by its ID.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth"; // Ensure this path is correct for your authentication utility
import { findChamaById } from "@/lib/db";   // Ensure this path is correct for your database utility
                                          // And make sure findChamaById is correctly implemented in lib/db.ts

export async function GET(request: Request, { params }: { params: { id: string } }) {
  console.log(`--- Server: GET /api/chamas/${params.id} request received ---`);

  try {
    const user = await getCurrentUser();

    // 1. Authentication Check
    if (!user) {
      console.log("Server: Authentication failed. User not found.");
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }
    console.log(`Server: Authenticated user ID: ${user._id}`);

    const chamaId = params.id;

    // 2. Chama ID Validation
    if (!chamaId) {
      console.log("Server: Error - Chama ID is missing from URL parameters.");
      return NextResponse.json({ success: false, message: "Chama ID is required" }, { status: 400 });
    }
    console.log(`Server: Attempting to fetch chama with ID: ${chamaId}`);

    // 3. Fetch Chama from Database
    const chama = await findChamaById(chamaId); // This is where the database query happens

    if (!chama) {
      console.log(`Server: Error - Chama with ID ${chamaId} not found in the database.`);
      return NextResponse.json({ success: false, message: "Chama not found" }, { status: 404 });
    }
    console.log(`Server: Chama found - Name: "${chama.name}", ID: "${chama._id}"`);
    console.log("Server: Chama members array from DB:", chama.members);


    // 4. Authorization Check (Is the authenticated user a member of this chama?)
    // This is a common source of 403 errors.
    const isMember = chama.members.some((member: any) => member.userId === (user as any)._id);

    if (!isMember) {
      console.log(`Server: Authorization Failed - User ${user._id} is NOT a member of chama "${chama.name}".`);
      return NextResponse.json(
        { success: false, message: "Unauthorized: You are not a member of this chama" },
        { status: 403 },
      );
    }
    console.log(`Server: Authorization Granted - User ${user._id} is a member of chama "${chama.name}".`);

    // 5. Success Response
    console.log("Server: Successfully fetched and authorized chama details. Sending response.");
    return NextResponse.json({ success: true, chama });

  } catch (error) {
    // 6. Generic Server Error Handling
    console.error("Server: Unhandled GET /api/chamas/[id] Error:", error); // Log the full error for debugging
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to get chama details (internal server error)",
      },
      { status: 500 },
    );
  } finally {
    console.log("--- Server: GET /api/chamas/[id] request finished ---");
  }
}

// If you have a POST handler for this route (e.g., to update the chama), you can place it here:
/*
export async function POST(req: Request, { params }: { params: { id: string } }) {
  // ... your POST logic ...
}
*/