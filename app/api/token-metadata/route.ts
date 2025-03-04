import { NextRequest, NextResponse } from 'next/server';
import { getReliableConnection, markEndpointFailed } from '../../utils/connection';

// List of DAS API endpoints to try, with Helius prioritized
const DAS_ENDPOINTS = [
  process.env.MAINNET_RPC_URL, // Helius endpoint (primary)
  'https://api.mainnet-beta.solana.com',
  'https://solana-mainnet.rpc.extrnode.com',
  'https://solana.public-rpc.com',
  'https://rpc.ankr.com/solana'
];

// Track failed endpoints to avoid retrying them immediately
let failedDasEndpoints: Record<string, number> = {};
let currentDasEndpointIndex = 0;

const getReliableDasEndpoint = () => {
  // Check if we have a Helius endpoint configured
  const heliusEndpoint = process.env.MAINNET_RPC_URL;
  
  // If Helius endpoint is available and hasn't failed recently, prioritize it
  if (heliusEndpoint) {
    const failedTime = failedDasEndpoints[heliusEndpoint];
    const now = Date.now();
    
    // If the Helius endpoint hasn't failed recently or the failure was more than 10 minutes ago, use it
    if (!failedTime || now - failedTime > 10 * 60 * 1000) {
      return heliusEndpoint;
    }
  }

  // Filter out undefined/null endpoints
  const validEndpoints = DAS_ENDPOINTS.filter(endpoint => endpoint) as string[];

  if (validEndpoints.length === 0) {
    throw new Error('No valid DAS endpoints available');
  }

  // Try to find an endpoint that hasn't failed recently
  const now = Date.now();
  for (let i = 0; i < validEndpoints.length; i++) {
    const index = (currentDasEndpointIndex + i) % validEndpoints.length;
    const endpoint = validEndpoints[index];
    
    // Skip endpoints that failed in the last 5 minutes
    const failedTime = failedDasEndpoints[endpoint];
    if (failedTime && now - failedTime < 5 * 60 * 1000) {
      continue;
    }
    
    currentDasEndpointIndex = index;
    return endpoint;
  }

  // If all endpoints have failed recently, use the next one in rotation
  currentDasEndpointIndex = (currentDasEndpointIndex + 1) % validEndpoints.length;
  return validEndpoints[currentDasEndpointIndex];
};

const markDasEndpointFailed = (endpoint: string) => {
  if (!endpoint) return; // Guard against undefined endpoints
  
  console.warn(`Marking DAS endpoint as failed: ${endpoint}`);
  failedDasEndpoints[endpoint] = Date.now();
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mints = searchParams.get('mints');
  
  if (!mints) {
    return NextResponse.json(
      { error: 'No mint addresses provided' },
      { status: 400 }
    );
  }

  const mintList = mints.split(',');
  
  // Try each endpoint until one works or we run out of options
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const rpcUrl = getReliableDasEndpoint();
      
      if (!rpcUrl) {
        continue; // Skip to next attempt if no URL is available
      }
      
      console.log(`Attempting to fetch metadata using endpoint: ${rpcUrl}`);
      
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

      if (!response.ok) {
        if (response.status === 403) {
          console.warn(`Endpoint ${rpcUrl} returned 403 Forbidden`);
          markDasEndpointFailed(rpcUrl);
          continue; // Try next endpoint
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { result, error } = await response.json();
      
      if (error) {
        console.error('DAS API Error:', error);
        
        // If it's a rate limit or access error, mark this endpoint as failed
        if (error.code === 403 || error.message?.includes('forbidden') || error.message?.includes('rate limit')) {
          console.warn(`Endpoint ${rpcUrl} returned error: ${error.message}`);
          markDasEndpointFailed(rpcUrl);
          continue; // Try next endpoint
        }
        
        return NextResponse.json([]);
      }
      
      // If we got here, the request was successful
      console.log(`Successfully fetched metadata using endpoint: ${rpcUrl}`);
      
      const metadata = result.map((asset: any) => {
        try {
          const image = asset.content?.links?.image;
          const imageUri = image ? (image.startsWith('http') ? image : `https://${image}`) : null;
          return {
            mint: asset.id,
            name: asset.content?.metadata?.name || 'Unknown',
            symbol: asset.content?.metadata?.symbol || '???',
            image: imageUri
          };
        } catch (parseError) {
          console.error('Error parsing asset:', parseError);
          return {
            mint: asset.id || '',
            name: 'Unknown',
            symbol: '???',
            image: null
          };
        }
      }).filter(Boolean);

      return NextResponse.json(metadata);
    } catch (error) {
      console.error(`Error fetching metadata (attempt ${attempt + 1}):`, error);
      // Continue to next attempt
    }
  }
  
  // If we've exhausted all attempts, return empty array rather than error
  // This allows the UI to continue functioning even if metadata can't be fetched
  console.error('Failed to fetch token metadata after multiple attempts');
  return NextResponse.json([]);
}
