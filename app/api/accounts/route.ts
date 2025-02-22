import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pubkey = searchParams.get('pubkey');

  if (!pubkey) {
    return NextResponse.json(
      { error: 'Pubkey parameter is required' },
      { status: 400 }
    );
  }

  const rpcUrl = process.env.MAINNET_RPC_URL;
  if (!rpcUrl) {
    return NextResponse.json(
      { error: 'RPC URL not configured' },
      { status: 500 }
    );
  }

  try {
    const connection = new Connection(rpcUrl, 'confirmed');
    const publicKey = new PublicKey(pubkey);

    const accounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: TOKEN_PROGRAM_ID },
      'confirmed'
    );

    return NextResponse.json({ accounts: accounts.value });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}
