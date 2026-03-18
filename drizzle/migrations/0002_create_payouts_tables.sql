-- Create boutique bank accounts table
CREATE TABLE IF NOT EXISTS boutique_bank_accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  boutique_id INT NOT NULL UNIQUE,
  account_holder_name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  branch_code VARCHAR(20),
  account_type ENUM('checking', 'savings') NOT NULL DEFAULT 'checking',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (boutique_id) REFERENCES boutiques(id) ON DELETE CASCADE
);

-- Create payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  boutique_id INT NOT NULL,
  payout_period_start DATE NOT NULL,
  payout_period_end DATE NOT NULL,
  total_revenue DECIMAL(10, 2) NOT NULL DEFAULT 0,
  yoko_fees DECIMAL(10, 2) NOT NULL DEFAULT 0,
  styleswap_commission DECIMAL(10, 2) NOT NULL DEFAULT 0,
  boutique_payout DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  payout_date TIMESTAMP NULL,
  reference_number VARCHAR(100) UNIQUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (boutique_id) REFERENCES boutiques(id) ON DELETE CASCADE,
  INDEX idx_boutique_status (boutique_id, status),
  INDEX idx_payout_date (payout_date)
);

-- Create payout transactions table (for tracking individual orders in a payout)
CREATE TABLE IF NOT EXISTS payout_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payout_id INT NOT NULL,
  order_id INT NOT NULL,
  order_amount DECIMAL(10, 2) NOT NULL,
  yoko_fee DECIMAL(10, 2) NOT NULL,
  styleswap_commission DECIMAL(10, 2) NOT NULL,
  boutique_share DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payout_id) REFERENCES payouts(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES shopOrders(id) ON DELETE CASCADE,
  INDEX idx_payout_id (payout_id)
);

-- Create payout audit log table
CREATE TABLE IF NOT EXISTS payout_audit_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  payout_id INT,
  action VARCHAR(100) NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  actor_id INT,
  actor_type ENUM('system', 'admin', 'boutique') DEFAULT 'system',
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payout_id) REFERENCES payouts(id) ON DELETE SET NULL,
  INDEX idx_payout_id (payout_id),
  INDEX idx_created_at (created_at)
);
