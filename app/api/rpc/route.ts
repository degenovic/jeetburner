import { NextRequest, NextResponse } from 'next/server';
import { connection } from '../../utils/connection';

export async function GET() {
  try {
    const rpcEndpoint = connection.rpcEndpoint;
    return NextResponse.json({ rpcEndpoint });
  } catch (error) {
    console.error('Error getting RPC endpoint:', error);
    return NextResponse.json({ error: 'Failed to get RPC endpoint' }, { status: 500 });
  }
}
