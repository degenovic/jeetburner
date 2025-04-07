import React from 'react';
import { trackWalletConnect } from '../utils/analytics';

interface PumpFunDegenCTAProps {
  onClaimClick?: () => void;
}

const PumpFunDegenCTA: React.FC<PumpFunDegenCTAProps> = ({ onClaimClick }) => {
  const handleClaimClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const wallet = window.solana?.wallet;
    const walletName = wallet ? wallet.adapter?.name : 'unknown';
    trackWalletConnect(walletName);
    
    // Scroll to top of the page
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    onClaimClick?.();
  };

  return (
    <div className="relative w-full max-w-4xl mb-32">
      <div 
        className="w-full max-w-4xl rounded-lg overflow-hidden p-0 z-10 transition-all duration-300 ease-in-out" 
        style={{ 
          marginTop: '20px',
          border: '1px solid #5ccd8a',
          boxShadow: '0 0 15px rgba(92, 205, 138, 0.4)',
          backgroundColor: 'rgba(0, 0, 0, 0.7)'
        }}
      >
        <div className="relative z-10 p-8" style={{ backgroundColor: 'transparent' }}>
          <div className="flex flex-col gap-6 items-center text-center pt-2">
            <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <img 
                src="/images/pumpfunlogo.webp" 
                alt="Pump.fun Logo" 
                className="w-8 h-8 rounded-lg mr-2"
              />
              Are you a Degen on Pump.fun?
            </h3>
            
            <p className="text-gray-300 max-w-3xl">
              Listen up, sers! 🚀 If you've been aping into every new token on Pump.fun, you might be sitting on a hidden treasure trove of locked-up SOL.
              Those countless token accounts you've created and traded? They're not just digital dust – they're potential SOL waiting to be claimed. Each abandoned
              account locks up about 0.002 SOL in rent, and if you've been a true degen, those small amounts can quickly add up to a significant chunk of change.
            </p>
            
            <h4 className="text-xl font-bold text-white mt-2 flex items-center justify-center gap-2">
            Why JeetBurner is Your New Best Friend
            <img 
                src="/images/jeetburner2.gif" 
                alt="JeetBurner Fire" 
                className="w-8 h-8 mr-2"
              />
            </h4>
            <ul className="text-gray-300 list-none space-y-1 text-left max-w-2xl">
              <li>• Instantly scan ALL your token accounts</li>
              <li>• Claim SOL locked in abandoned accounts</li>
              <li>• Clean up your wallet with one-click burning</li>
              <li>• No more paying rent on useless accounts</li>
            </ul>
            
            <div className="flex justify-center mt-2">
              <button 
                onClick={handleClaimClick} 
                className="wallet-adapter-button wallet-adapter-button-trigger hover:scale-105 transition-transform duration-300"
              >
                Claim Your Lost SOL Now! 🔥
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PumpFunDegenCTA;
