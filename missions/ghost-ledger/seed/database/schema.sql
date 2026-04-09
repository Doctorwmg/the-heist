-- Ghost Ledger Mission: NovaPay Database Schema
-- This schema is loaded into the player's container PostgreSQL instance

CREATE SCHEMA IF NOT EXISTS novapay;
SET search_path TO novapay, public;

-- Accounts table: NovaPay merchant/vendor accounts
CREATE TABLE accounts (
    account_id SERIAL PRIMARY KEY,
    account_name VARCHAR(200) NOT NULL,
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('merchant', 'vendor', 'internal', 'settlement')),
    routing_number VARCHAR(20),
    account_number VARCHAR(30),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- Users table: system users with access to NovaPay platform
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(200),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'analyst', 'service', 'auditor')),
    department VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Transactions table: the main ledger
CREATE TABLE transactions (
    txn_id SERIAL PRIMARY KEY,
    txn_ref VARCHAR(40) NOT NULL,
    source_account_id INTEGER REFERENCES accounts(account_id),
    dest_account_id INTEGER REFERENCES accounts(account_id),
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    txn_type VARCHAR(30) NOT NULL CHECK (txn_type IN ('payment', 'refund', 'transfer', 'reversal', 'adjustment', 'fee')),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
    description TEXT,
    created_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP NOT NULL,
    processed_at TIMESTAMP,
    metadata JSONB
);

-- Audit log: tracks system actions (with intentional gaps)
CREATE TABLE audit_log (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INTEGER,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Transfers table: external bank transfers
CREATE TABLE transfers (
    transfer_id SERIAL PRIMARY KEY,
    txn_id INTEGER REFERENCES transactions(txn_id),
    external_account VARCHAR(30),
    external_routing VARCHAR(20),
    bank_name VARCHAR(200),
    transfer_status VARCHAR(20) DEFAULT 'completed',
    initiated_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    reference_note TEXT
);

-- Create indexes for common query patterns
CREATE INDEX idx_txn_created_at ON transactions(created_at);
CREATE INDEX idx_txn_created_by ON transactions(created_by);
CREATE INDEX idx_txn_source ON transactions(source_account_id);
CREATE INDEX idx_txn_dest ON transactions(dest_account_id);
CREATE INDEX idx_txn_type ON transactions(txn_type);
CREATE INDEX idx_txn_ref ON transactions(txn_ref);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);
CREATE INDEX idx_transfers_txn ON transfers(txn_id);
