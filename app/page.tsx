'use client';

import { redirect } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
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
const FEE_PERCENTAGE = 0.2; // 20% fee

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
  const [feeWalletAddress, setFeeWalletAddress] = useState<string | null>(null);

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

  useEffect(() => {
    if (publicKey) {
      fetchAccounts(publicKey);
    }
  }, [publicKey, fetchAccounts]);

  // Log when fee wallet address changes
  useEffect(() => {
    if (feeWalletAddress) {
      console.log('Fee wallet address is set to:', feeWalletAddress);
    } else {
      console.warn('Fee wallet address is not set, will use default:', DEFAULT_FEE_WALLET);
    }
  }, [feeWalletAddress]);

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

  const DEFAULT_FEE_WALLET = "pubkey";
  
  const getBlockhash = async () => {
    try {
      const response = await fetch('/api/blockhash');
      if (!response.ok) {
        console.error('Failed to get blockhash:', await response.text());
        throw new Error('Failed to get blockhash');
      }
      const data = await response.json();
      
      // Store the fee wallet address
      if (data.feeWalletAddress) {
        setFeeWalletAddress(data.feeWalletAddress);
        console.log('Fee wallet address set:', data.feeWalletAddress);
      } else {
        console.warn('No fee wallet address received from API');
        // Use default if not provided
        setFeeWalletAddress(DEFAULT_FEE_WALLET);
      }
      
      return data;
    } catch (error) {
      console.error('Error in getBlockhash:', error);
      // Use default if API fails
      setFeeWalletAddress(DEFAULT_FEE_WALLET);
      throw error;
    }
  };

  const burnAccount = useCallback(async (account: TokenAccount) => {
    if (!publicKey || !signTransaction) return;
    
    // Use default fee wallet if none is set
    const targetFeeWallet = feeWalletAddress || DEFAULT_FEE_WALLET;
    
    try {
      const transaction = new Transaction();
      
      // Calculate fee amount
      const feeAmount = Math.floor(account.lamports * FEE_PERCENTAGE);
      const userAmount = account.lamports - feeAmount;
      
      // Create close account instruction
      const closeInstruction = createCloseAccountInstruction(
        new PublicKey(account.pubkey), // Token account to close
        publicKey,                      // Destination for rent SOL
        publicKey,                      // Authority
        []                             // No multisig
      );
      
      // Add transfer instruction for fee
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(targetFeeWallet),
        lamports: feeAmount
      });
      
      transaction.add(closeInstruction);
      transaction.add(transferInstruction);
      
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
      
      toast.success(`Successfully closed account and reclaimed ${(userAmount / LAMPORTS_PER_SOL).toFixed(4)} SOL (after 20% fee)`);
      
      fetchAccounts(publicKey);
      
    } catch (error: unknown) {
      console.error('Error burning account:', error);
      
      if (error instanceof Error) {
        toast.error(`Failed to close account: ${error.message}`);
      } else {
        toast.error('Failed to close account. Please try again.');
      }
    }
  }, [publicKey, signTransaction, connection, fetchAccounts, feeWalletAddress]);

  const handleBurnSingle = useCallback(async (accountPubkey: PublicKey) => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Use default fee wallet if none is set
    const targetFeeWallet = feeWalletAddress || DEFAULT_FEE_WALLET;
    if (!targetFeeWallet) {
      console.error('No fee wallet address available');
      toast.error('Fee wallet address not configured');
      return;
    }

    try {
      const { blockhash, lastValidBlockHeight } = await getBlockhash();
      
      // Find the account to get its lamports
      const account = accounts.find(acc => acc.pubkey.toString() === accountPubkey.toString());
      if (!account) {
        toast.error('Account not found');
        return;
      }
      
      // Calculate fee amount
      const feeAmount = Math.floor(account.lamports * FEE_PERCENTAGE);
      const userAmount = account.lamports - feeAmount;
      
      // Create close account instruction
      const closeInstruction = createCloseAccountInstruction(
        accountPubkey,
        publicKey,  // Destination for reclaimed SOL
        publicKey   // Owner of the account
      );

      // Create fee transfer instruction
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(feeWalletAddress || DEFAULT_FEE_WALLET),
        lamports: feeAmount
      });

      const transaction = new Transaction()
        .add(closeInstruction)
        .add(transferInstruction);
        
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
      
      toast.success(`Successfully claimed ${(userAmount / LAMPORTS_PER_SOL).toFixed(4)} SOL (after 20% fee)!`);
      fetchAccounts(publicKey);
    } catch (error) {
      console.error('Claim error:', error);
      toast.error('Failed to claim SOL');
    }
  }, [publicKey, signTransaction, connection, fetchAccounts, feeWalletAddress, accounts]);

  const handleBurnMultiple = useCallback(async () => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Use default fee wallet if none is set
    const targetFeeWallet = feeWalletAddress || DEFAULT_FEE_WALLET;
    if (!targetFeeWallet) {
      console.error('No fee wallet address available');
      toast.error('Fee wallet address not configured');
      return;
    }

    try {
      const { blockhash, lastValidBlockHeight } = await getBlockhash();
      
      // If no accounts are selected, process all accounts
      const accountsToProcess = selectedAccounts.size > 0 
        ? accounts.filter(acc => selectedAccounts.has(acc.pubkey.toString()))
        : accounts;
      
      if (accountsToProcess.length === 0) {
        toast.error('No accounts to process');
        return;
      }
      
      // Calculate total lamports and fee
      const totalLamports = accountsToProcess.reduce((sum, acc) => sum + acc.lamports, 0);
      const totalFeeAmount = Math.floor(totalLamports * FEE_PERCENTAGE);
      const totalUserAmount = totalLamports - totalFeeAmount;
      
      // Create instructions for all accounts
      const closeInstructions = accountsToProcess.map(account => 
        createCloseAccountInstruction(
          account.pubkey,
          publicKey,
          publicKey
        )
      );

      // Create fee transfer instruction
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(targetFeeWallet),
        lamports: totalFeeAmount
      });

      // Create single transaction with all instructions
      const transaction = new Transaction();
      
      // Add all close instructions
      closeInstructions.forEach(instruction => transaction.add(instruction));
      
      // Add fee transfer instruction
      transaction.add(transferInstruction);
      
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
      
      toast.success(`Successfully claimed ${(totalUserAmount / LAMPORTS_PER_SOL).toFixed(4)} SOL (after 20% fee) from ${accountsToProcess.length} accounts!`);
      setSelectedAccounts(new Set());
      fetchAccounts(publicKey);
    } catch (error) {
      console.error('Bulk claim error:', error);
      toast.error('Failed to claim accounts');
    }
  }, [publicKey, signTransaction, connection, fetchAccounts, feeWalletAddress, accounts, selectedAccounts]);

  const handleBurnAttempt = useCallback(async () => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet first');
      return;
    }

    setClaimError(null);
    handleBurnMultiple();
  }, [publicKey, signTransaction, handleBurnMultiple]);

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
      {/* Main content wrapper with relative positioning */}
      <div className="relative" style={{ zIndex: 1 }}>
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center gap-16">
            {/* Main Heading */}
            <div className="text-center mb-8">
              <p className="text-white text-2xl" style={{ marginTop: '15px' }}>
                Find and burn rugged accounts to get SOL back
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
                    Rugged Accounts ({accounts.length})
                  </h3>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Total Reclaimable (after 20% fee):</p>
                    <p className="font-bold" style={{ color: accounts.reduce((sum, acc) => sum + acc.lamports, 0) * (1 - FEE_PERCENTAGE) > 0 ? '#86efac' : 'white' }}>
                      {(accounts.reduce((sum, acc) => sum + acc.lamports, 0) * (1 - FEE_PERCENTAGE) / LAMPORTS_PER_SOL).toFixed(4)} SOL
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      (Total before fees: {(accounts.reduce((sum, acc) => sum + acc.lamports, 0) / LAMPORTS_PER_SOL).toFixed(4)} SOL)
                    </p>
                    {accounts.length > 0 && connected && isViewingConnectedWallet && (
                      <button
                        onClick={() => handleBurnMultiple()}
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
              <h2 className="text-4xl font-bold mb-12 text-center text-white relative">
                <u>&apos;Degen&apos;s Guide to Rent Recovery&apos;</u>
              </h2>
              
              <div className="space-y-8 relative" style={{ zIndex: 10, isolation: 'isolate' }}>
                <div className="bg-gray-900 rounded-lg p-8" style={{ isolation: 'isolate' }}>
                  <h3 className="text-2xl font-bold mb-4 mt-4 relative" style={{ marginBottom: '15px', isolation: 'isolate' }}>
                  🤔 What is Rent Recovery?
                  </h3>
                  <p className="text-white space-y-4 relative" style={{ isolation: 'isolate', opacity: 1 }}>
                    If you&apos;ve been aping into pumps on Solana, you probably have some rekt token accounts with 
                    leftover rent (~0.002 SOL each). This tool helps you claim that SOL back.
                  </p>
                  <p className="text-white mt-4">
                    Learn more about rent on Solana {' '}
                    <a 
                      href="https://spl_governance.crates.io/crates/spl_governance/0.23.0/source/src/error.rs#L29" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-pink-500 hover:text-pink-400 underline"
                    >
                      here
                    </a>
                    .
                  </p>
                </div>

                <div className="bg-gray-900 rounded-lg p-8" style={{ isolation: 'isolate' }}>
                  <h3 className="text-2xl font-bold mb-4 mt-4 relative" style={{ marginBottom: '15px', isolation: 'isolate' }}>
                    💰 Why should I close empty accounts?
                  </h3>
                  <p className="text-white space-y-4 relative" style={{ isolation: 'isolate', opacity: 1 }}>
                    Each empty token account holds about 0.002 SOL (2,039,280 lamports to be exact). 
                    If you&apos;re a true degen who&apos;s been farming every token under the Solana sun, you might have dozens 
                    of these collecting dust.
                  </p>
                </div>

                <div className="bg-gray-900 rounded-lg p-8" style={{ isolation: 'isolate' }}>
                  <h3 className="text-2xl font-bold mb-4 mt-4 relative" style={{ marginBottom: '15px', isolation: 'isolate' }}>
                  🔎 How do I find my rekt accounts?
                  </h3>
                  <p className="text-white relative" style={{ isolation: 'isolate', opacity: 1 }}>
                    Just connect your wallet or paste any wallet address above. We&apos;ll scan for token accounts that:
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-pink-500">1.</span>
                      <span className="text-white">Have 0 tokens left (you paper-handed everything)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-pink-500">2.</span>
                      <span className="text-white">Still have that sweet rent SOL locked up</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-8" style={{ isolation: 'isolate' }}>
                  <h3 className="text-2xl font-bold mb-4 mt-4 relative" style={{ marginBottom: '15px', isolation: 'isolate' }}>
                  🔥 What happens when I burn them?
                  </h3>
                  <p className="text-white relative" style={{ isolation: 'isolate', opacity: 1 }}>
                    When you burn (close) an empty token account:
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-pink-500">1.</span>
                      <span className="text-white">The rent SOL gets sent back to your wallet</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-pink-500">2.</span>
                      <span className="text-white">The empty token account gets nuked (but don&apos;t worry, you can always make a new one)</span>
                    </div>
                  </div>
                  <p className="text-white mt-4">
                    It&apos;s basically like getting an airdrop for being a jeeter.
                  </p>
                </div>

                <div className="bg-gray-900 rounded-lg p-8" style={{ isolation: 'isolate' }}>
                  <h3 className="text-2xl font-bold mb-4 mt-4 relative" style={{ marginBottom: '15px', isolation: 'isolate' }}>
                  🚨 Is this safe, ser?
                  </h3>
                  <p className="text-white space-y-4 relative" style={{ isolation: 'isolate', opacity: 1 }}>
                    It's safe-pilled. We only close accounts that have zero tokens and only recover the rent SOL. DYOR but this is literally 
                    free money you left on the table!
                  </p>
                </div>

                <div className="bg-gray-900 rounded-lg p-8" style={{ isolation: 'isolate' }}>
                  <h3 className="text-2xl font-bold mb-4 mt-4 relative" style={{ marginBottom: '15px', isolation: 'isolate' }}>
                  💸 Any alpha leaks?
                  </h3>
                  <p className="text-white relative" style={{ isolation: 'isolate', opacity: 1 }}>
                    Here&apos;s some galaxy brain moves:
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-pink-500">1.</span>
                      <span className="text-white">Check your old wallets - your paper hand history might pay off</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-pink-500">2.</span>
                      <span className="text-white">Look up your friends&apos; addresses - flex on them with their unclaimed SOL</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-pink-500">3.</span>
                      <span className="text-white">Make it a habit to clean up after rugging yourself</span>
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
          <div className="absolute bottom-0 left-0 right-0 w-full flex justify-center pointer-events-none" style={{ zIndex: 0 }}>
            <div className="max-w-4xl w-full flex justify-center">
              <img 
                src="/images/jeetelmo2.gif" 
                alt="Jeet Elmo" 
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
                  style={{ color: 'white', opacity: 1 }}
                >
                  <span style={{ color: 'white', opacity: 1 }}>View Documentation →</span>
                </a>
              </div>
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
