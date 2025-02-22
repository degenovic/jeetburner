'use client';

import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js';
import { createCloseAccountInstruction } from '@solana/spl-token';
import { toast } from 'react-hot-toast';
import Header from './components/Header';
import { Footer } from './components/Footer';
import { useSearchParams } from 'next/navigation';

interface TokenAccount {
  pubkey: PublicKey;
  mint: string;
  name: string;
  symbol: string;
  lamports: number;
}

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

export default function Home() {
  const searchParams = useSearchParams();
  const { publicKey, signTransaction, connected } = useWallet();
  const [accounts, setAccounts] = useState<TokenAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKey, setSearchKey] = useState('');
  const [searchError, setSearchError] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [searchedPubkey, setSearchedPubkey] = useState<PublicKey | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const connection = useMemo(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_MAINNET_RPC_URL;
    
    if (!rpcUrl) {
      toast.error('No RPC URL configured. Please check your environment variables.');
      return new Connection('https://api.mainnet-beta.solana.com');  // Fallback to public mainnet
    }
    
    console.log('Initializing connection with RPC URL:', rpcUrl);
    
    return new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
      wsEndpoint: undefined // Disable WebSocket
    });
  }, []);

  const fetchAccountsForKey = useCallback(async (targetKey: PublicKey) => {
    if (!connection) return;
    
    setLoading(true);
    setAccounts([]);
    
    try {
      const { blockhash } = await connection.getLatestBlockhash();
      console.log('Connected successfully! Latest blockhash:', blockhash);
      
      console.log('Fetching token accounts for wallet:', targetKey.toString());
      
      // Get minimum rent-exempt balance once
      const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(0);
      console.log('Minimum rent-exempt balance:', rentExemptBalance / LAMPORTS_PER_SOL, 'SOL');
      
      const response = await connection.getParsedTokenAccountsByOwner(
        targetKey,
        { programId: TOKEN_PROGRAM_ID },
        'confirmed'
      );

      console.log('Total token accounts found:', response.value.length);
      
      // Log all accounts for debugging without async operations
      response.value.forEach((item, index) => {
        const { pubkey, account } = item;
        const info = account.data.parsed.info;
        console.log(`Account ${index + 1}:`, {
          pubkey: pubkey.toString(),
          mint: info.mint,
          owner: info.owner,
          tokenAmount: info.tokenAmount,
          lamports: account.lamports / LAMPORTS_PER_SOL + ' SOL',
          isRentExempt: account.lamports >= rentExemptBalance ? 'Yes' : 'No'
        });
      });

      const emptyAccounts: TokenAccount[] = response.value
        .filter(({ account }) => {
          const parsedInfo = account.data.parsed.info;
          const tokenAmount = parsedInfo.tokenAmount;
          const hasZeroTokens = tokenAmount.uiAmount === 0 && tokenAmount.amount === "0";
          const hasRentExemptBalance = account.lamports >= rentExemptBalance;
          
          // Log filtering details
          console.log('Checking account:', {
            mint: parsedInfo.mint,
            uiAmount: tokenAmount.uiAmount,
            amount: tokenAmount.amount,
            lamports: account.lamports / LAMPORTS_PER_SOL + ' SOL',
            hasZeroTokens,
            hasRentExemptBalance,
            rentExemptBalance: rentExemptBalance / LAMPORTS_PER_SOL + ' SOL'
          });
          
          return hasZeroTokens && hasRentExemptBalance;
        })
        .map(({ pubkey, account }) => ({
          pubkey: new PublicKey(pubkey),
          lamports: account.lamports,
          mint: account.data.parsed.info.mint,
          name: account.data.parsed.info.mint || 'Unknown Token',
          symbol: 'EMPTY'
        }));

      console.log('Empty accounts found:', emptyAccounts.length);
      console.log('Empty accounts details:', 
        emptyAccounts.map(acc => ({
          ...acc,
          lamports: acc.lamports / LAMPORTS_PER_SOL + ' SOL'
        }))
      );
      
      setAccounts(emptyAccounts);
    } catch (error: unknown) {
      console.error('Error fetching accounts:', error);
      
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        toast.error(`Failed to fetch accounts: ${error.message}`);
      } else {
        toast.error('Failed to fetch accounts. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [connection]);

  // Auto-search from URL parameter
  useEffect(() => {
    if (!mounted) return;
    
    const pubkey = searchParams.get('pubkey');
    if (pubkey) {
      setSearchKey(pubkey);
      handleSearch(pubkey);
    }
  }, [mounted, searchParams]);

  const handleSearch = async (key?: string) => {
    const searchValue = key || searchKey;
    if (!searchValue) {
      setSearchError('Please enter a public key');
      return;
    }

    try {
      const pubKey = new PublicKey(searchValue);
      setSearchError('');
      setSearchedPubkey(pubKey);
      setClaimError(null);
      fetchAccountsForKey(pubKey);
    } catch (error) {
      setSearchError('Invalid public key');
      console.error('Search error:', error);
    }
  };

  // Fetch accounts when wallet is connected
  useEffect(() => {
    if (connected && publicKey) {
      fetchAccountsForKey(publicKey);
    }
  }, [connected, publicKey, fetchAccountsForKey]);

  const burnAccount = useCallback(async (account: TokenAccount) => {
    if (!publicKey || !signTransaction) return;
    
    try {
      const transaction = new Transaction();
      
      const closeInstruction = createCloseAccountInstruction(
        new PublicKey(account.pubkey), // Token account to close
        publicKey,                      // Destination for rent SOL
        publicKey,                      // Authority
        []                             // No multisig
      );
      
      transaction.add(closeInstruction);
      
      const latestBlockhash = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = publicKey;
      
      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      
      toast.loading('Closing account...');
      
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
      });
      
      if (confirmation.value.err) {
        throw new Error('Failed to confirm transaction');
      }
      
      toast.success(`Successfully closed account and reclaimed ${(account.lamports / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
      
      fetchAccountsForKey(publicKey);
      
    } catch (error: unknown) {
      console.error('Error burning account:', error);
      
      if (error instanceof Error) {
        toast.error(`Failed to close account: ${error.message}`);
      } else {
        toast.error('Failed to close account. Please try again.');
      }
    }
  }, [publicKey, signTransaction, connection, fetchAccountsForKey]);

  const checkWalletOwnership = () => {
    if (!publicKey || !searchedPubkey) return false;
    return publicKey.toString() === searchedPubkey.toString();
  };

  const handleBurnAttempt = () => {
    if (!checkWalletOwnership()) {
      setClaimError("You are not connected to this wallet.");
      return;
    }
    setClaimError(null);
    burnSelected();
  };

  const burnSelected = async () => {
    if (!publicKey || !signTransaction) return;

    const selectedAccountsList = accounts.filter(acc => 
      selectedAccounts.has(acc.pubkey.toString())
    );

    const transaction = new Transaction();
    selectedAccountsList.forEach(account => {
      transaction.add(
        createCloseAccountInstruction(
          account.pubkey,
          publicKey,
          publicKey,
          []
        )
      );
    });

    try {
      const signedTx = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature);

      toast.success(`Successfully burned ${selectedAccountsList.length} accounts`);
      setSelectedAccounts(new Set());
      fetchAccountsForKey(publicKey);
    } catch (error: unknown) {
      console.error('Error burning accounts:', error);
      
      if (error instanceof Error) {
        toast.error(`Failed to burn selected accounts: ${error.message}`);
      } else {
        toast.error('Failed to burn selected accounts. Please try again.');
      }
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-black">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center gap-16">
          {/* Main Heading */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
              Recover Your Rent SOL
            </h1>
            <p className="text-gray-300 text-xl">
              Find and close empty token accounts to get your rent back
            </p>
          </div>

          {/* Wallet Connection and Search */}
          <div className="w-full max-w-4xl flex flex-col items-center gap-6">
            <div suppressHydrationWarning>
              <WalletMultiButton />
            </div>

            <div className="text-gray-400 text-xl font-bold">OR</div>

            <div className="w-full mb-16">
              {/* Public Key Search */}
              <div className="mb-8">
                <div className="flex gap-4 items-center">
                  <input
                    type="text"
                    value={searchKey}
                    onChange={(e) => setSearchKey(e.target.value)}
                    placeholder="Enter a Solana public key to search"
                    className="flex-1 px-4 py-2 bg-gray-800 rounded text-white"
                  />
                  <div className="w-fit">
                    <button
                      onClick={() => handleSearch()}
                      className="wallet-adapter-button !w-auto px-6 py-2.5"
                    >
                      Search
                    </button>
                  </div>
                </div>
                {searchError && (
                  <p className="text-red-500 mt-2 text-sm">{searchError}</p>
                )}
              </div>

              <div className="h-16"></div>

              {/* Connected Wallet Info */}
              {connected && publicKey && (
                <div className="text-center mb-16">
                  <h2 className="text-2xl font-bold mb-2">Connected Wallet</h2>
                  <p className="text-gray-400">{publicKey.toString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Account List */}
          <div className="w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                Rent-exempt Accounts ({accounts.length})
              </h3>
              <div className="text-right">
                <p className="text-sm text-gray-400">Total Reclaimable:</p>
                <p className="font-bold" style={{ color: accounts.reduce((sum, acc) => sum + acc.lamports, 0) > 0 ? '#86efac' : 'white' }}>
                  {(accounts.reduce((sum, acc) => sum + acc.lamports, 0) / LAMPORTS_PER_SOL).toFixed(4)} SOL
                </p>
                {accounts.length > 0 && connected && (
                  <button
                    onClick={handleBurnAttempt}
                    className="wallet-adapter-button !w-auto px-4 py-1.5 mt-2 text-sm"
                  >
                    Claim All
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              {claimError && (
                <p className="text-red-500 mt-2 text-sm">{claimError}</p>
              )}
            </div>
            {loading ? (
              <div className="text-center py-8">Loading accounts...</div>
            ) : (
              <>
                {accounts.length > 0 && connected && (
                  <div className="mb-4">
                    <button
                      onClick={handleBurnAttempt}
                      disabled={selectedAccounts.size === 0}
                      className="bg-red-500 hover:bg-red-600 disabled:bg-gray-500 px-4 py-2 rounded"
                    >
                      Burn Selected ({selectedAccounts.size})
                    </button>
                  </div>
                )}

                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  {accounts.map((account) => (
                    <div
                      key={account.pubkey.toString()}
                      className="border-b border-gray-700 p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        {connected && (
                          <input
                            type="checkbox"
                            checked={selectedAccounts.has(account.pubkey.toString())}
                            onChange={(e) => {
                              const newSelected = new Set(selectedAccounts);
                              if (e.target.checked) {
                                newSelected.add(account.pubkey.toString());
                              } else {
                                newSelected.delete(account.pubkey.toString());
                              }
                              setSelectedAccounts(newSelected);
                            }}
                            className="w-4 h-4"
                          />
                        )}
                        <div>
                          <p className="font-medium">{account.name}</p>
                          <p className="text-sm text-gray-400">{account.pubkey.toString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-medium">
                          {(account.lamports / LAMPORTS_PER_SOL).toFixed(4)} SOL
                        </p>
                        {connected && (
                          <button
                            onClick={() => burnAccount(account)}
                            className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
                          >
                            Burn
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {accounts.length === 0 && (
                    <div className="p-8 text-center text-gray-400">
                      No rent-exempt accounts found
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* FAQ Section */}
          <div className="w-full max-w-4xl">
            <h2 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
              🔥 Degen's Guide to Rent Recovery 🔥
            </h2>
            
            <div className="space-y-8">
              <div className="bg-gray-800/50 rounded-lg p-8 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
                <h3 className="text-2xl font-bold mb-4">🤔 Wen free SOL?</h3>
                <p className="text-gray-300 space-y-4">
                  If you've been aping into tokens and NFTs on Solana, you probably have some rekt token accounts with 
                  leftover rent (~0.002 SOL each). This tool helps you claim that SOL back. It ain't much, but it's honest work! 
                </p>
                <p className="text-gray-300 mt-4">
                  Learn more about rent on Solana {' '}
                  <a 
                    href="https://solana.com/docs/core/accounts#rent" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-pink-400 hover:text-pink-300 underline"
                  >
                    here
                  </a>
                  .
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-8 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
                <h3 className="text-2xl font-bold mb-4">💸 How much SOL we talking about?</h3>
                <p className="text-gray-300 space-y-4">
                  Each empty token account holds about 0.002 SOL (2,039,280 lamports to be exact). 
                  If you're a true degen who's been farming every token under the Solana sun, you might have dozens 
                  of these collecting dust. WAGMI! 
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-8 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
                <h3 className="text-2xl font-bold mb-4">🔍 How do I find my rekt accounts?</h3>
                <p className="text-gray-300">
                  Just connect your wallet or paste any wallet address above. We'll scan for token accounts that:
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-pink-400">1.</span>
                    <span>Have 0 tokens left (you paper-handed everything)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-pink-400">2.</span>
                    <span>Still have that sweet rent SOL locked up</span>
                  </div>
                </div>
                <p className="text-gray-300 mt-4">
                  No cap, it's that simple!
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-8 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
                <h3 className="text-2xl font-bold mb-4">🔥 What happens when I burn them?</h3>
                <p className="text-gray-300">
                  When you burn (close) an empty token account:
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-pink-400">1.</span>
                    <span>The rent SOL gets sent back to your wallet</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-pink-400">2.</span>
                    <span>The token account gets nuked (but don't worry, you can always make a new one)</span>
                  </div>
                </div>
                <p className="text-gray-300 mt-4">
                  It's basically like getting an airdrop for being messy with your token accounts. Based!
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-8 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
                <h3 className="text-2xl font-bold mb-4">🤝 Is this safe, ser?</h3>
                <p className="text-gray-300 space-y-4">
                  Absolutely based and safe-pilled! We only close accounts that have zero tokens and only recover the rent SOL. 
                  The code is open source, and we're just using standard Solana instructions. DYOR but this is literally 
                  free money you left on the table!
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-8 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
                <h3 className="text-2xl font-bold mb-4">🚀 Any alpha leaks?</h3>
                <p className="text-gray-300">
                  Here's some galaxy brain moves:
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-pink-400">1.</span>
                    <span>Check your old wallets - your paper hand history might pay off</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-pink-400">2.</span>
                    <span>Look up your friends' addresses - flex on them with their unclaimed SOL</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-pink-400">3.</span>
                    <span>Make it a habit to clean up after rugging yourself</span>
                  </div>
                </div>
                <p className="text-gray-300 mt-4">
                  Remember: even 0.002 SOL might be worth a lot when SOL hits $1000! NFA IYKYK 🤫
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
