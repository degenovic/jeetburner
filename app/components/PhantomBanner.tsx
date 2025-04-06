import React, { useEffect, useState } from 'react';

interface PhantomBannerProps {
  onClose: () => void;
}

export default function PhantomBanner({ onClose }: PhantomBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsVisible(scrollPosition === 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className={`sticky top-0 left-0 right-0 bg-[#6736F5] text-white py-4 flex items-center justify-center h-auto ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ 
        transition: 'opacity 0.2s ease-in-out',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/images/phantom-logo-white.png" 
            alt="Phantom Logo" 
            className="w-6 h-6 rounded-lg flex-shrink-0"
          />
          <span className="text-xs sm:text-sm" style={{ color: '#ab9ff2' }}>
            We are now approved by Phantom. For added safety, you can move all your tokens to another wallet before connecting.
          </span>
        </div>
        <button 
          onClick={onClose}
          className="ml-4 text-white hover:opacity-80 transition-opacity"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
