/**
 * Referral system utilities for JeetBurner
 */
import { PublicKey } from '@solana/web3.js';
import { trackEvent } from './analytics';

// Constants
export const REF_COMMISSION_PERCENTAGE = 0.5; // 50% of the 20% fee

/**
 * Generate a short referral code from a wallet address
 * @param walletAddress The wallet address to generate a code for
 * @returns A short 6-7 character referral code
 */
export function generateReferralCode(walletAddress: string): string {
  try {
    // Take the first 3 chars and last 3 chars from the wallet address
    // This creates a 6 character code that is unique to the wallet
    const firstChars = walletAddress.substring(0, 3);
    const lastChars = walletAddress.substring(walletAddress.length - 3);
    return `${firstChars}${lastChars}`;
  } catch (error) {
    console.error('Error generating referral code:', error);
    // Fallback to a random code if there's an error
    return Math.random().toString(36).substring(2, 8);
  }
}

/**
 * Get wallet address from referral code
 * This is a simple implementation that stores the mapping in localStorage
 * @param referralCode The referral code to look up
 * @returns The wallet address associated with the referral code, or null if not found
 */
export function getWalletFromReferralCode(referralCode: string): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // Get the referral mappings from localStorage
    const referralMappings = JSON.parse(localStorage.getItem('jeetburner_referrals') || '{}');
    
    // Find the wallet address for this code
    for (const [walletAddress, code] of Object.entries(referralMappings)) {
      if (code === referralCode) {
        return walletAddress;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting wallet from referral code:', error);
    return null;
  }
}

/**
 * Store a referral code mapping in localStorage
 * @param walletAddress The wallet address
 * @param referralCode The referral code
 */
export function storeReferralMapping(walletAddress: string, referralCode: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Get existing mappings
    const referralMappings = JSON.parse(localStorage.getItem('jeetburner_referrals') || '{}');
    
    // Add or update this mapping
    referralMappings[walletAddress] = referralCode;
    
    // Save back to localStorage
    localStorage.setItem('jeetburner_referrals', JSON.stringify(referralMappings));
  } catch (error) {
    console.error('Error storing referral mapping:', error);
  }
}

/**
 * Get the referrer wallet address from the URL query parameter
 * @returns The referrer wallet address or null if not found
 */
export function getReferrerFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (!refCode) return null;
    
    return getWalletFromReferralCode(refCode);
  } catch (error) {
    console.error('Error getting referrer from URL:', error);
    return null;
  }
}

/**
 * Track a referral visit in analytics
 * @param referrerWallet The wallet address of the referrer
 */
export function trackReferralVisit(referrerWallet: string): void {
  trackEvent('referral_visit', {
    event_category: 'referral',
    event_label: referrerWallet,
    value: 1
  });
}

/**
 * Calculate the fee distribution with referral
 * @param totalFee The total fee amount in lamports
 * @param referrerWallet The wallet address of the referrer
 * @returns An object with the fee distribution
 */
export function calculateFeeDistribution(totalFee: number, referrerWallet: string | null): {
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
  const referrerAmount = Math.floor(totalFee * REF_COMMISSION_PERCENTAGE);
  const feeWalletAmount = totalFee - referrerAmount;

  return {
    feeWalletAmount,
    referrerAmount,
    referrerWallet
  };
}
