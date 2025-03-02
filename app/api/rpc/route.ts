import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../utils/connection';

export async function GET() {
  try {
    const connection = getConnection();
    const slot = await connection.getSlot();
    
    return NextResponse.json({ slot });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to connect to RPC' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const connection = getConnection();
    const body = await request.json();
    const result = await connection.sendRawTransaction(body.transaction);
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error sending transaction:', error);
    return NextResponse.json(
      { error: 'Failed to send transaction' },
      { status: 500 }
    );
  }
}
