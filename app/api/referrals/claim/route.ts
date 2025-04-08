import { NextResponse } from 'next/server';
import { db } from '../../../db';
import { referralEarnings, referralStats } from '../../../db/schema';
import type { ReferralEarning } from '../../../db/types';
import { eq, and } from 'drizzle-orm';

// Claim referral earnings
export async function POST(req: Request) {
  try {
    const { referrerWallet, claimTx } = await req.json();

    // Update all unclaimed earnings for this wallet
    await db.transaction(async (tx: any) => {
      // Get total unclaimed amount
      const unclaimedEarnings = await tx
        .select()
        .from(referralEarnings)
        .where(
          and(
            eq(referralEarnings.referrerWallet, referrerWallet),
            eq(referralEarnings.claimed, false)
          )
        );

      const totalClaimed = unclaimedEarnings.reduce((sum: number, earning: ReferralEarning) => sum + earning.amount, 0);

      // Mark earnings as claimed
      await tx
        .update(referralEarnings)
        .set({
          claimed: true,
          claimTx,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(referralEarnings.referrerWallet, referrerWallet),
            eq(referralEarnings.claimed, false)
          )
        );

      // Update referral stats
      await tx
        .update(referralStats)
        .set({
          totalClaimed: totalClaimed,
          lastUpdated: new Date(),
        })
        .where(eq(referralStats.referrerWallet, referrerWallet));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error claiming referral earnings:', error);
    return NextResponse.json(
      { error: 'Failed to claim referral earnings' },
      { status: 500 }
    );
  }
}
