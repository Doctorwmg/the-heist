#!/usr/bin/env python3
"""
Ghost Ledger Mission — Seed Data Generator

Generates realistic NovaPay transaction data with embedded fraud:
- ~50,000 legitimate transactions over 6 months
- 847 suspicious transactions by ghost_svc totaling $2,314,887.43
- Intentional data quality issues (duplicates, NULL fields, mixed formats)
- Audit log with selective gaps covering fraudulent activity

Output: seed.sql file with all INSERT statements
"""

import json
import random
import uuid
from datetime import datetime, timedelta, timezone

random.seed(42)  # Reproducible output

# ============================================================
# Configuration
# ============================================================

START_DATE = datetime(2025, 4, 1, tzinfo=timezone.utc)
END_DATE = datetime(2025, 10, 8, tzinfo=timezone.utc)
TOTAL_DAYS = (END_DATE - START_DATE).days  # ~190 days

TARGET_LEGIT_TXNS = 49_153  # To hit ~50K total
TARGET_FRAUD_SKIM = 2_314_887.43
TARGET_FRAUD_COUNT = 847

# Account IDs
SETTLEMENT_ACCOUNT = 1001

# ============================================================
# Data pools
# ============================================================

MERCHANT_NAMES = [
    "GlobalTech Solutions", "Apex Digital Services", "Vertex Commerce LLC",
    "DataFlow Systems", "CloudPeak Industries", "NexGen Payments Corp",
    "Brightwave Analytics", "Ironclad Security", "Pulse Media Group",
    "Quantum Retail Inc", "SilverLine Logistics", "TrueNorth Software",
    "Emerald Health Tech", "Cobalt Financial", "RedShift Data Corp",
    "Pinnacle Services", "OceanView Trading", "FrostByte Computing",
    "Amber Systems Inc", "Catalyst Commerce"
]

VENDOR_NAMES = [
    "AWS Cloud Services", "Stripe Processing", "Twilio Communications",
    "Datadog Monitoring", "PagerDuty Ops", "Slack Technologies",
    "Zoom Video", "GitHub Enterprise", "Jira Software",
    "Cloudflare CDN", "SendGrid Email", "Mixpanel Analytics",
    "Segment Data", "LaunchDarkly", "CircleCI Pipeline",
    "Hashicorp Vault", "Elastic Search", "Redis Labs",
    "MongoDB Atlas", "Snowflake Computing"
]

SHELL_COMPANIES = [
    "Meridian Dynamics LLC",
    "Meridian Dynamics Holdings",
    "Meridian Capital Partners"
]

EMPLOYEES = [
    ("admin_sarah", "sarah.kim@novapay.io", "admin", "Engineering"),
    ("analyst_james", "james.wright@novapay.io", "analyst", "Finance"),
    ("analyst_priya", "priya.patel@novapay.io", "analyst", "Finance"),
    ("admin_david", "david.okonkwo@novapay.io", "admin", "Engineering"),
    ("auditor_lisa", "lisa.chen@novapay.io", "auditor", "Compliance"),
    ("admin_mchen", "mchen@novapay.io", "admin", "Infrastructure"),
    ("analyst_tom", "tom.garcia@novapay.io", "analyst", "Operations"),
    ("service_api", "api@novapay.io", "service", "Platform"),
    ("service_batch", "batch@novapay.io", "service", "Platform"),
]

GHOST_USER = ("ghost_svc", "ghost_svc@novapay.internal", "service", "Infrastructure")

PAYMENT_DESCRIPTIONS = [
    "Payment processing fee", "Monthly subscription", "API usage charges",
    "Platform license fee", "Transaction processing", "Service agreement payment",
    "Consulting services", "Infrastructure costs", "Support contract",
    "Data processing fee", "Integration services", "Compliance review fee",
    "Quarterly settlement", "Vendor payment", "Merchant payout",
    "Commission payment", "Referral bonus", "Performance incentive",
]

# ============================================================
# Helpers
# ============================================================

