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
    // Create a transaction
    const transaction = new Transaction();
    
    // Get latest blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = provider.publicKey;
    
    // Add instructions - leave space at the beginning for Lighthouse
    // Add a dummy instruction that Phantom can replace with security checks
    const dummyInstruction = new TransactionInstruction({
      keys: [],
      programId: PublicKey.default,
      data: Buffer.from([])
    });
    
    // Add dummy instruction first, then our actual instructions
    transaction.add(dummyInstruction);
    instructions.forEach(instruction => transaction.add(instruction));
    
    // Send to Phantom WITHOUT signing it ourselves
    const { signature } = await provider.signAndSendTransaction(transaction);
    
    return signature;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};
