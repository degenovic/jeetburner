import { Transaction, TransactionInstruction, Connection, PublicKey } from '@solana/web3.js';

export const getProvider = () => {
  if ('phantom' in window) {
    const provider = (window as any).phantom?.solana;
    if (provider?.isPhantom) {
      return provider;
    }
  }
  throw new Error('Phantom wallet not found!');
};

export const signAndSendTransaction = async (
  provider: any,
  instructions: TransactionInstruction[],
  connection: Connection
) => {
  try {
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    
    // Create a minimal transaction object with just the required fields
    // This approach gives Phantom maximum control and space for Lighthouse
    const transactionPayload = {
      instructions: instructions,
      recentBlockhash: blockhash,
      feePayer: provider.publicKey
    };
    
    // Send transaction using the payload directly
    // This allows Phantom to construct the final transaction with security guards
    const { signature } = await provider.signAndSendTransaction(transactionPayload);
    
    return signature;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};
