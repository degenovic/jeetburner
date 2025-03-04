import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { connection } from '../../utils/connection';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pubkey = searchParams.get('pubkey');

  if (!pubkey) {
    return NextResponse.json(
      { error: 'Public key is required' },
      { status: 400 }
    );
  }

  try {
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
