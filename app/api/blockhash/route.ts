import { NextRequest, NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';

export async function GET(request: NextRequest) {
  const rpcUrl = process.env.MAINNET_RPC_URL;
  
  if (!rpcUrl) {
    return NextResponse.json(
      { error: 'RPC URL not configured' },
      { status: 500 }
    );
  }

  try {
    const connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
    });

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    
    return NextResponse.json({ blockhash, lastValidBlockHeight });
  } catch (error) {
    console.error('Error getting blockhash:', error);
    return NextResponse.json(
      { error: 'Failed to get blockhash' },
      { status: 500 }
    );
  }
}
