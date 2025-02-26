import { NextRequest, NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';

export async function GET(request: NextRequest) {
  const rpcUrl = process.env.MAINNET_RPC_URL;
  const feeWalletAddress = process.env.FEE_WALLET_ADDRESS;
  const feePercentage = 0.2; // 20% fee
  
  if (!rpcUrl) {
    return NextResponse.json(
      { error: 'RPC URL not configured' },
      { status: 500 }
    );
  }

  if (!feeWalletAddress) {
    return NextResponse.json(
      { error: 'Fee wallet address not configured' },
      { status: 500 }
    );
  }

  try {
    const connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
    });

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    
    return NextResponse.json({ 
      blockhash, 
      lastValidBlockHeight,
      feeWalletAddress,
      feePercentage
    });
  } catch (error) {
    console.error('Error getting blockhash:', error);
    return NextResponse.json(
      { error: 'Failed to get blockhash' },
      { status: 500 }
    );
  }
}
