import { Transaction, Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';

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
  instructions: TransactionInstruction[]
) => {
  try {
    // Create a new transaction and add instructions
    const transaction = new Transaction();
    instructions.forEach(instruction => transaction.add(instruction));
    
    // Let Phantom handle the rest (blockhash, signing, etc)
    const { signature } = await provider.signAndSendTransaction(transaction);
    return signature;
  } catch (error) {
    console.error('Error signing and sending transaction:', error);
    throw error;
  }
};
