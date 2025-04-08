import { LAMPORTS_PER_SOL, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { connection } from './connection';
import { estimateTransactionFee } from './phantom';

// Constants
export const TRANSACTION_FEE = 2500; // 0.0000025 SOL per signature (minimum base fee)
export const PRIORITY_FEE = 1; // Minimum priority fee (1 microlamport)
export const ACCOUNT_RENT_EXEMPTION = 0.00089088 * LAMPORTS_PER_SOL; // Approximate rent exemption for token accounts

// Buffer multiplier for fee estimation (to account for potential fee increases)
export const FEE_BUFFER_MULTIPLIER = 1.2; // Reduced buffer since we're using minimum fees

/**
 * Calculates the fee distribution and records referral earnings in the database
 * 
 * @param totalFee The total fee amount in lamports
 * @param referrerWallet The wallet address of the referrer
 * @param burnTx The transaction hash of the burn
 * @returns The fee wallet amount (referral amount is stored in db)
 */
export async function calculateFeeDistribution(
  totalFee: number,
  referrerWallet: string | null,
  burnTx: string
): Promise<number> {
  if (!referrerWallet) {
    return totalFee;
  }

  // Calculate the referrer's share (50% of the fee)
  const referrerAmount = Math.floor(totalFee * 0.5);
  const feeWalletAmount = totalFee - referrerAmount;

  // Record the referral earning in the database
  try {
    await fetch('/api/referrals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        referrerWallet,
        amount: referrerAmount,
        burnTx,
      }),
    });
  } catch (error) {
    console.error('Failed to record referral earning:', error);
    // If we fail to record the earning, give the full amount to the fee wallet
    return totalFee;
  }

  return feeWalletAmount;
}

/**
 * Estimates if a wallet has enough SOL to cover transaction fees
 * 
 * @param walletBalance The wallet balance in lamports
 * @param numInstructions The number of instructions in the transaction
 * @param hasReferral Whether a referral code is being used
 * @returns Boolean indicating if the wallet has enough SOL
 */
export function hasEnoughSolForFees(
  walletBalance: number,
  numInstructions: number,
  hasReferral: boolean = false
): boolean {
  // Base transaction fee for signatures
  const baseFee = TRANSACTION_FEE;
  
  // Calculate total fees based on number of instructions
  // With referral: account close + 2 transfers = 3 instructions
  // Without referral: account close + 1 transfer = 2 instructions
  const totalInstructions = hasReferral ? numInstructions + 1 : numInstructions;
  
  // Calculate estimated fees with minimal values
  // 1. Base fee per signature (2500 lamports)
  // 2. Each instruction adds approximately 200 lamports
  // 3. Priority fee for the transaction (1 microlamport)
  const estimatedFees = (baseFee * 2) + (totalInstructions * 200) + PRIORITY_FEE;
  
  // Add a small buffer for safety
  // Using 0.000005 SOL (5,000 lamports) as buffer
  const safetyBuffer = 0.000005 * LAMPORTS_PER_SOL;
  
  return walletBalance >= (estimatedFees + safetyBuffer);
}

/**
 * Calculate the fee distribution with referral, adjusted for transaction fees
 * This handles the database-based referral system
 * 
 * @param totalFee The total fee amount in lamports
 * @param referrerWallet The wallet address of the referrer
 * @param hasReferral Whether a referral code is being used
 * @returns An object with the fee distribution adjusted for transaction fees
 */
export function calculateAdjustedFeeDistribution(
  totalFee: number,
  referrerWallet: string | null,
  hasReferral: boolean = false
): {
  feeWalletAmount: number;
  referrerAmount: number;
  referrerWallet: string | null;
} {
  if (!referrerWallet) {
    return {
      feeWalletAmount: totalFee,
      referrerAmount: 0,
      referrerWallet: null
    };
  }

  // Calculate the referrer's share (50% of the fee)
  const referrerAmount = Math.floor(totalFee * 0.5);
  const feeWalletAmount = totalFee - referrerAmount;

  // For the database-based referral system, we're not actually sending SOL directly to the referrer
  // We're recording it in the database, so we need to return all the fee to the fee wallet
  return {
    feeWalletAmount: totalFee, // Send all fees to fee wallet
    referrerAmount: 0,          // No direct transfer to referrer
    referrerWallet             // Keep track of referrer for database recording
  };
}
