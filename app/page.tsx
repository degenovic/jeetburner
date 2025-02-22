'use client';

import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js';
import { createCloseAccountInstruction } from '@solana/spl-token';
import { toast } from 'react-hot-toast';
import Header from './components/Header';
import { Footer } from './components/Footer';

interface TokenAccount {
  pubkey: PublicKey;
  mint: string;
  name: string;
  symbol: string;
  lamports: number;
}

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

export default function Home() {
  const { publicKey, signTransaction, connected } = useWallet();
  const [accounts, setAccounts] = useState<TokenAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [network, setNetwork] = useState<'mainnet-beta' | 'devnet'>('devnet');
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!process.env.NEXT_PUBLIC_DEVNET_RPC_URL || !process.env.NEXT_PUBLIC_MAINNET_RPC_URL) {
    console.error('Missing RPC URLs in environment variables');
  }

  const RPC_URLS = {
    'devnet': process.env.NEXT_PUBLIC_DEVNET_RPC_URL,
    'mainnet-beta': process.env.NEXT_PUBLIC_MAINNET_RPC_URL
  };

  const connection = useMemo(() => {
    const endpoint = RPC_URLS[network];
    
    if (!endpoint) {
      toast.error(`No RPC URL configured for ${network}. Please check your environment variables.`);
      return null;
    }
    
    console.log('Using Helius RPC endpoint for', network);
    
    return new Connection(endpoint, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
      wsEndpoint: undefined,
      fetch: (url, options) => {
        const headers = {
          ...options?.headers,
          'Content-Type': 'application/json',
        };
        
        // Helius specific configuration
        return fetch(url, {
          ...options,
          headers,
          cache: 'no-store', // Ensure fresh data
          method: 'POST',    // Helius prefers POST
        });
      }
    });
  }, [network]);

  const fetchAccounts = useCallback(async () => {
    if (!publicKey) return;
    
    try {
      setLoading(true);
      console.log('Fetching accounts for:', publicKey.toString());
      
      // First verify the connection
      try {
        const version = await connection.getVersion();
        console.log('Connected to Solana node version:', version);
      } catch (error) {
        console.error('Failed to connect to RPC:', error);
        toast.error('Failed to connect to Solana network. Please try again.');
        return;
      }
      
      // Then fetch the accounts
      const response = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID },
        'confirmed'
      );
      
      console.log('Raw response:', response);
      
      // Filter for accounts that have 0 token balance but still have rent-exempt SOL
      const emptyAccounts = response.value.filter(item => {
        try {
          const tokenAmount = item.account.data.parsed.info.tokenAmount;
          const hasZeroBalance = tokenAmount.amount === '0';
          const hasSol = item.account.lamports > 0;
          
          console.log('Account:', {
            pubkey: item.pubkey.toString(),
            lamports: item.account.lamports,
            balance: tokenAmount.amount,
            hasZeroBalance,
            hasSol
          });
          
          return hasZeroBalance && hasSol;
        } catch (error) {
          console.error('Error processing account:', error);
          return false;
        }
      });

      console.log('Empty accounts found:', emptyAccounts.length);
      
      const accountsWithInfo = emptyAccounts.map(item => ({
        pubkey: new PublicKey(item.pubkey),
        lamports: item.account.lamports,
        mint: item.account.data.parsed.info.mint,
        tokenAmount: item.account.data.parsed.info.tokenAmount,
        name: 'Empty Token Account',
        symbol: 'EMPTY'
      }));

      console.log('Parsed accounts:', accountsWithInfo);
      setAccounts(accountsWithInfo);
      setRetryCount(0);
      
    } catch (error) {
      console.error('Error fetching accounts:', error);
      
      if (error.message.includes('429') && retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        toast.error(`Rate limited. Retrying in ${delay/1000} seconds...`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchAccounts(), delay);
      } else {
        toast.error('Failed to fetch accounts: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection, retryCount]);

  const burnAccount = useCallback(async (account: TokenAccount) => {
    if (!publicKey || !signTransaction) return;
    
    try {
      const transaction = new Transaction();
      
      // Create instruction to close the token account
      const closeInstruction = createCloseAccountInstruction(
        new PublicKey(account.pubkey), // Token account to close
        publicKey,                      // Destination for rent SOL
        publicKey,                      // Authority
        []                             // No multisig
      );
      
      transaction.add(closeInstruction);
      
      // Sign and send transaction
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
      
      // Refresh the accounts list
      fetchAccounts();
      
    } catch (error) {
      console.error('Error burning account:', error);
      toast.error('Failed to close account: ' + error.message);
    }
  }, [publicKey, signTransaction, connection, fetchAccounts]);

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
      fetchAccounts();
    } catch (error) {
      console.error('Error burning accounts:', error);
      toast.error('Failed to burn selected accounts');
    }
  };

  useEffect(() => {
    if (connected && mounted) {
      fetchAccounts();
    }
  }, [connected, fetchAccounts, mounted]);

  const totalReclaimable = accounts.reduce((sum, acc) => sum + acc.lamports, 0);

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-black">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-8">
          <div className="flex items-center gap-4">
            <div suppressHydrationWarning>
              <WalletMultiButton />
            </div>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value as 'mainnet-beta' | 'devnet')}
              className="bg-gray-700 text-white rounded px-4 py-2"
            >
              <option value="devnet">Devnet</option>
              <option value="mainnet-beta">Mainnet</option>
            </select>
          </div>

          {connected && (
            <>
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Your Wallet</h2>
                <p className="text-gray-400">{publicKey?.toString()}</p>
              </div>

              <div className="w-full max-w-4xl">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">
                    Rent-exempt Accounts ({accounts.length})
                  </h3>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Total Reclaimable:</p>
                    <p className="font-bold">{(totalReclaimable / LAMPORTS_PER_SOL).toFixed(4)} SOL</p>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8">Loading accounts...</div>
                ) : (
                  <>
                    {accounts.length > 0 && (
                      <div className="mb-4">
                        <button
                          onClick={burnSelected}
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
                            <div>
                              <p className="font-medium">{account.name} ({account.symbol})</p>
                              <p className="text-sm text-gray-400">{account.pubkey.toString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-medium">
                              {(account.lamports / LAMPORTS_PER_SOL).toFixed(4)} SOL
                            </p>
                            <button
                              onClick={() => burnAccount(account)}
                              className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
                            >
                              Burn
                            </button>
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
            </>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
