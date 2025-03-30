import { PublicKey, Transaction, TransactionInstruction, Connection } from '@solana/web3.js';

// Add TypeScript declaration for window.trustwallet
declare global {
  interface Window {
    trustwallet?: any;
    solana?: any;
  }
}

export const getProvider = () => {
  // First check for standard window.solana interface with Trust Wallet identifier
  if (window.solana && (window.solana.isTrust || window.solana.isTrustWallet)) {
    return window.solana;
  }
  
  // Check for Trust Wallet's specific interface
  if ('trustwallet' in window && window.trustwallet?.solana) {
    return window.trustwallet.solana;
  }
  
  // Trust Wallet mobile app might inject differently
  if (window.solana && !window.solana.isPhantom && !window.solana.isSolflare && 
      !window.solana.isCoin98 && !window.solana.isSlope) {
    // If no specific identifier but it's not another known wallet, it might be Trust Wallet
    return window.solana;
  }
  
  throw new Error('Trust Wallet not found! Please install Trust Wallet app or extension.');
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
    
    let signature;
    
    // Try different signing methods depending on what Trust Wallet supports
    // Method 1: Using signAndSendTransaction (most common for Trust Wallet)
    if (provider.signAndSendTransaction) {
      const result = await provider.signAndSendTransaction(transaction, options);
      signature = typeof result === 'object' ? result.signature : result;
    }
    // Method 2: Using signTransaction and connection.sendRawTransaction
    else if (provider.signTransaction) {
      const signedTx = await provider.signTransaction(transaction);
      signature = await connection.sendRawTransaction(signedTx.serialize(), options);
    }
    // Method 3: Using signAllTransactions (fallback)
    else if (provider.signAllTransactions) {
      const signedTx = (await provider.signAllTransactions([transaction]))[0];
      signature = await connection.sendRawTransaction(signedTx.serialize(), options);
    }
    // No supported method found
    else {
      throw new Error('Trust Wallet does not support any known transaction signing methods');
    }
    
    // Return the transaction signature
    return signature;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};
