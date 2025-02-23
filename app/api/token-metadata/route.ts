import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mints = searchParams.get('mints');

  if (!mints) {
    return NextResponse.json(
      { error: 'No mint addresses provided' },
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
    const mintAddresses = mints.split(',');
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'my-id',
        method: 'getAssetBatch',
        params: {
          ids: mintAddresses,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch token metadata');
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    const metadata = data.result.items.reduce((acc: any, item: any) => {
      if (!item) return acc;
      
      const imageUrl = item.content?.files?.[0]?.uri || 
                      item.content?.metadata?.image || 
                      (item.id ? `https://crates.helius.xyz/${item.id}` : undefined);
      
      acc[item.id] = {
        mint: item.id,
        name: item.content?.metadata?.name || 'Unknown',
        symbol: item.content?.metadata?.symbol || '',
        image: imageUrl || undefined
      };
      return acc;
    }, {});

    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token metadata' },
      { status: 500 }
    );
  }
}
