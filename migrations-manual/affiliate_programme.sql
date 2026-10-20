-- =============================================================================
-- ThatOne Affiliate Programme — greenfield schema
-- Path: migrations-manual/affiliate_programme.sql
-- Applied manually via psql. NOT part of drizzle-kit's migration chain.
-- Safe to re-run (IF NOT EXISTS + DO-blocks for enums + ON CONFLICT for seed).
-- Does NOT touch any existing table.
-- =============================================================================

BEGIN;

-- ── Enums ───────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE affiliate_status AS ENUM ('pending','approved','rejected','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE affiliate_commission_status AS ENUM ('pending','approved','paid','reversed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE affiliate_tier AS ENUM ('starter','growth','creator');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE affiliate_package_category AS ENUM ('individual','business');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── affiliate_links ─────────────────────────────────────────────────
-- One row per affiliate application. Status drives the workflow.
-- `referral_slug` is set only on approval (unapproved users cannot share).
CREATE TABLE IF NOT EXISTS affiliate_links (
  id               serial PRIMARY KEY,
  user_id          integer NOT NULL REFERENCES users(id),
  affiliate_code   varchar(64) NOT NULL UNIQUE,
  referral_slug    varchar(64) UNIQUE,
  status           affiliate_status NOT NULL DEFAULT 'pending',
  affiliate_name   varchar(255) NOT NULL,
  description      text,
  applied_at       timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at      timestamp,
  approved_by      integer REFERENCES users(id),
  rejected_reason  text,
  created_at       timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_status ON affiliate_links(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_user   ON affiliate_links(user_id);

-- ── affiliate_tracking ──────────────────────────────────────────────
-- One row per click on an affiliate's referral link.
CREATE TABLE IF NOT EXISTS affiliate_tracking (
  id                serial PRIMARY KEY,
  affiliate_link_id integer NOT NULL REFERENCES affiliate_links(id),
  tracking_token    varchar(128) NOT NULL UNIQUE,
  click_at          timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source            varchar(50),
  ip_address        varchar(45),
  user_agent        text,
  created_at        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_affiliate_tracking_link ON affiliate_tracking(affiliate_link_id);

-- ── affiliate_attributions ──────────────────────────────────────────
-- One row per attributed customer. UNIQUE(user_id) enforces "one customer,
-- one affiliate, forever". commission_window_ends_at = registered_at + 90d.
CREATE TABLE IF NOT EXISTS affiliate_attributions (
  id                         serial PRIMARY KEY,
  user_id                    integer NOT NULL UNIQUE REFERENCES users(id),
  affiliate_link_id          integer NOT NULL REFERENCES affiliate_links(id),
  click_at                   timestamp NOT NULL,
  registered_at              timestamp NOT NULL,
  commission_window_ends_at  timestamp NOT NULL,
  created_at                 timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_affiliate_attributions_link ON affiliate_attributions(affiliate_link_id);

-- ── affiliate_commissions ───────────────────────────────────────────
-- One row per qualifying purchase. UNIQUE(source_type, source_id) is the
-- idempotency key — duplicate webhooks cannot create duplicate commissions.
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id                      serial PRIMARY KEY,
  affiliate_link_id       integer NOT NULL REFERENCES affiliate_links(id),
  customer_user_id        integer NOT NULL REFERENCES users(id),
  attribution_id          integer NOT NULL REFERENCES affiliate_attributions(id),
  package_id              varchar(64) NOT NULL,
  package_credits         integer NOT NULL,
  purchase_category       affiliate_package_category NOT NULL,
  qualifying_amount_cents integer NOT NULL,
  currency                varchar(3) NOT NULL DEFAULT 'ZAR',
  applied_rate            numeric(5,2) NOT NULL,
  commission_amount_cents integer NOT NULL,
  tier                    affiliate_tier,
  status                  affiliate_commission_status NOT NULL DEFAULT 'pending',
  source_type             varchar(32) NOT NULL,
  source_id               varchar(255) NOT NULL,
  calculation_details     jsonb NOT NULL,
  approved_at             timestamp,
  reversed_at             timestamp,
  reversed_reason         text,
  paid_at                 timestamp,
  payout_batch_id         integer,
  created_at              timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_affiliate_commissions_source UNIQUE (source_type, source_id)
);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_link   ON affiliate_commissions(affiliate_link_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON affiliate_commissions(status);
-- Partial index used by the tier aggregation (§3 of client file: individual only)
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_month_indiv
  ON affiliate_commissions(affiliate_link_id, created_at)
  WHERE purchase_category = 'individual';

-- ── affiliate_settings ──────────────────────────────────────────────
-- Single row. Seeded below. Admin-editable via affiliate-admin router.
CREATE TABLE IF NOT EXISTS affiliate_settings (
  id                         serial PRIMARY KEY,
  setting_key                varchar(32) NOT NULL UNIQUE DEFAULT 'default',
  starter_rate               numeric(5,2) NOT NULL DEFAULT 10.00,
  growth_rate                numeric(5,2) NOT NULL DEFAULT 12.50,
  creator_rate               numeric(5,2) NOT NULL DEFAULT 15.00,
  growth_monthly_threshold   numeric(12,2) NOT NULL DEFAULT 2500.00,
  creator_monthly_threshold  numeric(12,2) NOT NULL DEFAULT 7500.00,
  retailer_package_rate      numeric(5,2) NOT NULL DEFAULT 5.00,
  business_timezone          varchar(64) NOT NULL DEFAULT 'Africa/Johannesburg',
  updated_at                 timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by                 integer REFERENCES users(id)
);
INSERT INTO affiliate_settings (setting_key) VALUES ('default')
  ON CONFLICT (setting_key) DO NOTHING;

-- ── affiliate_settings_audit ────────────────────────────────────────
-- One row per changed setting field. §8 of client file.
CREATE TABLE IF NOT EXISTS affiliate_settings_audit (
  id             serial PRIMARY KEY,
  setting_key    varchar(64) NOT NULL,
  previous_value text,
  new_value      text,
  actor_id       integer NOT NULL REFERENCES users(id),
  created_at     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_affiliate_settings_audit_key
  ON affiliate_settings_audit(setting_key, created_at DESC);

-- ── affiliate_payout_batches ────────────────────────────────────────
-- Manual monthly payouts (§7). One row per affiliate per month.
CREATE TABLE IF NOT EXISTS affiliate_payout_batches (
  id                 serial PRIMARY KEY,
  affiliate_link_id  integer NOT NULL REFERENCES affiliate_links(id),
  period_start       date NOT NULL,
  period_end         date NOT NULL,
  total_amount_cents integer NOT NULL,
  commission_count   integer NOT NULL,
  status             varchar(20) NOT NULL DEFAULT 'pending',
  marked_paid_at     timestamp,
  marked_paid_by     integer REFERENCES users(id),
  notes              text,
  created_at         timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_affiliate_payout_batches_period UNIQUE (affiliate_link_id, period_start, period_end)
);

-- FK from commissions to batches (added after both tables exist)
ALTER TABLE affiliate_commissions
  DROP CONSTRAINT IF EXISTS fk_affiliate_commissions_batch;
ALTER TABLE affiliate_commissions
  ADD CONSTRAINT fk_affiliate_commissions_batch
  FOREIGN KEY (payout_batch_id) REFERENCES affiliate_payout_batches(id);

COMMIT;