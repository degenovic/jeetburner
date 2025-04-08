-- Create referral_earnings table
CREATE TABLE IF NOT EXISTS referral_earnings (
  id SERIAL PRIMARY KEY,
  referrer_wallet VARCHAR(44) NOT NULL,
  amount INTEGER NOT NULL,
  burn_tx VARCHAR(88) NOT NULL,
  claimed BOOLEAN DEFAULT FALSE,
  claim_tx VARCHAR(88),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create referral_stats table
CREATE TABLE IF NOT EXISTS referral_stats (
  id SERIAL PRIMARY KEY,
  referrer_wallet VARCHAR(44) NOT NULL,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_claimed INTEGER NOT NULL DEFAULT 0,
  total_burns INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referral_earnings_wallet ON referral_earnings(referrer_wallet);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_burn_tx ON referral_earnings(burn_tx);
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_stats_wallet ON referral_stats(referrer_wallet);
