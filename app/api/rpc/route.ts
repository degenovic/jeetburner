import { NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';

export async function GET() {
  const rpcUrl = process.env.NEXT_PUBLIC_MAINNET_RPC_URL;
  
  if (!rpcUrl) {
    return NextResponse.json(
      { error: 'RPC URL not configured' },
      { status: 500 }
    );
  }

  try {
    const connection = new Connection(rpcUrl);
    const slot = await connection.getSlot();
    
    return NextResponse.json({ slot });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to connect to RPC' },
      { status: 500 }
    );
  }
}
