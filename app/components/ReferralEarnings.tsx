import { useEffect, useState } from 'react';
import { Button, Card, CardBody, CardHeader } from '@nextui-org/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

interface ReferralEarning {
  id: number;
  amount: number;
  burnTx: string;
  claimed: boolean;
  claimTx?: string;
  createdAt: string;
}

interface ReferralStats {
  totalEarned: number;
  totalClaimed: number;
  totalBurns: number;
}

export function ReferralEarnings() {
  const { publicKey, signTransaction } = useWallet();
  const [earnings, setEarnings] = useState<ReferralEarning[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (publicKey) {
      fetchEarnings();
    }
  }, [publicKey]);

  const fetchEarnings = async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(`/api/referrals?wallet=${publicKey.toString()}`);
      const data = await response.json();
      setEarnings(data.earnings);
    } catch (error) {
      console.error('Failed to fetch referral earnings:', error);
    }
  };

  const handleClaim = async () => {
    if (!publicKey || !signTransaction) return;

    setLoading(true);
    try {
      const response = await fetch('/api/referrals/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referrerWallet: publicKey.toString(),
          claimTx: 'manual-claim-' + Date.now(),
        }),
      });

      if (response.ok) {
        await fetchEarnings();
      }
    } catch (error) {
      console.error('Failed to claim referral earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return null;
  }

  const unclaimedAmount = earnings
    .filter(e => !e.claimed)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalAmount = earnings.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex items-center justify-between gap-4 mt-5" style={{ marginTop: '20px' }}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#ab9ff2]">Total Referral Earnings:</span>
          <span className="text-sm text-white">
            {(totalAmount / LAMPORTS_PER_SOL).toFixed(4)} SOL
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#ab9ff2]">Unclaimed Referral Earnings:</span>
          <span className="text-sm text-white">
            {(unclaimedAmount / LAMPORTS_PER_SOL).toFixed(4)} SOL
          </span>
        </div>
      </div>
      <Button
        onClick={handleClaim}
        isDisabled={unclaimedAmount === 0}
        isLoading={loading}
        size="sm"
        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${unclaimedAmount === 0 ? 'bg-[#ab9ff2] opacity-50 cursor-not-allowed' : 'bg-[#ab9ff2] text-white hover:opacity-80'}`}
      >
        Send Earnings
      </Button>
    </div>
  );
}
