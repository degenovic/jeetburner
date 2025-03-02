import { NextResponse } from 'next/server';
import { getConnection } from '../../utils/connection';

export async function GET() {
  try {
    const connection = getConnection();
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    return NextResponse.json({ blockhash, lastValidBlockHeight });
  } catch (error) {
    console.error('Error getting blockhash:', error);
    return NextResponse.json({ error: 'Failed to get blockhash' }, { status: 500 });
  }
}
