'use client';

import { redirect } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js';
import { createCloseAccountInstruction } from '@solana/spl-token';
import { toast } from 'react-hot-toast';
import Header from './components/Header';
import { Footer } from './components/Footer';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface TokenAccount {
  pubkey: PublicKey;
  mint: string;
  name: string;
  symbol: string;
  lamports: number;
  image: string;
}

interface TokenMetadata {
  mint: string;
  name: string;
  symbol: string;
  image: string;
}

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

function HomeContent() {
  const searchParams = useSearchParams();
  const { publicKey, signTransaction, connected } = useWallet();
  const [accounts, setAccounts] = useState<TokenAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKey, setSearchKey] = useState('');
  const [searchError, setSearchError] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [searchedPubkey, setSearchedPubkey] = useState<PublicKey | null>(null);
  const [isViewingConnectedWallet, setIsViewingConnectedWallet] = useState(true);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle wallet connection - this takes priority
  useEffect(() => {
    if (publicKey) {
      setSearchedPubkey(publicKey);
      setIsViewingConnectedWallet(true);
      setHasSearched(false);
      setSearchKey('');
      // Clear URL parameter when wallet connects
      if (searchParams.has('pubkey')) {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('pubkey');
        window.history.replaceState({}, '', `${window.location.pathname}${newParams.toString() ? '?' + newParams.toString() : ''}`);
      }
    } else {
      // Only reset states on disconnect if we're viewing the connected wallet
      if (isViewingConnectedWallet) {
        setSearchedPubkey(null);
        setIsViewingConnectedWallet(false);
        setHasSearched(false);
      }
    }
  }, [publicKey]);

  // Handle URL parameters - only if no wallet is connected
  useEffect(() => {
    if (!mounted || publicKey) return;

    const pubkeyParam = searchParams.get('pubkey');
    if (pubkeyParam) {
      try {
        const urlPubkey = new PublicKey(pubkeyParam);
        setSearchedPubkey(urlPubkey);
        setSearchKey(pubkeyParam);
        setIsViewingConnectedWallet(false);
        setHasSearched(true);
      } catch (error) {
        console.error('Invalid public key in URL:', error);
        setSearchError('Invalid public key in URL');
      }
    }
  }, [mounted, searchParams, publicKey]);

  useEffect(() => {
    if (searchedPubkey) {
      fetchAccounts(searchedPubkey);
    }
  }, [searchedPubkey]);

  const connection = useMemo(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_MAINNET_RPC_URL || process.env.MAINNET_RPC_URL;
    if (!rpcUrl) {
      console.error('RPC URL not configured');
      return new Connection('https://api.mainnet-beta.solana.com');
    }
    return new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    });
  }, []);

  const fetchAccounts = useCallback(async (key: PublicKey) => {
    try {
      setLoading(true);
      setSearchError('');
      setHasSearched(true);
      
      const response = await fetch(`/api/accounts?pubkey=${key.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      
      const data = await response.json();
      const accounts = data.accounts;
      
      console.log('Total token accounts found:', accounts.length);
      
      const emptyAccounts = accounts
        .filter((account: any) => {
          const parsedInfo = account.account.data.parsed.info;
          return parsedInfo.tokenAmount.uiAmount === 0;
        })
        .map((account: any) => ({
          pubkey: new PublicKey(account.pubkey),
          mint: account.account.data.parsed.info.mint,
          name: 'Loading...',
          symbol: '...',
          lamports: account.account.lamports,
          image: '',
        }));

      if (emptyAccounts.length > 0) {
        try {
          // Fetch token metadata for all mints
          const mints = emptyAccounts.map((acc: TokenAccount) => acc.mint).join(',');
          const metadataResponse = await fetch(`/api/token-metadata?mints=${mints}`);
          
          if (!metadataResponse.ok) {
            throw new Error('Failed to fetch metadata');
          }

          const metadata = await metadataResponse.json() as TokenMetadata[];
          console.log('Metadata response:', metadata);
          
          // Update accounts with metadata
          emptyAccounts.forEach((account: TokenAccount) => {
            const tokenMetadata = metadata.find(m => m.mint === account.mint);
            if (tokenMetadata) {
              account.name = tokenMetadata.name || 'Unknown';
              account.symbol = tokenMetadata.symbol || '???';
              account.image = tokenMetadata.image || '';
            } else {
              account.name = 'Unknown';
              account.symbol = '???';
              account.image = '';
            }
          });
        } catch (error) {
          console.error('Error fetching token metadata:', error);
          // Don't fail the whole operation if metadata fetch fails
          emptyAccounts.forEach((account: TokenAccount) => {
            account.name = 'Unknown';
            account.symbol = '???';
            account.image = '';
          });
        }
      }

      console.log('Empty accounts found:', emptyAccounts.length);
      console.log('Empty accounts details:', emptyAccounts);
      
      setAccounts(emptyAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setSearchError('Failed to fetch accounts. Please try again.');
      toast.error('Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = async (key?: string) => {
    const searchValue = key || searchKey;
    if (!searchValue) {
      setSearchError('Please enter a public key');
      return;
    }

    try {
      const pubkey = new PublicKey(searchValue);
      setSearchError('');
      setSearchedPubkey(pubkey);
      setIsViewingConnectedWallet(publicKey ? pubkey.equals(publicKey) : false);
      setClaimError(null);
      setHasSearched(true);
      fetchAccounts(pubkey);
    } catch (error) {
      setSearchError('Invalid public key');
      console.error('Search error:', error);
    }
  };

  const getBlockhash = async () => {
    const response = await fetch('/api/blockhash');
    if (!response.ok) {
      throw new Error('Failed to get blockhash');
    }
    return response.json();
  };

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
      
      const { blockhash, lastValidBlockHeight } = await getBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());
      
      toast.loading('Closing account...');
      
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });
      
      if (confirmation.value.err) {
        throw new Error('Failed to confirm transaction');
      }
      
      toast.success(`Successfully closed account and reclaimed ${(account.lamports / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
      
      fetchAccounts(publicKey);
      
    } catch (error: unknown) {
      console.error('Error burning account:', error);
      
      if (error instanceof Error) {
        toast.error(`Failed to close account: ${error.message}`);
      } else {
        toast.error('Failed to close account. Please try again.');
      }
    }
  }, [publicKey, signTransaction, connection, fetchAccounts]);

  const handleBurnSingle = useCallback(async (accountPubkey: PublicKey) => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const { blockhash, lastValidBlockHeight } = await getBlockhash();
      
      const instruction = createCloseAccountInstruction(
        accountPubkey,
        publicKey,  // Destination for reclaimed SOL
        publicKey   // Owner of the account
      );

      const transaction = new Transaction().add(instruction);
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = publicKey;

      // This will trigger wallet prompt
      const signedTx = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });
      
      toast.success('Successfully claimed SOL!');
      fetchAccounts(publicKey);
    } catch (error) {
      console.error('Claim error:', error);
      toast.error('Failed to claim SOL');
    }
  }, [publicKey, signTransaction, connection, fetchAccounts]);

  const handleBurnMultiple = useCallback(async (accountsToBurn: string[]) => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const { blockhash, lastValidBlockHeight } = await getBlockhash();
      
      // Create instructions for all accounts
      const instructions = accountsToBurn.map(accountPubkey => 
        createCloseAccountInstruction(
          new PublicKey(accountPubkey),
          publicKey,
          publicKey
        )
      );

      // Create single transaction with all instructions
      const transaction = new Transaction().add(...instructions);
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
      transaction.feePayer = publicKey;

      // Sign and send
      const signedTx = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      // Confirm transaction
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });
      
      toast.success(`Successfully claimed ${accountsToBurn.length} accounts!`);
      setSelectedAccounts(new Set());
      fetchAccounts(publicKey);
    } catch (error) {
      console.error('Bulk claim error:', error);
      toast.error('Failed to claim accounts');
    }
  }, [publicKey, signTransaction, connection, fetchAccounts]);

  const handleBurnAttempt = useCallback(async () => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet first');
      return;
    }

    setClaimError(null);
    handleBurnMultiple(Array.from(selectedAccounts));
  }, [publicKey, signTransaction, selectedAccounts, handleBurnMultiple]);

  const truncateAddress = (address: string, startLength = 4, endLength = 4) => {
    if (!address) return '';
    if (address.length <= startLength + endLength) return address;
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
  };

  const toSol = (lamports: number) => {
    return lamports / LAMPORTS_PER_SOL;
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
            <p className="text-gray-300 text-2xl">
              Find and close empty token accounts to get some beer money
            </p>
            <div className="flex justify-center">
              <button 
                onClick={() => {
                  const guideElement = document.getElementById('guide-section');
                  if (guideElement) {
                    const headerOffset = document.querySelector('header')?.clientHeight || 0;
                    const elementPosition = guideElement.getBoundingClientRect().top + window.scrollY;
                    const offsetPosition = elementPosition - headerOffset - 20; // Adjust for header height and extra margin
                    window.scrollTo({
                      top: offsetPosition,
                      behavior: 'smooth'
                    });
                  }
                }}
                className="text-gray-400 hover:text-white text-sm mt-2 cursor-pointer underline flex items-center gap-1"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 17V16M12 14C12 11 15 11 15 8.5C15 6.5 13.5 5 12 5C10.5 5 9 6.5 9 8.5" stroke="currentColor" strokeWidth="2"/>
                </svg>
                WTF is this
              </button>
            </div>
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
                    placeholder="Enter a Solana wallet address"
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
                  <p className="text-gray-400">{truncateAddress(publicKey.toString(), 6, 6)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Account List */}
          {hasSearched && (
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
                  {accounts.length > 0 && connected && isViewingConnectedWallet && (
                    <button
                      onClick={() => handleBurnMultiple(accounts.map(acc => acc.pubkey.toString()))}
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
                  {accounts.length > 0 && connected && isViewingConnectedWallet && (
                    <div className="mb-4">
                      <button
                        onClick={handleBurnAttempt}
                        disabled={selectedAccounts.size === 0}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-500 px-4 py-2 rounded"
                      >
                        {loading ? 'Claiming...' : `Claim Selected (${selectedAccounts.size})`}
                      </button>
                    </div>
                  )}

                  <div className="bg-gray-800 rounded-lg overflow-hidden">
                    {accounts.map((account) => (
                      <div
                        key={account.pubkey.toString()}
                        className="flex items-center justify-between gap-4 p-4 border rounded-lg border-gray-800 bg-gray-900"
                      >
                        <div className="flex items-center gap-3">
                          {isViewingConnectedWallet && connected && (
                            <input
                              type="checkbox"
                              checked={selectedAccounts.has(account.pubkey.toString())}
                              onChange={(e) => {
                                const newSelected = new Set(selectedAccounts);
                                e.target.checked
                                  ? newSelected.add(account.pubkey.toString())
                                  : newSelected.delete(account.pubkey.toString());
                                setSelectedAccounts(newSelected);
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
                            />
                          )}
                          {account.image && (
                            <img 
                              src={account.image}
                              alt={account.name}
                              className="w-8 h-8 rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-token.png';
                              }}
                            />
                          )}
                          <div>
                            <div className="font-mono text-sm text-gray-400">
                              {truncateAddress(account.pubkey.toString())}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{account.name}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-sm text-gray-400">
                            {toSol(account.lamports).toFixed(4)} SOL
                          </div>
                          {isViewingConnectedWallet && connected && (
                            <button
                              onClick={() => handleBurnSingle(account.pubkey)}
                              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={loading}
                            >
                              {loading ? 'Claiming...' : 'Claim'}
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
          )}

          {/* FAQ Section */}
          <div className="w-full max-w-4xl">
            <div id="guide-section" className="h-32" /> {/* Spacer element for scroll target */}
            <h2 className="text-4xl font-bold mb-12 text-center text-white">
              <u>&apos;Degen&apos;s Guide to Rent Recovery&apos;</u>
            </h2>
            
            <div className="space-y-8">
              <div className="bg-gray-800/50 rounded-lg p-8 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
                <h3 className="text-2xl font-bold mb-4 mt-4" style={{ marginBottom: '15px' }}>
                🤔 What is Rent Recovery?
                </h3>
                <p className="text-gray-300 space-y-4">
                  If you&apos;ve been aping into tokens and NFTs on Solana, you probably have some rekt token accounts with 
                  leftover rent (~0.002 SOL each). This tool helps you claim that SOL back. It ain&apos;t much, but hey, it&apos;s free beer money! 
                </p>
                <p className="text-gray-300 mt-4">
                  Learn more about rent on Solana {' '}
                  <a 
                    href="https://spl_governance.crsp.dev multisig#rent" 
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
                <h3 className="text-2xl font-bold mb-4 mt-4" style={{ marginBottom: '15px' }}>
                  💰 How do I close an empty account?
                </h3>
                <p className="text-gray-300 space-y-4">
                  Each empty token account holds about 0.002 SOL (2,039,280 lamports to be exact). 
                  If you&apos;re a true degen who&apos;s been farming every token under the Solana sun, you might have dozens 
                  of these collecting dust. WAGMI! 
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-8 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
                <h3 className="text-2xl font-bold mb-4 mt-4" style={{ marginBottom: '15px' }}>
                🔎 How do I find my rekt accounts?
                </h3>
                <p className="text-gray-300">
                  Just connect your wallet or paste any wallet address above. We&apos;ll scan for token accounts that:
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
                  No cap, it&apos;s that simple!
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-8 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
                <h3 className="text-2xl font-bold mb-4 mt-4" style={{ marginBottom: '15px' }}>
                  🔥 What happens when I burn them?
                </h3>
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
                    <span>The token account gets nuked (but don&apos;t worry, you can always make a new one)</span>
                  </div>
                </div>
                <p className="text-gray-300 mt-4">
                  It&apos;s basically like getting an airdrop for being messy with your token accounts. Based!
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-8 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
                <h3 className="text-2xl font-bold mb-4 mt-4" style={{ marginBottom: '15px' }}>
                  🚨 Is this safe, ser?
                </h3>
                <p className="text-gray-300 space-y-4">
                  Absolutely based and safe-pilled! We only close accounts that have zero tokens and only recover the rent SOL. 
                  The code is open source, and we&apos;re just using standard Solana instructions. DYOR but this is literally 
                  free money you left on the table!
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-8 backdrop-blur-sm hover:bg-gray-800/70 transition-all">
                <h3 className="text-2xl font-bold mb-4 mt-4" style={{ marginBottom: '15px' }}>
                  💸 Any alpha leaks?
                </h3>
                <p className="text-gray-300">
                  Here&apos;s some galaxy brain moves:
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-pink-400">1.</span>
                    <span>Check your old wallets - your paper hand history might pay off</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-pink-400">2.</span>
                    <span>Look up your friends&apos; addresses - flex on them with their unclaimed SOL</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-pink-400">3.</span>
                    <span>Make it a habit to clean up after rugging yourself</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: '25px' }} />

      {/* Helius Attribution and Footer */}
      <div className="mt-16">
        <div className="flex flex-col items-center justify-center text-center mb-16">
          <div className="text-gray-400 flex items-center gap-2">
            Powered by
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
          <a 
            href="https://docs.helius.dev" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-400 hover:text-white text-sm mt-2 transition-colors"
          >
            View Documentation →
          </a>
          <div style={{ marginBottom: '25px' }} />
        </div>
        <Footer />
        <div className="bg-gray-900 text-gray-400 py-6 px-4 text-sm grid place-items-center">
          <div className="max-w-2xl">
            <p className="mb-4 text-center mx-auto">
              This tool allows you to close empty token accounts and reclaim SOL. Please verify all transactions before signing. 
              All actions are performed at your own risk. No financial advice is provided.
            </p>

            <p className="mb-4 text-center mx-auto">
              This is a new domain that may show security warnings in some wallets. The tool is open source and only interacts 
              with the Solana blockchain to close empty token accounts.
            </p>

            <div className="text-xs text-gray-500 text-center mx-auto">
              <a href="https://github.com/yourusername/pftc" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                View on GitHub
              </a>
              <span className="mx-2">•</span>
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="mb-6" />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
