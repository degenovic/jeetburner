import React from 'react';

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FaqModal: React.FC<FaqModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-10 sm:pt-20">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div 
        className="relative z-50 rounded-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl mt-4"
        style={{
          background: 'rgba(0, 0, 0, 0.95)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="p-5">
          <div className="relative mb-6 sticky top-0 bg-black py-4 -mt-2 -mx-2 px-2 text-center">
            <h2 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-600">FAQs</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-full transition-colors absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', padding: '0 10px', marginBottom: '30px' }}>
            <div className="px-2">
              <h3 className="text-lg font-bold mb-2 text-white flex items-center gap-2"><span className="bg-gray-700 p-1 rounded-lg">🔥</span> How does it work?</h3>
              <p className="text-gray-200 pr-2">
                If you&apos;ve been aping into pumps on Solana, you may have rekt token accounts with 
                leftover rent (~0.002 SOL each). This tool helps you claim that SOL back by burning these useless accounts.
              </p>
              <p className="text-gray-200 mt-3 pr-2">
                Learn more about rent on Solana {' '}
                <a 
                  href="https://solana.com/docs/core/accounts#rent" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-pink-500 hover:text-pink-400 underline"
                >
                  here
                </a>.
              </p>
            </div>
            
            <div className="px-2">
              <h3 className="text-lg font-bold mb-2 text-white flex items-center gap-2"><span className="bg-gray-700 p-1 rounded-lg">🔎</span> How do I find rekt accounts?</h3>
              <p className="text-gray-200 pr-2">
                Connect your wallet or paste any wallet address. We&apos;ll scan for token accounts that:
              </p>
              <div className="mt-2 space-y-1 pl-2">
                <div className="flex items-start gap-2">
                  <span className="text-pink-500 font-bold">1.</span>
                  <span className="text-gray-200">Have 0 tokens left</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-pink-500 font-bold">2.</span>
                  <span className="text-gray-200">Still have rent SOL locked up</span>
                </div>
              </div>
            </div>
            
            <div className="px-2">
              <h3 className="text-lg font-bold mb-2 text-white flex items-center gap-2"><span className="bg-gray-700 p-1 rounded-lg">💰</span> What happens when I burn them?</h3>
              <p className="text-gray-200 pr-2">
                When you burn (close) an empty token account:
              </p>
              <div className="mt-2 space-y-1 pl-2">
                <div className="flex items-start gap-2">
                  <span className="text-pink-500 font-bold">1.</span>
                  <span className="text-gray-200">The rent SOL is sent to your wallet</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-pink-500 font-bold">2.</span>
                  <span className="text-gray-200">The empty token account is closed</span>
                </div>
              </div>
            </div>
            
            <div className="px-2">
              <h3 className="text-lg font-bold mb-2 text-white flex items-center gap-2"><span className="bg-gray-700 p-1 rounded-lg">🚨</span> Is this safe?</h3>
              <p className="text-gray-200 pr-2">
                Yes. We only close accounts that have zero tokens and recover the rent SOL.
              </p>
            </div>
            
            <div className="px-2">
              <h3 className="text-lg font-bold mb-2 text-white flex items-center gap-2"><span className="bg-gray-700 p-1 rounded-lg">💸</span> Any alpha leaks?</h3>
              <p className="text-gray-200 pr-2">
                Here&apos;s some big brain moves:
              </p>
              <div className="mt-2 space-y-1 pl-2">
                <div className="flex items-start gap-2">
                  <span className="text-pink-500 font-bold">1.</span>
                  <span className="text-gray-200">Check your old wallets - your paper hand history might pay off</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-pink-500 font-bold">2.</span>
                  <span className="text-gray-200">Check your friends&apos; wallets - be a hero and help them claim SOL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaqModal;
