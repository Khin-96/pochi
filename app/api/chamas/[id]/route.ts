import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findChamaById } from "@/lib/db";

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
    const chama = await findChamaById(chamaId);

    if (!chama) {
      console.log(`Server: Error - Chama with ID ${chamaId} not found in the database.`);
      return NextResponse.json({ success: false, message: "Chama not found" }, { status: 404 });
    }

    console.log(`Server: Chama found - Name: "${chama.name}", ID: "${chama._id}"`);
    console.log("Server: Chama members array from DB:", chama.members);

    // 4. Authorization Check
    const isMember = chama.members.some((member: any) => 
      member.userId.toString() === user._id.toString()
    );

    if (!isMember) {
      console.log(`Server: Authorization Failed - User ${user._id} is NOT a member of chama "${chama.name}".`);
      return NextResponse.json(
        { success: false, message: "Unauthorized: You are not a member of this chama" },
        { status: 403 },
      );
    }

    // 5. Transform the chama data for the client
    const transformedChama = {
      ...chama,
      id: chama._id.toString(),
      _id: chama._id.toString(),
      members: chama.members.map((member: any) => ({
        ...member,
        id: member._id?.toString() || member.id,
        userId: member.userId?.toString(),
        joinDate: member.joinDate?.toISOString()
      })),
      transactions: chama.transactions?.map((transaction: any) => ({
        ...transaction,
        id: transaction._id?.toString() || transaction.id,
        date: transaction.date?.toISOString()
      })) || []
    };

    // 6. Success Response
    console.log("Server: Successfully fetched and authorized chama details. Sending response.");
    return NextResponse.json({ success: true, chama: transformedChama });

  } catch (error) {
    // 6. Generic Server Error Handling
    console.error("Server: Unhandled GET /api/chamas/[id] Error:", error);
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