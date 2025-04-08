import { pgTable, serial, varchar, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

// Table for referral earnings
export const referralEarnings = pgTable('referral_earnings', {
  id: serial('id').primaryKey(),
  referrerWallet: varchar('referrer_wallet', { length: 44 }).notNull(),
  amount: integer('amount').notNull(), // Amount in lamports
  burnTx: varchar('burn_tx', { length: 88 }).notNull(), // Transaction hash of the burn
  claimed: boolean('claimed').default(false),
  claimTx: varchar('claim_tx', { length: 88 }), // Transaction hash of the claim
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Table for referral stats
export const referralStats = pgTable('referral_stats', {
  id: serial('id').primaryKey(),
  referrerWallet: varchar('referrer_wallet', { length: 44 }).notNull(),
  totalEarned: integer('total_earned').notNull().default(0), // Total earned in lamports
  totalClaimed: integer('total_claimed').notNull().default(0), // Total claimed in lamports
  totalBurns: integer('total_burns').notNull().default(0), // Number of successful burns
  lastUpdated: timestamp('last_updated').defaultNow(),
});
