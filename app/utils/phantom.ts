import { Transaction, Connection, PublicKey, TransactionMessage, VersionedTransaction } from '@solana/web3.js';

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
  instructions: any[],
  connection: Connection,
  feePayer: PublicKey
) => {
  try {
    // Get latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    
    // Create v0 compatible message
    const messageV0 = new TransactionMessage({
      payerKey: feePayer,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();
    
    // Create versioned transaction
    const transaction = new VersionedTransaction(messageV0);
    
    // Sign and send the transaction
    const { signature } = await provider.signAndSendTransaction(transaction);
    return signature;
  } catch (error) {
    console.error('Error signing and sending transaction:', error);
    throw error;
  }
};
