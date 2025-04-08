import { InferModel } from 'drizzle-orm';
import { referralEarnings, referralStats } from './schema';

export type ReferralEarning = InferModel<typeof referralEarnings>;
export type ReferralStat = InferModel<typeof referralStats>;
export type NewReferralEarning = InferModel<typeof referralEarnings, 'insert'>;
export type NewReferralStat = InferModel<typeof referralStats, 'insert'>;
