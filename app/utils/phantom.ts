import { Transaction, TransactionInstruction, Connection } from '@solana/web3.js';

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
    // Create a transaction but don't set blockhash or feePayer
    // This leaves it "unsigned" for Phantom to handle
    const transaction = new Transaction();
    
    // Add instructions
    instructions.forEach(instruction => transaction.add(instruction));
    
    // Let Phantom handle the rest (blockhash, feePayer, signing)
    const { signature } = await provider.signAndSendTransaction(transaction);
    
    return signature;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};
