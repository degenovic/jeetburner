import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mints = searchParams.get('mints');
  
  if (!mints) {
    return NextResponse.json(
      { error: 'No mint addresses provided' },
      { status: 400 }
    );
  }

  const rpcUrl = process.env.NEXT_PUBLIC_MAINNET_RPC_URL;
  
  if (!rpcUrl) {
    return NextResponse.json(
      { error: 'RPC URL not configured' },
      { status: 500 }
    );
  }

  try {
    const mintList = mints.split(',');
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'metadata',
        method: 'getAssetBatch',
        params: {
          ids: mintList,
          options: {
            showFungible: true,
            showNativeBalance: true,
            showInscription: true
          }
        }
      }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const { result, error } = await response.json();
    console.log('DAS API Response:', { result, error });

    if (error) {
      console.error('DAS API Error:', error);
      return NextResponse.json([]);
    }

    const metadata = result.map((asset: any) => ({
      mint: asset?.id || 'unknown',
      name: asset?.content?.metadata?.name || asset?.ownership?.owner?.slice(0, 4) || 'Unknown',
      symbol: asset?.content?.metadata?.symbol || asset?.symbol || 'TOKEN',
      image: asset?.content?.links?.image
    })).filter(Boolean);

    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error fetching metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token metadata' },
      { status: 500 }
    );
  }
}