def sql_str(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def sql_num(n):
    if n is None:
        return "NULL"
    return str(n)


def sql_bool(b):
    return "true" if b else "false"


def sql_ts(dt):
    if dt is None:
        return "NULL"
    return f"'{dt.strftime('%Y-%m-%d %H:%M:%S')}'"


def sql_jsonb(obj):
    if obj is None:
        return "NULL"
    return f"'{json.dumps(obj)}'::jsonb"


def gen_txn_ref():
    return f"TXN-{uuid.uuid4().hex[:12].upper()}"


def random_timestamp(start, end):
    delta = end - start
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start + timedelta(seconds=random_seconds)


def business_hours_timestamp(day):
    """Random timestamp during business hours (08:00-18:00)."""
    hour = random.randint(8, 17)
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    return day.replace(hour=hour, minute=minute, second=second)


def off_hours_timestamp(day):
    """Random timestamp during off-hours (02:00-04:00) — when fraud happens."""
    hour = random.randint(2, 3)
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    return day.replace(hour=hour, minute=minute, second=second)


# ============================================================
# Generate accounts
# ============================================================

def generate_accounts():
    accounts = []
    aid = 1001

    # Settlement account
    accounts.append((aid, "NovaPay Settlement", "settlement",
                      "021000021", "1001000001", "active",
                      datetime(2020, 1, 15, tzinfo=timezone.utc)))
    aid += 1

    # Merchant accounts
    for name in MERCHANT_NAMES:
        routing = f"0{random.randint(10000000, 99999999)}"
        acct_num = f"{random.randint(1000000000, 9999999999)}"
        created = datetime(2020 + random.randint(0, 4),
                           random.randint(1, 12),
                           random.randint(1, 28), tzinfo=timezone.utc)
        accounts.append((aid, name, "merchant", routing, acct_num, "active", created))
        aid += 1

    # Vendor accounts
    for name in VENDOR_NAMES:
        routing = f"0{random.randint(10000000, 99999999)}"
        acct_num = f"{random.randint(1000000000, 9999999999)}"
        created = datetime(2020 + random.randint(0, 4),
                           random.randint(1, 12),
                           random.randint(1, 28), tzinfo=timezone.utc)
        accounts.append((aid, name, "vendor", routing, acct_num, "active", created))
        aid += 1

    # Internal accounts
    accounts.append((aid, "NovaPay Operations", "internal",
                      "021000021", "1001000002", "active",
                      datetime(2020, 1, 15, tzinfo=timezone.utc)))
    aid += 1
    accounts.append((aid, "NovaPay Fees", "internal",
                      "021000021", "1001000003", "active",
                      datetime(2020, 1, 15, tzinfo=timezone.utc)))
    aid += 1

    # Shell company accounts (created same week as ghost_svc)
    ghost_week = datetime(2025, 4, 1, tzinfo=timezone.utc)
    for name in SHELL_COMPANIES:
        routing = f"0{random.randint(10000000, 99999999)}"
        acct_num = f"{random.randint(1000000000, 9999999999)}"
        created = ghost_week + timedelta(days=random.randint(0, 4))
        accounts.append((aid, name, "vendor", routing, acct_num, "active", created))
        aid += 1

    return accounts


# ============================================================
# Generate users
# ============================================================

def generate_users():
    users = []
    uid = 1

    for username, email, role, dept in EMPLOYEES:
        created = datetime(2020 + random.randint(0, 4),
                           random.randint(1, 12),
                           random.randint(1, 28), tzinfo=timezone.utc)
        last_login = random_timestamp(
            datetime(2025, 9, 1, tzinfo=timezone.utc),
            datetime(2025, 10, 7, tzinfo=timezone.utc))
        users.append((uid, username, email, role, dept, created, last_login, True))
        uid += 1

    # Ghost service account — created April 2, 2025
    ghost_created = datetime(2025, 4, 2, 14, 23, 11, tzinfo=timezone.utc)
    ghost_login = datetime(2025, 10, 7, 2, 0, 3, tzinfo=timezone.utc)
    users.append((uid, GHOST_USER[0], GHOST_USER[1], GHOST_USER[2],
                  GHOST_USER[3], ghost_created, ghost_login, True))

    return users


# ============================================================
# Generate legitimate transactions
# ============================================================

def generate_legit_transactions(accounts, users):
    txns = []

    merchant_ids = [a[0] for a in accounts if a[2] == "merchant"]
    vendor_ids = [a[0] for a in accounts if a[2] == "vendor" and "Meridian" not in a[1]]
    internal_ids = [a[0] for a in accounts if a[2] == "internal"]
    legit_user_ids = [u[0] for u in users if u[1] != "ghost_svc"]
    service_user_ids = [u[0] for u in users if u[3] == "service" and u[1] != "ghost_svc"]

    txn_id = 1

    for _ in range(TARGET_LEGIT_TXNS):
        day_offset = random.randint(0, TOTAL_DAYS - 1)
        day = START_DATE + timedelta(days=day_offset)
        ts = business_hours_timestamp(day)

        roll = random.random()
        if roll < 0.60:
            # Payment: merchant -> settlement
            txn_type = "payment"
            source = random.choice(merchant_ids)
            dest = SETTLEMENT_ACCOUNT
            amount = round(random.uniform(10, 50000), 2)
            created_by = random.choice(service_user_ids) if random.random() < 0.7 else random.choice(legit_user_ids)
        elif roll < 0.75:
            # Refund: settlement -> merchant
            txn_type = "refund"
            source = SETTLEMENT_ACCOUNT
            dest = random.choice(merchant_ids)
            amount = round(random.uniform(5, 5000), 2)
            created_by = random.choice(legit_user_ids)
        elif roll < 0.88:
            # Transfer: settlement -> vendor
            txn_type = "transfer"
            source = SETTLEMENT_ACCOUNT
            dest = random.choice(vendor_ids)
            amount = round(random.uniform(100, 25000), 2)
            created_by = random.choice(service_user_ids)
        elif roll < 0.95:
            # Fee
            txn_type = "fee"
            source = random.choice(merchant_ids)
            dest = internal_ids[1] if len(internal_ids) > 1 else internal_ids[0]
            amount = round(random.uniform(1, 500), 2)
            created_by = random.choice(service_user_ids)
        else:
            # Adjustment
            txn_type = "adjustment"
            source = SETTLEMENT_ACCOUNT
            dest = random.choice(merchant_ids)
            amount = round(random.uniform(0.01, 1000), 2)
            created_by = random.choice(legit_user_ids)

        status = "completed"
        if random.random() < 0.02:
            status = "failed"
        elif random.random() < 0.005:
            status = "pending"

        desc = random.choice(PAYMENT_DESCRIPTIONS)
        processed_at = ts + timedelta(seconds=random.randint(1, 300)) if status == "completed" else None

        # Intentional data quality issues
        metadata = None
        if random.random() < 0.03:
            amount = None  # NULL amount (data quality issue)
        if random.random() < 0.02:
            metadata = {"batch_id": f"BATCH-{random.randint(1000, 9999)}"}
        if random.random() < 0.01:
            desc = None  # NULL description

        txns.append((txn_id, gen_txn_ref(), source, dest, amount, "USD",
                      txn_type, status, desc, created_by, ts, processed_at, metadata))
        txn_id += 1

        # Create duplicates (~0.5% of transactions)
        if random.random() < 0.005:
            dup_ts = ts + timedelta(seconds=random.randint(1, 10))
            txns.append((txn_id, txns[-1][1], source, dest, amount, "USD",
                          txn_type, status, desc, created_by, dup_ts, processed_at, metadata))
            txn_id += 1

    return txns, txn_id


# ============================================================
# Generate fraudulent transactions (847 suspicious, totaling $2,314,887.43)
# ============================================================

def generate_fraud_transactions(accounts, users, start_txn_id):
    txns = []
    transfers = []

    ghost_uid = None
    for u in users:
        if u[1] == "ghost_svc":
            ghost_uid = u[0]
            break

    meridian_ids = [a[0] for a in accounts if "Meridian" in a[1]]
    vendor_ids = [a[0] for a in accounts if a[2] == "vendor" and "Meridian" not in a[1]]

    txn_id = start_txn_id
    transfer_id = 1
    total_skimmed = 0.0
    fraud_count = 0

    # Distribute 847 fraud transactions over ~190 days
    # ~4-5 per day on average, but clustered in batches
    days_with_fraud = sorted(random.sample(range(TOTAL_DAYS), min(180, TOTAL_DAYS)))

    remaining_target = TARGET_FRAUD_SKIM
    remaining_count = TARGET_FRAUD_COUNT

    for day_offset in days_with_fraud:
        if remaining_count <= 0:
            break

        day = START_DATE + timedelta(days=day_offset)
        # Batch size: 3-8 per active day
        batch = min(random.randint(3, 8), remaining_count)

        for _ in range(batch):
            ts = off_hours_timestamp(day)

            vendor = random.choice(vendor_ids)
            meridian = random.choice(meridian_ids)

            # Calculate skim amount to hit target
            if remaining_count <= 1:
                skim = round(remaining_target, 2)
            else:
                avg_remaining = remaining_target / remaining_count
                skim = round(random.uniform(
                    max(500, avg_remaining * 0.4),
                    min(5000, avg_remaining * 1.8)
                ), 2)
                skim = min(skim, round(remaining_target, 2))

            if skim < 0.01:
                break

            payment_amount = round(skim + random.uniform(skim * 0.5, skim * 3), 2)
            reversal_amount = round(payment_amount - skim, 2)

            payment_ref = gen_txn_ref()
            reversal_ref = gen_txn_ref()
            transfer_ref = gen_txn_ref()

            processed = ts + timedelta(seconds=random.randint(1, 60))

            # 1. Payment (looks legitimate)
            txns.append((txn_id, payment_ref, SETTLEMENT_ACCOUNT, vendor,
                          payment_amount, "USD", "payment", "completed",
                          "Automated reconciliation adjustment",
                          ghost_uid, ts, processed, None))
            txn_id += 1

            # 2. Partial reversal
            rev_ts = ts + timedelta(seconds=random.randint(2, 30))
            txns.append((txn_id, reversal_ref, vendor, SETTLEMENT_ACCOUNT,
                          reversal_amount, "USD", "reversal", "completed",
                          "Reversal - reconciliation correction",
                          ghost_uid, rev_ts, rev_ts + timedelta(seconds=5),
                          {"original_txn": payment_ref}))
            txn_id += 1

            # 3. Silent transfer of skim to Meridian
            xfer_ts = ts + timedelta(seconds=random.randint(31, 120))
            txns.append((txn_id, transfer_ref, SETTLEMENT_ACCOUNT, meridian,
                          skim, "USD", "transfer", "completed",
                          "Settlement fee adjustment",
                          ghost_uid, xfer_ts, xfer_ts + timedelta(seconds=10), None))

            # External transfer record
            meridian_acct = next(a for a in accounts if a[0] == meridian)
            transfers.append((transfer_id, txn_id, meridian_acct[4],
                               meridian_acct[3], meridian_acct[1],
                               "completed", xfer_ts,
                               xfer_ts + timedelta(seconds=random.randint(60, 600)),
                               f"Fee adj {payment_ref}"))
            transfer_id += 1
            txn_id += 1

            total_skimmed += skim
            remaining_target -= skim
            remaining_count -= 1
            fraud_count += 1

    return txns, transfers, total_skimmed, fraud_count, txn_id


# ============================================================
# Generate audit log (with gaps for fraud)
# ============================================================

def generate_audit_log(legit_txns, fraud_txns, users):
    logs = []
    log_id = 1

    legit_user_ids = [u[0] for u in users if u[1] != "ghost_svc"]
    ghost_uid = next(u[0] for u in users if u[1] == "ghost_svc")

    # Audit entries for ~30% of legitimate transactions
    for txn in legit_txns:
        if random.random() < 0.30:
            logs.append((log_id, txn[9], "INSERT", "transactions", txn[0],
                          None, None, f"10.0.{random.randint(1,254)}.{random.randint(1,254)}",
                          txn[10]))
            log_id += 1

    # Audit entries for fraud — SELECTIVELY MISSING
    # Only ~5% of fraud txns have audit entries (the rest were deleted)
    for txn in fraud_txns:
        if random.random() < 0.05:
            logs.append((log_id, txn[9], "INSERT", "transactions", txn[0],
                          None, None, "10.0.1.99", txn[10]))
            log_id += 1

    # Some user login audit entries
    for _ in range(500):
        uid = random.choice(legit_user_ids)
        ts = random_timestamp(START_DATE, END_DATE)
        logs.append((log_id, uid, "LOGIN", "users", uid,
                      None, None, f"10.0.{random.randint(1,254)}.{random.randint(1,254)}",
                      ts))
        log_id += 1

    # ghost_svc login entries (sparse — only a few leaked through)
    for _ in range(12):
        ts = random_timestamp(START_DATE, END_DATE)
        ts = ts.replace(hour=random.randint(1, 3))
        logs.append((log_id, ghost_uid, "LOGIN", "users", ghost_uid,
                      None, None, "10.0.1.99", ts))
        log_id += 1

    # Sort by timestamp
    logs.sort(key=lambda x: x[8])
    # Re-number
    for i in range(len(logs)):
        logs[i] = (i + 1,) + logs[i][1:]

    return logs


# ============================================================
# Write SQL output
# ============================================================

def write_sql(filepath, accounts, users, legit_txns, fraud_txns, transfers, audit_logs):
    with open(filepath, "w") as f:
        f.write("-- Ghost Ledger Mission: Seed Data\n")
        f.write("-- Auto-generated by generate_seed.py\n")
        f.write(f"-- Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}\n")
        f.write(f"-- Legitimate transactions: {len(legit_txns)}\n")
        f.write(f"-- Fraud transactions: {len(fraud_txns)}\n\n")
        f.write("SET search_path TO novapay, public;\n\n")

        # Accounts
        f.write("-- ============================================================\n")
        f.write("-- Accounts\n")
        f.write("-- ============================================================\n\n")
        for a in accounts:
            f.write(f"INSERT INTO accounts (account_id, account_name, account_type, "
                    f"routing_number, account_number, status, created_at) VALUES ("
                    f"{a[0]}, {sql_str(a[1])}, {sql_str(a[2])}, {sql_str(a[3])}, "
                    f"{sql_str(a[4])}, {sql_str(a[5])}, {sql_ts(a[6])});\n")

        # Users
        f.write("\n-- ============================================================\n")
        f.write("-- Users\n")
        f.write("-- ============================================================\n\n")
        for u in users:
            f.write(f"INSERT INTO users (user_id, username, email, role, department, "
                    f"created_at, last_login, is_active) VALUES ("
                    f"{u[0]}, {sql_str(u[1])}, {sql_str(u[2])}, {sql_str(u[3])}, "
                    f"{sql_str(u[4])}, {sql_ts(u[5])}, {sql_ts(u[6])}, {sql_bool(u[7])});\n")

        # Transactions — merge and sort by timestamp
        f.write("\n-- ============================================================\n")
        f.write("-- Transactions\n")
        f.write("-- ============================================================\n\n")
        all_txns = sorted(legit_txns + fraud_txns, key=lambda t: t[10])

        for t in all_txns:
            f.write(f"INSERT INTO transactions (txn_id, txn_ref, source_account_id, "
                    f"dest_account_id, amount, currency, txn_type, status, description, "
                    f"created_by, created_at, processed_at, metadata) VALUES ("
                    f"{t[0]}, {sql_str(t[1])}, {t[2]}, {t[3]}, "
                    f"{sql_num(t[4])}, {sql_str(t[5])}, {sql_str(t[6])}, "
                    f"{sql_str(t[7])}, {sql_str(t[8])}, {t[9]}, "
                    f"{sql_ts(t[10])}, {sql_ts(t[11])}, {sql_jsonb(t[12])});\n")

        # Transfers
        f.write("\n-- ============================================================\n")
        f.write("-- Transfers (external)\n")
        f.write("-- ============================================================\n\n")
        for tr in transfers:
            f.write(f"INSERT INTO transfers (transfer_id, txn_id, external_account, "
                    f"external_routing, bank_name, transfer_status, initiated_at, "
                    f"completed_at, reference_note) VALUES ("
                    f"{tr[0]}, {tr[1]}, {sql_str(tr[2])}, {sql_str(tr[3])}, "
                    f"{sql_str(tr[4])}, {sql_str(tr[5])}, {sql_ts(tr[6])}, "
                    f"{sql_ts(tr[7])}, {sql_str(tr[8])});\n")

        # Audit log
        f.write("\n-- ============================================================\n")
        f.write("-- Audit Log\n")
        f.write("-- ============================================================\n\n")
        for al in audit_logs:
            f.write(f"INSERT INTO audit_log (log_id, user_id, action, table_name, "
                    f"record_id, old_value, new_value, ip_address, created_at) VALUES ("
                    f"{al[0]}, {al[1]}, {sql_str(al[2])}, {sql_str(al[3])}, "
                    f"{al[4]}, {sql_jsonb(al[5])}, {sql_jsonb(al[6])}, "
                    f"{sql_str(al[7])}, {sql_ts(al[8])});\n")

        # Reset sequences
        f.write("\n-- Reset sequences\n")
        f.write("SELECT setval('accounts_account_id_seq', (SELECT MAX(account_id) FROM accounts));\n")
        f.write("SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));\n")
        f.write("SELECT setval('transactions_txn_id_seq', (SELECT MAX(txn_id) FROM transactions));\n")
        f.write("SELECT setval('transfers_transfer_id_seq', (SELECT MAX(transfer_id) FROM transfers));\n")
        f.write("SELECT setval('audit_log_log_id_seq', (SELECT MAX(log_id) FROM audit_log));\n")

    return len(all_txns)


# ============================================================
# Generate .transactions/ JSON files (data quality artifact)
# ============================================================

def write_transaction_json_samples(txns, output_dir):
    """Write sample transaction batches as JSON files for filesystem discovery."""
    import os
    os.makedirs(output_dir, exist_ok=True)

    # Group some transactions by date
    by_date = {}
    for t in txns[:2000]:  # Sample subset
        date_key = t[10].strftime("%Y-%m-%d")
        if date_key not in by_date:
            by_date[date_key] = []
        by_date[date_key].append({
            "txn_ref": t[1],
            "source": t[2],
            "dest": t[3],
            "amount": t[4],
            "type": t[6],
            "status": t[7],
            "timestamp": t[10].isoformat(),
        })

    # Write a few sample days
    dates = sorted(by_date.keys())
    for date_key in dates[:5]:
        filepath = os.path.join(output_dir, f"batch_{date_key}.json")
        with open(filepath, "w") as f:
            json.dump({"date": date_key, "transactions": by_date[date_key]}, f, indent=2, default=str)


# ============================================================
# Main
# ============================================================

def main():
    import os

    print("Generating Ghost Ledger seed data...")

    accounts = generate_accounts()
    print(f"  Accounts: {len(accounts)}")

    users = generate_users()
    print(f"  Users: {len(users)}")

    legit_txns, next_id = generate_legit_transactions(accounts, users)
    print(f"  Legitimate transactions: {len(legit_txns)}")

    fraud_txns, transfers, total_skimmed, fraud_count, _ = generate_fraud_transactions(
        accounts, users, next_id)
    print(f"  Fraud transactions: {fraud_count} (skim: ${total_skimmed:,.2f})")

    audit_logs = generate_audit_log(legit_txns, fraud_txns, users)
    print(f"  Audit log entries: {len(audit_logs)}")

    # Write seed.sql
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sql_path = os.path.join(script_dir, "seed.sql")
    total = write_sql(sql_path, accounts, users, legit_txns, fraud_txns, transfers, audit_logs)
    print(f"\n  Total transactions written: {total}")
    print(f"  Output: {sql_path}")

    # Write JSON samples for .transactions/ directory
    txns_dir = os.path.join(script_dir, "..", "filesystem", "novapay", "data", ".transactions")
    write_transaction_json_samples(legit_txns + fraud_txns, txns_dir)
    print(f"  JSON samples: {txns_dir}")

    # Verify totals
    print(f"\n  Target fraud total: ${TARGET_FRAUD_SKIM:,.2f}")
    print(f"  Actual fraud total: ${total_skimmed:,.2f}")
    print(f"  Difference: ${abs(TARGET_FRAUD_SKIM - total_skimmed):,.2f}")
    print("\nDone!")


if __name__ == "__main__":
    main()
