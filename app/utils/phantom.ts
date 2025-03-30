import { Transaction, TransactionInstruction, Connection, PublicKey } from '@solana/web3.js';

// Add TypeScript declaration for window.solana
declare global {
  interface Window {
    solana?: any;
    phantom?: any;
  }
}

export const getProvider = () => {
  // Check for any wallet in the window object
  if (window.solana) {
    return window.solana;
  }
  
  // Check for Phantom in the window object
  if ('phantom' in window && window.phantom?.solana) {
    return window.phantom.solana;
  }
  
  throw new Error('No wallet detected! Please install a Solana wallet extension.');
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
    
    // Try different signing methods depending on what the wallet supports
    let signature;
    
    // Method 1: Using signAndSendTransaction (most wallets support this)
    if (provider.signAndSendTransaction) {
      const result = await provider.signAndSendTransaction(transaction, options);
      signature = result.signature || result;
    }
    // Method 2: Using signTransaction and sendTransaction separately
    else if (provider.signTransaction && provider.sendTransaction) {
      const signedTx = await provider.signTransaction(transaction);
      signature = await connection.sendRawTransaction(signedTx.serialize());
    }
    // Method 3: Using signAllTransactions (some wallets only support this)
    else if (provider.signAllTransactions) {
      const signedTx = (await provider.signAllTransactions([transaction]))[0];
      signature = await connection.sendRawTransaction(signedTx.serialize());
    }
    // No supported method found
    else {
      throw new Error('Wallet does not support any known transaction signing methods');
    }
    
    // Return the transaction signature
    return signature;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};
