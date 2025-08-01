// app/api/loans/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { findLoansByUserId } from "@/lib/db";

export async function GET() {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Fetch loans from database
    const loans = await findLoansByUserId(user._id);

    // Transform loans data for response
    const formattedLoans = loans.map((loan) => ({
      id: loan._id?.toString(),
      amount: loan.amount,
      purpose: loan.purpose,
      status: loan.status,
      requestDate: loan.requestDate,
      dueDate: loan.dueDate,
      interestRate: loan.interestRate,
      term: loan.term,
      payments: loan.payments,
    }));

    return NextResponse.json({ loans: formattedLoans });
  } catch (error) {
    console.error("Failed to fetch loans:", error);
    return NextResponse.json(
      { error: "Failed to fetch loans" },
      { status: 500 }
    );
  }
}