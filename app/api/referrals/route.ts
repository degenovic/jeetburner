import { NextResponse } from 'next/server';
import { db } from '../../db';
import { referralEarnings, referralStats } from '../../db/schema';
import type { ReferralEarning, ReferralStat } from '../../db/types';
import { eq } from 'drizzle-orm';
import { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';

// Record a new referral earning
export async function POST(req: Request) {
  try {
    const { referrerWallet, amount, burnTx } = await req.json();

    // Record the earning
    const [earning] = await db.insert(referralEarnings).values({
      referrerWallet,
      amount,
      burnTx,
    }).returning();

    // Update referral stats
    await db.transaction(async (tx: any) => {
      const [stats] = await tx
        .select()
        .from(referralStats)
        .where(eq(referralStats.referrerWallet, referrerWallet))
        .limit(1);

      if (stats) {
        await tx
          .update(referralStats)
          .set({
            totalEarned: stats.totalEarned + amount,
            totalBurns: stats.totalBurns + 1,
            lastUpdated: new Date(),
          })
          .where(eq(referralStats.referrerWallet, referrerWallet));
      } else {
        await tx.insert(referralStats).values({
          referrerWallet,
          totalEarned: amount,
          totalBurns: 1,
        });
      }
    });

    return NextResponse.json(earning);
  } catch (error) {
    console.error('Error recording referral earning:', error);
    return NextResponse.json(
      { error: 'Failed to record referral earning' },
      { status: 500 }
    );
  }
}

// Get referral earnings for a wallet
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const earnings = await db
      .select()
      .from(referralEarnings)
      .where(eq(referralEarnings.referrerWallet, wallet))
      .orderBy(referralEarnings.createdAt);

    const stats = await db
      .select()
      .from(referralStats)
      .where(eq(referralStats.referrerWallet, wallet))
      .limit(1);

    return NextResponse.json({
      earnings,
      stats: stats[0] || null,
    });
  } catch (error) {
    console.error('Error fetching referral earnings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral earnings' },
      { status: 500 }
    );
  }
}
