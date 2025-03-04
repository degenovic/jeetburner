import { NextResponse } from 'next/server';
import { getReliableConnection, markEndpointFailed } from '../../utils/connection';

export async function GET() {
  // Try up to 3 times with different endpoints if needed
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const connection = await getReliableConnection();
      console.log(`Fetching blockhash using endpoint: ${connection.rpcEndpoint}`);
      
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      
      console.log(`Successfully fetched blockhash: ${blockhash}`);
      return NextResponse.json({ blockhash, lastValidBlockHeight });
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
  return NextResponse.json(
    { error: 'Failed to get blockhash after multiple attempts' },
    { status: 500 }
  );
}
