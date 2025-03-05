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
    // Let Phantom create and handle the transaction
    const { signature } = await provider.signAndSendTransaction({
      instructions
    });
    return signature;
  } catch (error) {
    console.error('Error signing and sending transaction:', error);
    throw error;
  }
};
