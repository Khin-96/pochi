import { NextResponse } from 'next/server';
import { generateReceiptPDF } from '@/lib/receipt'; // You'll need to implement this

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const pdf = await generateReceiptPDF(params.id);
    
    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=receipt-${params.id}.pdf`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate receipt' },
      { status: 500 }
    );
  }
}