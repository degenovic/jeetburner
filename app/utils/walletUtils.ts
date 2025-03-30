import { PublicKey, Transaction, TransactionInstruction, Connection } from '@solana/web3.js';
import * as phantomUtils from './phantom';
import * as solflareUtils from './solflare';
import * as trustwalletUtils from './trustwallet';
import * as backpackUtils from './backpack';
import * as coinbaseUtils from './coinbase';
import * as coin98Utils from './coin98';
import * as slopeUtils from './slope';

// Add TypeScript declarations for wallet extensions in window object
declare global {
  interface Window {
    solana?: any;
    phantom?: any;
    solflare?: any;
    trustwallet?: any;
    backpack?: any;
    xnft?: any;
    coinbaseWalletExtension?: any;
    coin98?: any;
    Slope?: any;
  }
}

// Wallet types for identification
export enum WalletType {
  PHANTOM = 'phantom',
  SOLFLARE = 'solflare',
  TRUSTWALLET = 'trustwallet',
  BACKPACK = 'backpack',
  COINBASE = 'coinbase',
  COIN98 = 'coin98',
  SLOPE = 'slope',
  UNKNOWN = 'unknown'
}

// Detect which wallet is available/connected
export const detectWalletType = (): WalletType => {
  // First check if window.solana exists, which is the standard interface
  if (window.solana) {
    // Check for specific wallet identifiers in the standard interface
    if (window.solana.isPhantom) return WalletType.PHANTOM;
    if (window.solana.isSolflare) return WalletType.SOLFLARE;
    
    // Trust Wallet detection - prioritize this check to ensure Trust Wallet works
    if (window.solana.isTrust || window.solana.isTrustWallet) return WalletType.TRUSTWALLET;
    
    // Check for other wallets
    if (window.solana.isBackpack) return WalletType.BACKPACK;
    if (window.solana.isCoinbaseWallet) return WalletType.COINBASE;
    if (window.solana.isCoin98) return WalletType.COIN98;
    if (window.solana.isSlope) return WalletType.SLOPE;
    
    // If no specific identifier but window.solana exists, check for Trust Wallet first
    // Trust Wallet sometimes doesn't set the isTrust flag properly
    try {
      // Trust Wallet might have specific methods or properties
      if (window.solana.version && window.solana.version.includes('trust')) {
        return WalletType.TRUSTWALLET;
      }
      
      // If it's not another known wallet, it might be Trust Wallet
      if (!window.solana.isPhantom && !window.solana.isSolflare && 
          !window.solana.isCoin98 && !window.solana.isSlope) {
        return WalletType.TRUSTWALLET;
      }
    } catch (e) {
      // Ignore errors in detection
    }
    
    // Most wallets will work with the standard interface
    return WalletType.UNKNOWN;
  }
  
  // Check for non-standard interfaces
  if ('phantom' in window && window.phantom?.solana) return WalletType.PHANTOM;
  if ('solflare' in window && window.solflare) return WalletType.SOLFLARE;
  
  // Special check for Trust Wallet's specific interface
  if ('trustwallet' in window) {
    if (window.trustwallet?.solana) return WalletType.TRUSTWALLET;
    // Trust Wallet might expose its interface differently
    if (window.trustwallet?.ethereum?.isTrust) return WalletType.TRUSTWALLET;
  }
  
  if ('backpack' in window && window.backpack?.solana) return WalletType.BACKPACK;
  if ('xnft' in window && window.xnft?.solana) return WalletType.BACKPACK;
  if ('coinbaseWalletExtension' in window && window.coinbaseWalletExtension?.solana) return WalletType.COINBASE;
  if ('coin98' in window && window.coin98?.sol) return WalletType.COIN98;
  if ('Slope' in window && window.Slope) return WalletType.SLOPE;
  
  // No wallet detected
  return WalletType.UNKNOWN;
};

// Get the appropriate wallet provider based on detected wallet type
export const getProvider = () => {
  // First try to get the standard window.solana provider which works with most wallets
  if (window.solana) {
    return window.solana;
  }
  
  // If window.solana is not available, try specific wallet providers
  const walletType = detectWalletType();
  
  try {
    switch (walletType) {
      case WalletType.PHANTOM:
        return window.phantom?.solana;
      case WalletType.SOLFLARE:
        return window.solflare;
      case WalletType.TRUSTWALLET:
        return window.trustwallet?.solana;
      case WalletType.BACKPACK:
        return window.backpack?.solana || window.xnft?.solana;
      case WalletType.COINBASE:
        return window.coinbaseWalletExtension?.solana;
      case WalletType.COIN98:
        return window.coin98?.sol;
      case WalletType.SLOPE:
        return new window.Slope();
      default:
        throw new Error('No compatible wallet found. Please install a supported wallet extension.');
    }
  } catch (error) {
    console.error('Error getting wallet provider:', error);
    throw error;
  }
};

// Universal transaction signing function that works with all wallet types
export const signAndSendTransaction = async (
  instructions: TransactionInstruction[],
  connection: Connection
) => {
  const provider = getProvider();
  
  if (!provider) {
    throw new Error('No wallet provider found');
  }
  
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
      signature = typeof result === 'object' ? result.signature : result;
    }
    // Method 2: Using signTransaction and connection.sendRawTransaction
    else if (provider.signTransaction) {
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
