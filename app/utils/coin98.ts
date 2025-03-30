import { PublicKey, Transaction, TransactionInstruction, Connection } from '@solana/web3.js';

export const getProvider = () => {
  // Check for Coin98 in the window object
  if ('coin98' in window) {
    const provider = (window as any).coin98?.sol;
    if (provider) {
      return provider;
    }
  }
  
  // Coin98 may also inject as solana
  if (window.solana && !window.solana.isPhantom && !window.solana.isSolflare) {
    // Check if it's likely Coin98 Wallet
    if (window.solana.isCoin98) {
      return window.solana;
    }
  }
  
  throw new Error('Coin98 Wallet not found! Please install Coin98 Wallet extension.');
};

export const signAndSendTransaction = async (
  provider: any,
  instructions: TransactionInstruction[],
  connection: Connection
) => {
  try {
    // Create a new transaction
    const transaction = new Transaction();
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = provider.publicKey;
    
    // Add instructions to transaction
    instructions.forEach(instruction => {
      transaction.add(instruction);
    });
    
    // Set transaction options
    const options = {
      skipPreflight: false,
      maxRetries: 3
    };
    
    // Send transaction using Coin98's signAndSendTransaction
    const { signature } = await provider.signAndSendTransaction(transaction);
    
    // Return the transaction signature
    return signature;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};
