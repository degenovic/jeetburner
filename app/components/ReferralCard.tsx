'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { generateReferralCode, storeReferralMapping, verifyReferralCode } from '../utils/referral';
import { trackEvent } from '../utils/analytics';

export function ReferralCard() {
  const { publicKey, connected } = useWallet();
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralLink, setReferralLink] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  // Generate referral code when wallet is connected
  useEffect(() => {
    if (connected && publicKey) {
      const walletAddress = publicKey.toString();
      const code = generateReferralCode(walletAddress);
      setReferralCode(code);
      
      // Verify the code works correctly
      const isValid = verifyReferralCode(walletAddress, code);
      if (!isValid) {
        console.error('Referral code verification failed');
      }
      
      // Store the mapping
      storeReferralMapping(walletAddress, code);
      
      // Generate the full referral link
      const baseUrl = window.location.origin;
      setReferralLink(`${baseUrl}?ref=${code}`);
    } else {
      setReferralCode('');
      setReferralLink('');
    }
  }, [connected, publicKey]);

  // Copy referral link to clipboard
  const copyToClipboard = () => {
    if (!referralLink) return;
    
    navigator.clipboard.writeText(referralLink)
      .then(() => {
        setCopied(true);
        setShowTooltip(true);
        
        // Track copy event
        trackEvent('referral_link_copied', {
          event_category: 'referral',
          event_label: publicKey?.toString() || 'unknown',
          value: 1
        });
        
        // Hide tooltip after 2 seconds
        setTimeout(() => {
          setShowTooltip(false);
          setTimeout(() => setCopied(false), 300);
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  // Share on Twitter
  const shareOnTwitter = () => {
    if (!referralLink) return;
    
    const tweetText = encodeURIComponent(
      `I'm using JeetBurner to claim rent from my empty token accounts on Solana. Use my referral link to get started: ${referralLink} #Solana #JeetBurner`
    );
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
    
    // Track share event
    trackEvent('referral_shared_twitter', {
      event_category: 'referral',
      event_label: publicKey?.toString() || 'unknown',
      value: 1
    });
    
    window.open(twitterUrl, '_blank');
  };

  if (!connected) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-xl p-4 backdrop-blur-sm border border-purple-500/30 shadow-lg">
      <div className="flex flex-col space-y-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-purple-400">🔗</span> Your Referral Link
        </h3>
        
        <p className="text-sm text-gray-300">
          Share your referral link and earn 50% of the fees when others use it!
        </p>
        
        <div className="relative">
          <div className="flex items-center">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="w-full bg-black/50 border border-purple-500/30 rounded-l-md px-3 py-2 text-sm text-white"
            />
            <button
              onClick={copyToClipboard}
              className={`px-3 py-2 rounded-r-md text-sm font-medium transition-colors ${
                copied 
                  ? 'bg-green-600 text-white' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          
          {showTooltip && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-2 py-1 rounded text-xs">
              Copied to clipboard!
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-400">
            <span className="font-semibold">Referral Code:</span> <span className="font-mono bg-gray-800 px-1 py-0.5 rounded">{referralCode}</span>
          </div>
          
          <button
            onClick={shareOnTwitter}
            className="flex items-center gap-1 bg-[#1DA1F2] hover:bg-[#1a94e0] text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
            </svg>
            Share
          </button>
        </div>
        
        <div className="text-xs text-gray-400 mt-2">
          <p>You earn 50% of the 20% burn fee when someone uses your link.</p>
          <p className="mt-1">Your unique referral code is cryptographically derived from your wallet address.</p>
        </div>
      </div>
    </div>
  );
}
