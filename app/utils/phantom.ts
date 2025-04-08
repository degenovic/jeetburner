import { 
  Transaction, 
  TransactionInstruction, 
  Connection, 
  PublicKey,
  Commitment
} from '@solana/web3.js';

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
    // Get the latest blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    
    // Create a new transaction
    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = provider.publicKey;
    
    // Add all instructions to the transaction
    instructions.forEach(instruction => {
      transaction.add(instruction);
    });
    
    // Set transaction options with minimal preflight checks
    const options = {
      skipPreflight: true, // Skip preflight to reduce fees
      maxRetries: 1,
      preflightCommitment: 'processed' as Commitment // Use 'processed' instead of 'confirmed' for faster processing
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
      signature = await connection.sendRawTransaction(signedTx.serialize(), options);
    }
    // Method 3: Using signAllTransactions (some wallets only support this)
    else if (provider.signAllTransactions) {
      const signedTx = (await provider.signAllTransactions([transaction]))[0];
      signature = await connection.sendRawTransaction(signedTx.serialize(), options);
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

/**
 * Estimates the transaction fee for a given set of instructions
 * This can be used to check if a wallet has enough SOL before attempting a transaction
 * 
 * @param connection The Solana connection
 * @param instructions The transaction instructions
 * @param feePayer The public key of the fee payer
 * @returns The estimated transaction fee in lamports
 */
export const estimateTransactionFee = async (
  connection: Connection,
  instructions: TransactionInstruction[],
  feePayer: PublicKey
): Promise<number> => {
  try {
    // Create a transaction with the instructions
    const transaction = new Transaction();
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = feePayer;
    
    // Add all instructions
    instructions.forEach(instruction => {
      transaction.add(instruction);
    });
    
    // Get the fee for the transaction
    const fee = await transaction.getEstimatedFee(connection);
    
    // Add a buffer to account for potential fee increases (50% buffer)
    return Math.ceil((fee || 5000) * 1.5); // Default to 5000 lamports if fee is null
  } catch (error) {
    console.error('Error estimating transaction fee:', error);
    // Return a default high estimate if estimation fails
    return 15000; // 0.000015 SOL as a safe default
  }
};
