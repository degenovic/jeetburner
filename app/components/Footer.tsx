'use client'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 text-sm" style={{ position: 'relative', zIndex: 10, marginTop: 20 }}>
      <div className="max-w-6xl mx-auto px-4 text-center">
        <div className="mb-4">
          <h3 className="text-white font-medium"><i>"All jeeters will burn!" Elmo</i></h3>
          <br />
          <p className="text-gray-400 mb-4">
            Recover locked SOL from empty accounts on the Solana blockchain.
          </p>
          <p className="text-gray-400 text-sm italic mb-4">
            To keep this tool up and running, a 20% donation is included for the claimed SOL.
          </p>
          <br />
          <div className="flex items-center gap-2 justify-center">
            <span className="text-gray-400">Powered by</span>
            <a 
              href="https://www.helius.dev/solana-rpc-nodes" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center hover:text-white transition-colors"
            >
              <img 
                src="https://www.helius.dev/logo.svg" 
                alt="Helius" 
                className="h-5 inline-block"
              />
            </a>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-gray-400">&copy; {new Date().getFullYear()} JeetBurner.com. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
