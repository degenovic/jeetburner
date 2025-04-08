import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';

/**
 * Creates a fee transfer instruction to the developer fee wallet
 * 
 * @param fromPubkey The wallet paying the fee
 * @param feeWallet The developer fee wallet
 * @param feeWalletAmount The amount to send to the developer fee wallet
 * @returns A transaction instruction for the fee transfer
 */
export function createCombinedFeeTransferInstructions(
  fromPubkey: PublicKey,
  feeWallet: PublicKey,
  feeWalletAmount: number,
  referrerWallet: PublicKey | null = null,
  referrerAmount: number = 0
): TransactionInstruction[] {
  const instructions: TransactionInstruction[] = [];
  
  // Only create a transfer to the fee wallet
  // Referral earnings are now handled off-chain via database
  if (feeWalletAmount > 0) {
    instructions.push(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey: feeWallet,
        lamports: feeWalletAmount
      })
    );
  }
  
  return instructions;
}
