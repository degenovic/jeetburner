import { Transaction, TransactionInstruction, Connection, PublicKey, SystemProgram } from '@solana/web3.js';

// Add TypeScript declaration for window.solana
declare global {
  interface Window {
    solana?: any;
  }
}

// Lighthouse Program ID
const LIGHTHOUSE_PROGRAM_ID = new PublicKey('LighsJ8LY3Wp3J2EwJHBqPrSNFQJJZQvKbHegGpeDf5');

export const getProvider = () => {
  // Check for Phantom in the window object
  if ('phantom' in window) {
    const provider = (window as any).phantom?.solana;
    if (provider?.isPhantom) {
      return provider;
    }
  }
  
  // Check for Solana in the window object (alternate detection method)
  if (window.solana?.isPhantom) {
    return window.solana;
  }
  
  throw new Error('Phantom wallet not found! Please install Phantom wallet extension.');
};

// Create a Lighthouse assertion instruction to protect against balance draining
export const createBalanceProtectionInstruction = (
  walletAddress: PublicKey,
  expectedMinBalance: number
): TransactionInstruction => {
  // This is a simplified version of a Lighthouse assertion
  // In a real implementation, you would use the Lighthouse SDK
  
  // The data layout for a basic lamports assertion
  const data = Buffer.from([
    0x01, // Instruction type for AccountInfo assertion
    0x00, // Assertion type for Lamports
    ...new Uint8Array(new BigUint64Array([BigInt(expectedMinBalance)]).buffer), // Expected minimum balance
    0x03, // Operator: GreaterThanOrEqual
  ]);
  
  return new TransactionInstruction({
    keys: [
      { pubkey: walletAddress, isSigner: false, isWritable: false },
    ],
    programId: LIGHTHOUSE_PROGRAM_ID,
    data,
  });
};

export const signAndSendTransaction = async (
  provider: any,
  instructions: TransactionInstruction[],
  connection: Connection,
  protectWallet: boolean = true
) => {
  try {
    // Create a new transaction
    const transaction = new Transaction();
    
    // Add instructions to the transaction
    transaction.add(...instructions);
    
    // If protection is enabled, add a balance protection assertion
    if (protectWallet) {
      try {
        // Get current balance
        const balance = await connection.getBalance(provider.publicKey);
        
        // Calculate expected minimum balance (current balance minus a reasonable fee buffer)
        const expectedMinBalance = balance - 100000; // 0.0001 SOL buffer for fees
        
        // Add the Lighthouse assertion instruction
        const protectionInstruction = createBalanceProtectionInstruction(
          provider.publicKey,
          expectedMinBalance
        );
        
        transaction.add(protectionInstruction);
      } catch (error) {
        console.warn('Could not add balance protection:', error);
        // Continue without the protection if it fails
      }
    }
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = provider.publicKey;
    
    // Set transaction options to ensure space for Lighthouse guard instructions
    const options = {
      skipPreflight: false,  // Enable preflight checks
      maxRetries: 3,         // Allow retries if needed
    };
    
    // Send transaction using Phantom's signAndSendTransaction
    const { signature } = await provider.signAndSendTransaction(transaction, options);
    
    return signature;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};
