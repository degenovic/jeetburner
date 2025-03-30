import { PublicKey, Transaction, TransactionInstruction, Connection } from '@solana/web3.js';

// Add TypeScript declaration for window.coinbaseWalletExtension
declare global {
  interface Window {
    coinbaseWalletExtension?: any;
  }
}

export const getProvider = () => {
  // Check for Coinbase Wallet in the window object
  if ('coinbaseWalletExtension' in window) {
    const provider = window.coinbaseWalletExtension?.solana;
    if (provider) {
      return provider;
    }
  }
  
  // Coinbase may also inject as solana
  if (window.solana && !window.solana.isPhantom && !window.solana.isSolflare) {
    // Check if it's likely Coinbase Wallet
    if (window.solana.isCoinbaseWallet) {
      return window.solana;
    }
  }
  
  throw new Error('Coinbase Wallet not found! Please install Coinbase Wallet extension.');
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
    
    // Send transaction using Coinbase Wallet's signAndSendTransaction
    const { signature } = await provider.signAndSendTransaction(transaction);
    
    // Return the transaction signature
    return signature;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};
