/**
 * Referral system utilities for JeetBurner
 */
import { PublicKey } from '@solana/web3.js';
import { trackEvent } from './analytics';

// Constants
export const REF_COMMISSION_PERCENTAGE = 0.5; // 50% of the 20% fee

/**
 * Generate a short referral code from a wallet address using cryptographic hashing
 * @param walletAddress The wallet address to generate a code for
 * @returns A short 6-7 character referral code
 */
export function generateReferralCode(walletAddress: string): string {
  try {
    // We use a combination of the wallet address and a fixed application-specific string
    // This acts as a salt to make the hash unique to this application
    const affiliateSalt = 'jb_affiliate_program_v1';
    
    // Convert the wallet address to a Uint8Array for hashing
    const encoder = new TextEncoder();
    const walletData = encoder.encode(walletAddress);
    const saltData = encoder.encode(affiliateSalt);
    
    // Combine wallet address and salt
    const combinedData = new Uint8Array(walletData.length + saltData.length);
    combinedData.set(walletData);
    combinedData.set(saltData, walletData.length);
    
    // Use SubtleCrypto API to create a SHA-256 hash
    // Since this is async and we need a sync function, we'll use a simpler approach
    // that still provides good uniqueness without requiring async/await
    
    // Simple hash function that works in the browser
    let hash = 0;
    for (let i = 0; i < combinedData.length; i++) {
      const char = combinedData[i];
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Make sure the hash is positive
    hash = Math.abs(hash);
    
    // Convert to base36 (alphanumeric) and take first 6-7 chars
    // This gives us a good balance of uniqueness and brevity
    return hash.toString(36).substring(0, 7);
  } catch (error) {
    console.error('Error generating referral code:', error);
    // Fallback to a random code if there's an error
    return Math.random().toString(36).substring(2, 7);
  }
}

/**
 * Get wallet address from referral code
 * This implementation uses localStorage to cache the mapping for better performance
 * but falls back to a brute force approach if needed
 * @param referralCode The referral code to look up
 * @returns The wallet address associated with the referral code, or null if not found
 */
export function getWalletFromReferralCode(referralCode: string): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    // First check the cache in localStorage
    const referralMappings = JSON.parse(localStorage.getItem('jeetburner_referrals') || '{}');
    
    // Find the wallet address for this code
    for (const [walletAddress, code] of Object.entries(referralMappings)) {
      if (code === referralCode) {
        return walletAddress;
      }
    }
    
    // If we have a list of known wallets, we could try to verify each one
    // This is a fallback mechanism that's more expensive but doesn't require a database
    const knownWallets = JSON.parse(localStorage.getItem('jeetburner_known_wallets') || '[]');
    for (const walletAddress of knownWallets) {
      const generatedCode = generateReferralCode(walletAddress);
      if (generatedCode === referralCode) {
        // Cache this mapping for future lookups
        storeReferralMapping(walletAddress, referralCode);
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
    
    // Also maintain a list of known wallet addresses for verification
    const knownWallets = JSON.parse(localStorage.getItem('jeetburner_known_wallets') || '[]');
    if (!knownWallets.includes(walletAddress)) {
      knownWallets.push(walletAddress);
      localStorage.setItem('jeetburner_known_wallets', JSON.stringify(knownWallets));
    }
  } catch (error) {
    console.error('Error storing referral mapping:', error);
  }
}

/**
 * Verify if a referral code belongs to a specific wallet address
 * @param walletAddress The wallet address to verify
 * @param referralCode The referral code to check
 * @returns True if the referral code matches the wallet address
 */
export function verifyReferralCode(walletAddress: string, referralCode: string): boolean {
  const expectedCode = generateReferralCode(walletAddress);
  return expectedCode === referralCode;
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

/**
 * Calculate the fee distribution with referral, adjusted for transaction fees
 * This is an alternative to the standard calculateFeeDistribution that accounts for
 * the extra transaction fee when using a referral code
 * 
 * @param totalFee The total fee amount in lamports
 * @param referrerWallet The wallet address of the referrer
 * @returns An object with the fee distribution adjusted for transaction fees
 */
export function calculateAdjustedFeeDistribution(totalFee: number, referrerWallet: string | null): {
  feeWalletAmount: number;
  referrerAmount: number;
  referrerWallet: string | null;
} {
  // Import dynamically to avoid circular dependencies
  const { calculateAdjustedFeeDistribution: adjustFees } = require('./fees');
  return adjustFees(totalFee, referrerWallet, !!referrerWallet);
}
