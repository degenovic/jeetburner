import { Connection, type Commitment } from '@solana/web3.js';

export function getRpcUrl(): string {
  const endpoint = process.env.NEXT_PUBLIC_MAINNET_RPC_URL;
  if (!endpoint) throw new Error('Missing NEXT_PUBLIC_MAINNET_RPC_URL in environment variables');
  return endpoint;
}

export const connection = new Connection(getRpcUrl(), {
  commitment: 'confirmed' as Commitment,
  httpHeaders: {
    'Content-Type': 'application/json',
  }
});
