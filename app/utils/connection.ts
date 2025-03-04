import { Connection, type Commitment, type ConnectionConfig } from '@solana/web3.js';

// List of reliable RPC endpoints to use as fallbacks, with Helius prioritized
const RPC_ENDPOINTS = [
  process.env.NEXT_PUBLIC_RPC_URL, // Helius endpoint (primary)
  'https://api.mainnet-beta.solana.com',
  'https://solana-mainnet.rpc.extrnode.com',
  'https://solana.public-rpc.com',
  'https://rpc.ankr.com/solana'
];

// Track failed endpoints to avoid retrying them immediately
let failedEndpoints: Record<string, number> = {};
let currentEndpointIndex = 0;

export const getRpcUrl = () => {
  // Check if we have a Helius endpoint configured
  const heliusEndpoint = process.env.NEXT_PUBLIC_RPC_URL;
  
  // If Helius endpoint is available and hasn't failed recently, prioritize it
  if (heliusEndpoint && heliusEndpoint.startsWith('http')) {
    const failedTime = failedEndpoints[heliusEndpoint];
    const now = Date.now();
    
    // If the Helius endpoint hasn't failed recently or the failure was more than 10 minutes ago, use it
    if (!failedTime || now - failedTime > 10 * 60 * 1000) {
      return heliusEndpoint;
    }
  }
  
  // Filter out undefined/null endpoints and those that don't start with http
  const validEndpoints = RPC_ENDPOINTS.filter(
    endpoint => endpoint && endpoint.startsWith('http')
  ) as string[];  // Cast to string[] to ensure TypeScript knows these are all strings

  if (validEndpoints.length === 0) {
    throw new Error('No valid RPC endpoints available. Please check your configuration.');
  }

  // Try to find an endpoint that hasn't failed recently
  const now = Date.now();
  for (let i = 0; i < validEndpoints.length; i++) {
    const index = (currentEndpointIndex + i) % validEndpoints.length;
    const endpoint = validEndpoints[index];
    
    // Since we've filtered the array, we know endpoint is defined
    // Skip endpoints that failed in the last 5 minutes
    const failedTime = failedEndpoints[endpoint];
    if (failedTime && now - failedTime < 5 * 60 * 1000) {
      continue;
    }
    
    currentEndpointIndex = index;
    return endpoint;
  }

  // If all endpoints have failed recently, use the next one in rotation
  currentEndpointIndex = (currentEndpointIndex + 1) % validEndpoints.length;
  return validEndpoints[currentEndpointIndex];
};

export const markEndpointFailed = (endpoint: string) => {
  if (!endpoint) return; // Guard against undefined endpoints
  
  console.warn(`Marking RPC endpoint as failed: ${endpoint}`);
  failedEndpoints[endpoint] = Date.now();
};

export const getConnection = (config?: Commitment | ConnectionConfig) => {
  return new Connection(getRpcUrl(), config || { 
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000 // Increase timeout to 60 seconds
  });
};

// Helper function to get a new connection if the current one fails
export const getReliableConnection = async (config?: Commitment | ConnectionConfig) => {
  let connection = getConnection(config);
  
  try {
    // Test the connection with a simple request
    await connection.getLatestBlockhash();
    return connection;
  } catch (error) {
    console.warn('RPC connection failed, trying fallback endpoint');
    
    // Mark the current endpoint as failed
    markEndpointFailed(connection.rpcEndpoint);
    
    // Get a new connection with a different endpoint
    connection = getConnection(config);
    return connection;
  }
};
