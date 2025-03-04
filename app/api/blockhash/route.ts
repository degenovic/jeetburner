import { connection } from '../../utils/connection';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    return NextResponse.json({ blockhash, lastValidBlockHeight });
  } catch (error) {
    console.error('Error getting blockhash:', error);
    return NextResponse.json({ error: 'Failed to get blockhash' }, { status: 500 });
  }
}
