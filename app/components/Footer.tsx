'use client'

export function Footer() {
  return (
    <footer className="w-full border-t border-gray-800 bg-black py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-4">CoinForge</h3>
            <p className="text-gray-400 text-sm">
              The easiest way to create and launch your Solana token. Built with ❤️ for the Solana community.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://docs.solana.com" target="_blank" rel="noopener noreferrer" 
                   className="text-gray-400 hover:text-white text-sm transition-colors">
                  Solana Docs
                </a>
              </li>
              <li>
                <a href="https://raydium.io" target="_blank" rel="noopener noreferrer"
                   className="text-gray-400 hover:text-white text-sm transition-colors">
                  Raydium DEX
                </a>
              </li>
              <li>
                <a href="https://github.com/solana-labs" target="_blank" rel="noopener noreferrer"
                   className="text-gray-400 hover:text-white text-sm transition-colors">
                  GitHub
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://twitter.com/solana" target="_blank" rel="noopener noreferrer"
                   className="text-gray-400 hover:text-white text-sm transition-colors">
                  Twitter
                </a>
              </li>
              <li>
                <a href="https://discord.com/invite/solana" target="_blank" rel="noopener noreferrer"
                   className="text-gray-400 hover:text-white text-sm transition-colors">
                  Discord
                </a>
              </li>
              <li>
                <a href="https://t.me/solana" target="_blank" rel="noopener noreferrer"
                   className="text-gray-400 hover:text-white text-sm transition-colors">
                  Telegram
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800">
          <p className="text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} CoinForge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
