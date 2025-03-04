import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getReliableConnection, markEndpointFailed } from '../../utils/connection';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    try {
      new PublicKey(walletAddress);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    // Try up to 3 times with different endpoints if needed
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const connection = await getReliableConnection();
        console.log(`Fetching accounts using endpoint: ${connection.rpcEndpoint}`);
        
        const accounts = await connection.getParsedTokenAccountsByOwner(
          new PublicKey(walletAddress),
          { programId: TOKEN_PROGRAM_ID }
        );

        console.log(`Successfully fetched ${accounts.value.length} token accounts`);
        return NextResponse.json({ accounts: accounts.value });
      } catch (attemptError) {
        console.error(`Error on attempt ${attempt + 1}:`, attemptError);
        
        // If it's a 403 error or contains "forbidden", mark the endpoint as failed
        if (
          attemptError instanceof Error && 
          (attemptError.message.includes('403') || attemptError.message.toLowerCase().includes('forbidden'))
        ) {
          const match = attemptError.message.match(/endpoint: (https?:\/\/[^\s]+)/);
          if (match && match[1]) {
            console.warn(`Marking endpoint as failed due to 403: ${match[1]}`);
            markEndpointFailed(match[1]);
          }
          
          // Only continue to next attempt if we haven't tried all attempts yet
          if (attempt < 2) {
            console.log('Trying next endpoint...');
            continue;
          }
        }
        
        // If we've reached the last attempt or it's not a 403 error, throw
        throw attemptError;
      }
    }
    
    // This should not be reached due to the throw in the loop, but just in case
    throw new Error('Failed to fetch accounts after multiple attempts');
  } catch (error) {
    console.error('Error fetching token accounts:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch token accounts' },
      { status: 500 }
    );
  }
}
