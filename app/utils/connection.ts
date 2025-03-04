import { Connection, type Commitment, type ConnectionConfig } from '@solana/web3.js';

export function getRpcUrl(): string {
  const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
  if (!apiKey) throw new Error('Missing HELIUS_API_KEY in environment variables');
  return `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
}

export const connection = new Connection(getRpcUrl(), {
  commitment: 'confirmed' as Commitment,
  httpHeaders: {
    'Content-Type': 'application/json',
    'Helius-Request-Source': 'jeetburner-app'
  }
});
