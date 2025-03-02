import { Connection, type Commitment, type ConnectionConfig } from '@solana/web3.js';

export const getRpcUrl = () => {
  const endpoint = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';
  if (!endpoint?.startsWith('http')) {
    throw new Error('Invalid RPC URL configuration. URL must start with http:// or https://');
  }
  return endpoint;
};

export const getConnection = (config?: Commitment | ConnectionConfig) => {
  return new Connection(getRpcUrl(), config || { commitment: 'confirmed' });
};
