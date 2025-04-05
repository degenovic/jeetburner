'use client';

import { redirect } from 'next/navigation';
import FaqModal from './components/FaqModal';
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { getProvider, signAndSendTransaction } from './utils/phantom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { trackWalletConnect } from './utils/analytics';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import * as spl from '@solana/spl-token';
import { toast } from 'react-hot-toast';
import Header from './components/Header';
import { Footer } from './components/Footer';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { connection } from './utils/connection';

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
const FEE_WALLET = new PublicKey('8rWPyC5Y9LXFjFkiEw7CtgxCjq1JDeXXV5zv4do1VW1j');
const FEE_PERCENTAGE = 0.2; // 20%

function HomeContent() {
  const searchParams = useSearchParams();
  const { publicKey, connected } = useWallet();
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
  const [liveFeedItems, setLiveFeedItems] = useState<{address: string; amount: string; numAccounts: number; timestamp: number}[]>([]);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [isPhantomBannerVisible, setIsPhantomBannerVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate random SOL amount based on a realistic 0.002 SOL per token account
  const generateRandomAmount = () => {
    // Generate a number of accounts with higher probability for lower numbers
    // Using a power law distribution to make smaller values more likely
    let numAccounts;
    
    // Determine which distribution to use based on random chance
    const distributionChoice = Math.random();
    
    if (distributionChoice < 0.70) {
      // 70% chance: 1-20 accounts (most common case)
      numAccounts = Math.floor(Math.pow(Math.random(), 2) * 20) + 1;
    } else if (distributionChoice < 0.90) {
      // 20% chance: 21-100 accounts (less common)
      numAccounts = Math.floor(Math.pow(Math.random(), 1.5) * 80) + 21;
    } else if (distributionChoice < 0.98) {
      // 8% chance: 101-300 accounts (rare)
      numAccounts = Math.floor(Math.pow(Math.random(), 1.2) * 200) + 101;
    } else {
      // 2% chance: 301-512 accounts (very rare)
      numAccounts = Math.floor(Math.random() * 212) + 301;
    }
    
    // Calculate amount based on 0.002 SOL per account
    const amount = (numAccounts * 0.002 * 0.8).toFixed(4); // Apply 20% fee
    return { amount, numAccounts };
  };

  // Generate random Solana-like address
  const generateRandomAddress = () => {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Function to add a new random feed item
  const addRandomFeedItem = useCallback(() => {
    setLiveFeedItems(prevItems => {
      const newItems = [...prevItems];
      // Add new item at the beginning
      const { amount, numAccounts } = generateRandomAmount();
      newItems.unshift({
        address: generateRandomAddress(),
        amount: amount,
        numAccounts: numAccounts,
        timestamp: Date.now()
      });
      // Keep only the latest 7 items
      return newItems.slice(0, 7);
    });
    
    // Reset and trigger scroll animation
    const feedContainer = document.querySelector('.animate-continuous-scroll');
    if (feedContainer) {
      // First remove the animation
      (feedContainer as HTMLElement).style.animation = 'none';
      // Force a reflow
      void (feedContainer as HTMLElement).offsetHeight;
      // Apply the animation again
      (feedContainer as HTMLElement).style.animation = 'continuous-scroll 1s ease-in-out';
    }
  }, []);

  // Set up random intervals for adding new feed items
  const setupNextInterval = useCallback(() => {
    // Random time between 3 and 10 seconds
    const randomTime = Math.floor(Math.random() * 7000) + 3000;
    return setTimeout(() => {
      addRandomFeedItem();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setupNextInterval();
    }, randomTime);
  }, [addRandomFeedItem]);

  // Live feed effect
  useEffect(() => {
    if (!mounted) return;

    // Add initial feed items
    const initialItems = Array(7).fill(null).map(() => {
      const { amount, numAccounts } = generateRandomAmount();
      return {
        address: generateRandomAddress(),
        amount: amount,
        numAccounts: numAccounts,
        timestamp: Date.now()
      };
    });
    setLiveFeedItems(initialItems);

    // Start the interval
    timeoutRef.current = setupNextInterval();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [mounted, setupNextInterval]);

  // Handle wallet connection - this takes priority
  useEffect(() => {
    if (publicKey) {
      // Track wallet connection event
      const wallet = window.solana?.wallet;
      const walletName = wallet ? wallet.adapter?.name : 'unknown';
      trackWalletConnect(walletName);
      
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

  const handleBurnSingle = useCallback(async (accountPubkey: PublicKey) => {
    if (!publicKey || !connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      toast.loading('Preparing transaction...', { id: 'transaction-prep' });
      
      let provider;
      try {
        provider = getProvider();
      } catch (error) {
        console.error('Error getting Phantom provider:', error);
        toast.error('Phantom wallet not detected. Please install or unlock Phantom wallet.', { id: 'transaction-prep' });
        return;
      }
      
      // Find the account in our list to get the lamports amount
      const account = accounts.find(acc => acc.pubkey.toString() === accountPubkey.toString());
      if (!account) {
        throw new Error('Account not found');
      }
      
      // Calculate fee amount (20% of the account's lamports)
      const feeAmount = Math.floor(account.lamports * FEE_PERCENTAGE);
      
      // Create instructions array
      const instructions = [
        // Close account instruction
        spl.createCloseAccountInstruction(
          accountPubkey,
          publicKey,  // Destination for reclaimed SOL
          publicKey   // Owner of the account
        )
      ];
      
      // Add fee transfer instruction if applicable
      if (feeAmount > 0) {
        instructions.push(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: FEE_WALLET,
            lamports: feeAmount
          })
        );
      }

      toast.loading('Please approve the transaction in your wallet. This will close the account and return rent SOL minus a small fee.', { id: 'transaction-prep' });
      
      const signature = await signAndSendTransaction(provider, instructions, connection);
      
      toast.loading('Closing account...', { id: 'transaction-prep' });
      
      await connection.confirmTransaction(signature);
      
      const netAmount = account.lamports - feeAmount;
      toast.success(`Successfully claimed ${(netAmount / LAMPORTS_PER_SOL).toFixed(4)} SOL!`, { id: 'transaction-prep' });
      fetchAccounts(publicKey);
    } catch (error) {
      console.error('Claim error:', error);
      toast.error('Failed to claim SOL', { id: 'transaction-prep' });
    }
  }, [publicKey, connected, connection, fetchAccounts, accounts]);

  const handleBurnMultiple = useCallback(async (accountsToBurn: string[]) => {
    if (!publicKey || !connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      toast.loading('Preparing transaction...', { id: 'transaction-prep' });
      
      // Get Phantom provider
      let provider;
      try {
        provider = getProvider();
      } catch (error) {
        console.error('Error getting Phantom provider:', error);
        toast.error('Phantom wallet not detected. Please install or unlock Phantom wallet.', { id: 'transaction-prep' });
        return;
      }
      
      // Find the token accounts from the accounts list
      const tokenAccountsToBurn = accounts.filter(acc => 
        accountsToBurn.includes(acc.pubkey.toString())
      );
      
      // Calculate total lamports to be reclaimed
      const totalLamports = tokenAccountsToBurn.reduce((sum, acc) => sum + acc.lamports, 0);
      
      // Calculate fee (20% of total lamports)
      const totalFeeAmount = Math.floor(totalLamports * FEE_PERCENTAGE);
      
      // Create instructions array
      const instructions = tokenAccountsToBurn.map(account => 
        spl.createCloseAccountInstruction(
          account.pubkey,
          publicKey,  // Destination for reclaimed SOL
          publicKey   // Owner of the account
        )
      );
      
      // Add fee transfer instruction if applicable
      if (totalFeeAmount > 0) {
        instructions.push(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: FEE_WALLET,
            lamports: totalFeeAmount
          })
        );
      }
      
      const numAccounts = tokenAccountsToBurn.length;
      toast.loading(`Please approve the transaction in your wallet. This will close ${numAccounts} ${numAccounts === 1 ? 'account' : 'accounts'} and return rent SOL minus a small fee.`, { id: 'transaction-prep' });
      
      const signature = await signAndSendTransaction(provider, instructions, connection);
      
      toast.loading('Closing accounts...', { id: 'transaction-prep' });
      
      await connection.confirmTransaction(signature);
      
      const netAmount = totalLamports - totalFeeAmount;
      toast.success(`Successfully claimed ${(netAmount / LAMPORTS_PER_SOL).toFixed(4)} SOL!`, { id: 'transaction-prep' });
      fetchAccounts(publicKey);
    } catch (error) {
      console.error('Bulk claim error:', error);
      toast.error('Failed to claim SOL', { id: 'transaction-prep' });
    }
  }, [publicKey, connected, connection, fetchAccounts, accounts]);

  const handleBurnAttempt = useCallback(async () => {
    if (!publicKey || !connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setClaimError(null);
    handleBurnMultiple(Array.from(selectedAccounts));
  }, [publicKey, connected, selectedAccounts, handleBurnMultiple]);

  const truncateAddress = (address: string, startLength = 4, endLength = 3) => {
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
      {/* Phantom Approval Banner */}
      {isPhantomBannerVisible && (
        <div 
          className="fixed top-0 left-0 right-0 bg-[#6736F5] text-white py-3 z-50 flex items-center justify-center"
          style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
        >
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/images/phantom-logo-white.png" 
                alt="Phantom Logo" 
                className="w-8 h-8 rounded-lg"
              />
              <span className="text-sm" style={{ color: '#ab9ff2' }}>
                We are now approved by Phantom. 
                For added safety, you can move all your tokens to another wallet before connecting.
              </span>
            </div>
            <button 
              onClick={() => setIsPhantomBannerVisible(false)}
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
      )}
      
      {/* Adjust top padding to account for banner */}
      <div 
        className="relative" 
        style={{ 
          zIndex: 1, 
          paddingTop: isPhantomBannerVisible ? '60px' : '0' 
        }}
      >
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center gap-4">
            {/* Main Heading */}
            <div className="text-center mb-8">
              <p className="text-white" style={{ marginTop: '15px', fontSize: '28px' }}>
                <b>Burn empty token accounts to claim SOL</b>
              </p>
              <div className="flex justify-center">
                <button 
                  onClick={() => setIsFaqModalOpen(true)}
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

            {/* Live Feed */}
            <div className="w-full max-w-4xl overflow-hidden bg-gray-900/30 rounded-lg border-0 relative">
              <div className="p-2 bg-gray-800/50 flex items-center">
                <div className="flex items-center">
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: '#22c55e',
                    marginRight: '8px',
                    animation: 'liveBlink 2.4s ease-in-out infinite'
                  }}></div>
                </div>
                <span className="text-xs text-gray-400">ACTIVITY</span>
              </div>
              <div className="py-0.5 relative overflow-hidden" style={{ height: '180px' }}>
                {/* Container for the scrolling content */}
                <div className="animate-continuous-scroll" style={{ 
                  transform: 'translateY(0)',
                  transition: 'transform 0.8s ease-out'
                }}>
                  {liveFeedItems.map((item, index) => (
                    <div 
                      key={item.timestamp + index} 
                      className={`text-sm flex justify-between items-center p-1.5 mb-2 ${index === 0 ? 'bg-gray-800/30 rounded' : ''}`}
                      style={{ height: '32px' }}
                    >
                      <div className="text-gray-400 truncate">
                        <span className="text-gray-300">{truncateAddress(item.address)}</span>
                        <span className="text-gray-500 ml-1">({item.numAccounts} empty {item.numAccounts === 1 ? 'account' : 'accounts'} burned🔥)</span>
                      </div>
                      <div className="flex items-center whitespace-nowrap">
                        <span style={{ color: 'rgb(134, 239, 172)' }} className="font-semibold">{item.amount}</span>
                        <span className="text-gray-400 ml-1">SOL claimed!</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Strong gradient overlay for fade-out effect */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50px', background: 'linear-gradient(to top, #000000 30%, rgba(0, 0, 0, 0.8) 70%, rgba(0, 0, 0, 0) 100%)', pointerEvents: 'none', zIndex: 10 }}></div>
              </div>
            </div>

            {/* Wallet Connection and Search */}
            <div className="w-full max-w-4xl flex flex-col items-center gap-2 -mt-2">
              <div suppressHydrationWarning>
                <WalletMultiButton onClick={() => trackWalletConnect('button_click')} />
              </div>

              <div className="text-gray-400 text-sm font-bold my-1">OR</div>

              <div className="w-full mb-2">
                {/* Public Key Search */}
                <div className="mb-2">
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

                <div className="h-4"></div>

                {/* Connected Wallet Info */}
                {connected && publicKey && (
                  <div className="text-center mb-3">
                    <h2 className="text-xl font-bold mb-1">Connected Wallet</h2>
                    <p className="text-gray-400 text-sm">{truncateAddress(publicKey.toString())}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Account List */}
            {hasSearched && (
              <div className="w-full max-w-4xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">
                    Empty Accounts ({accounts.length})
                  </h3>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Total claimable:</p>
                    <p className="font-bold" style={{ color: accounts.reduce((sum, acc) => sum + acc.lamports, 0) > 0 ? '#86efac' : 'white' }}>
                      {(accounts.reduce((sum, acc) => sum + acc.lamports, 0) * (1 - FEE_PERCENTAGE) / LAMPORTS_PER_SOL).toFixed(4)} SOL
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

                    <div className="bg-gray-800 rounded-lg overflow-hidden" style={{ marginTop: '15px' }}>
                      {accounts.map((account, index) => (
                        <div
                          key={account.pubkey.toString()}
                          className={`flex items-center justify-between gap-4 p-4 bg-gray-900 rounded-lg border ${index === accounts.length - 1 ? 'mb-5' : 'mb-2'}`}
                          style={{ borderColor: '#333' }}
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
                            <div className="text-sm text-gray-300">
                              <span className="text-gray-500">~ {(account.lamports / LAMPORTS_PER_SOL).toFixed(3)} SOL</span>
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
                    </div>

                    {accounts.length === 0 && (
                      <div className="p-8 text-center text-gray-400">
                        No rent-exempt accounts found
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* See for yourself section */}
            <div className="w-full max-w-4xl mt-8 mb-4">
              <h3 className="text-xl font-semibold mb-4 text-center" style={{ marginBottom: '20px' }}>See for yourself 👇👇👇 check how much SOL could other wallets get</h3>
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                {[
                  { address: '4DdrfiDHpmx55i4SPssxVzS9ZaKLb8qr45NKY9Er9nNh', name: 'icecoffee8', image: '/images/icecoffee8.jpeg' },
                  { address: 'CxgPWvH2GoEDENELne2XKAR2z2Fr4shG2uaeyqZceGve', name: 'narracanz', image: '/images/narracanz.jpeg' },
                  { address: 'HyYNVYmnFmi87NsQqWzLJhUTPBKQUfgfhdbBa554nMFF', name: 'shitoshi__', image: '/images/shitoshi__.jpeg' },
                  { address: 'HLLXwFZN9CHTct5K4YpucZ137aji27EkkJ1ZaZE7JVmk', name: 'dumbasss', image: '/images/dumbasss.jpeg' }
                ].map((wallet, index) => (
                  <div 
                    key={wallet.address}
                    className="flex items-center justify-between gap-4 p-4 bg-gray-900 hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => {
                      setSearchKey(wallet.address);
                      handleSearch(wallet.address);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={wallet.image} 
                        alt={wallet.name} 
                        className="w-8 h-8 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-token.png';
                        }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">{wallet.name}</div>
                          <a 
                            href={`https://pump.fun/profile/${wallet.address}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:opacity-80 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <img 
                              src="/images/pumpfunlogo.webp" 
                              alt="PumpFun Profile" 
                              className="w-5 h-5 inline-block"
                            />
                          </a>
                        </div>
                        <div className="font-mono text-sm text-gray-400 flex items-center gap-2">
                          <span className="text-gray-300">{wallet.address}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSearchKey(wallet.address);
                          handleSearch(wallet.address);
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                      >
                        Check SOL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Modal */}
            <FaqModal isOpen={isFaqModalOpen} onClose={() => setIsFaqModalOpen(false)} />
            
            {/* Hidden FAQ Section for SEO */}
            <div className="w-full max-w-4xl">
              <div id="guide-section" className="sr-only" aria-hidden="true">
                <div className="relative">
                  <div>
                    <h3>🔥 How does it work?</h3>
                    <p>
                      If you&apos;ve been aping into pumps on Solana, you may have rekt token accounts with 
                      leftover rent (~0.002 SOL each). This tool helps you claim that SOL back by burning these useless accounts.
                    </p>
                    <p>
                      Learn more about rent on Solana <a href="https://spl_governance.cratus.io multisig">here</a>.
                    </p>
                  </div>

                  <div>
                    <h3>🔎 How do I find rekt accounts?</h3>
                    <p>
                      Connect your wallet or paste any wallet address above. We&apos;ll scan for token accounts that:
                    </p>
                    <div>
                      <div>
                        <span>1.</span>
                        <span>Have 0 tokens left</span>
                      </div>
                      <div>
                        <span>2.</span>
                        <span>Still have rent SOL locked up</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3>💰 What happens when I burn them?</h3>
                    <p>
                      When you burn (close) an empty token account:
                    </p>
                    <div>
                      <div>
                        <span>1.</span>
                        <span>The rent SOL is sent to your wallet</span>
                      </div>
                      <div>
                        <span>2.</span>
                        <span>The empty token account is closed</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3>🚨 Is this safe?</h3>
                    <p>
                      Yes. We only close accounts that have zero tokens and recover the rent SOL.
                    </p>
                  </div>

                  <div>
                    <h3>💸 Any alpha leaks?</h3>
                    <p>
                      Here&apos;s some big brain moves:
                    </p>
                    <div>
                      <div>
                        <span>1.</span>
                        <span>Check your old wallets - your paper hand history might pay off</span>
                      </div>
                      <div>
                        <span>2.</span>
                        <span>Make it a habit to clean up after rugging yourself</span>
                      </div>
                      <div>
                        <span>3.</span>
                        <span>Look up your friends&apos; addresses, and flex on them with their unclaimed SOL</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16">
          <div className="flex flex-col items-center justify-center text-center mb-16">
            <div style={{ marginBottom: '25px' }} />
          </div>

          {/* Custom GIF as background overlay */}
          <div className="abute bottom-0 left-0 right-0 w-full flex justify-center pointer-events-none" style={{ zIndex: 0 }}>
            <div className="max-w-4xl w-full flex justify-center">
              <img 
                src="/images/jeetelmo2.gif" 
                alt="Token Burner Elmo" 
                style={{ 
                  opacity: 0.66,
                  maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)'
                }} 
              />
            </div>
          </div>

          <Footer />
          <div className="bg-gray-900 text-white py-6 px-4 text-sm grid place-items-center" style={{ position: 'relative', zIndex: 10 }}>
            <div className="max-w-2xl" style={{ position: 'relative', zIndex: 10 }}>
              <div className="text-white flex items-center justify-center gap-2 mt-4" style={{ paddingBottom: '10px', position: 'relative', zIndex: 10 }}>
                <span style={{ color: 'white', opacity: 1 }}>Powered by</span>
                <a 
                  href="https://www.helius.dev/solana-rpc-nodes" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center hover:text-white transition-colors"
                  style={{ position: 'relative', zIndex: 10 }}
                >
                  <img 
                    src="https://www.helius.dev/logo.svg" 
                    alt="Helius" 
                    className="h-5 inline-block"
                    style={{ opacity: 1 }}
                  />
                </a>
                <a 
                  href="https://docs.helius.dev" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-white hover:text-white text-sm transition-colors"
                >
                  <span style={{ color: 'white', opacity: 1 }}>View Documentation →</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-2" />
      </div>
    </main>
  );
}

// Add animation for the live feed
const styles = `
  @keyframes continuous-scroll {
    0% { transform: translateY(-40px); }
    20% { transform: translateY(-40px); }
    100% { transform: translateY(0); }
  }
  .animate-continuous-scroll {
    animation: continuous-scroll 1s ease-in-out;
  }
  @keyframes liveBlink {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
      box-shadow: 0 0 8px 2px rgba(34, 197, 94, 0.6);
    }
    50% {
      opacity: 0.4;
      transform: scale(0.8);
      box-shadow: 0 0 0px 0px rgba(34, 197, 94, 0);
    }
  }
`;

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <style jsx global>{styles}</style>
      <HomeContent />
    </Suspense>
  );
}
