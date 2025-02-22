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
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!process.env.NEXT_PUBLIC_DEVNET_RPC_URL) {
    console.error('Missing devnet RPC URL in environment variables');
  }

  const connection = useMemo(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_DEVNET_RPC_URL;
    
    if (!rpcUrl) {
      toast.error('No RPC URL configured. Please check your environment variables.');
      return new Connection('https://api.devnet.solana.com');  // Fallback to public devnet
    }
    
    console.log('Initializing connection with RPC URL:', rpcUrl);
    
    return new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
      wsEndpoint: undefined // Disable WebSocket
    });
  }, []);

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing connection...');
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        console.log('Connected successfully!', {
          blockhash,
          lastValidBlockHeight
        });
      } catch (err: unknown) {
        console.error('Failed to connect:', err);
        if (err instanceof Error) {
          console.error('Error details:', {
            message: err.message,
            name: err.name,
            stack: err.stack
          });
        }
        toast.error('Failed to connect to Solana node. Please check your RPC configuration.');
      }
    };

    testConnection();
  }, [connection]);

  const fetchAccounts = useCallback(async () => {
    if (!publicKey || !connection) return;
    
    setLoading(true);
    
    try {
      const { blockhash } = await connection.getLatestBlockhash();
      console.log('Connected successfully! Latest blockhash:', blockhash);
      
      const response = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID },
        'confirmed'
      );

      const emptyAccounts: TokenAccount[] = response.value
        .filter(({ account }) => {
          const parsedInfo = account.data.parsed.info;
          return parsedInfo.tokenAmount.uiAmount === 0 && 
                 parsedInfo.tokenAmount.amount === "0";
        })
        .map(({ pubkey, account }) => ({
          pubkey: new PublicKey(pubkey),
          lamports: account.lamports,
          mint: account.data.parsed.info.mint,
          name: account.data.parsed.info.mint || 'Unknown Token',
          symbol: 'EMPTY'
        }));

      console.log('Found empty accounts:', emptyAccounts);
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
  }, [publicKey, connection]);

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
      
      fetchAccounts();
      
    } catch (error: unknown) {
      console.error('Error burning account:', error);
      
      if (error instanceof Error) {
        toast.error(`Failed to close account: ${error.message}`);
      } else {
        toast.error('Failed to close account. Please try again.');
      }
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
    } catch (error: unknown) {
      console.error('Error burning accounts:', error);
      
      if (error instanceof Error) {
        toast.error(`Failed to burn selected accounts: ${error.message}`);
      } else {
        toast.error('Failed to burn selected accounts. Please try again.');
      }
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
                    <p className="font-bold">
                      {(accounts.reduce((sum, acc) => sum + acc.lamports, 0) / LAMPORTS_PER_SOL).toFixed(4)} SOL
                    </p>
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
                              <p className="font-medium">{account.name}</p>
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
