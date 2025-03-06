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
    // Create a new transaction
    const transaction = new Transaction().add(...instructions);
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = provider.publicKey;
    
    // Send transaction exactly as shown in Phantom docs
    const { signature } = await provider.signAndSendTransaction(transaction);
    
    return signature;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};
