import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('pochiyangu');
    const transactions = await db.collection('transactions').find({}).toArray();

    return NextResponse.json({ success: true, data: transactions });
  } catch (error) {
    console.error("❌ GET error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('pochiyangu');

    const body = await req.json();
    const result = await db.collection('transactions').insertOne(body);

    return NextResponse.json({ success: true, result }, { status: 201 });
  } catch (error) {
    console.error("❌ POST error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
