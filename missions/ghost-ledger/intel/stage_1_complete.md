# INTEL DROP — STAGE 1 COMPLETE

**From:** SPHINX
**Classification:** EYES ONLY

---

Good work, operative. Your filesystem recon has confirmed what we suspected.

## What You Found

- A **cron job** running `/novapay/scripts/reconcile.sh` every night at 02:00 —
  but the script does more than reconcile. It's been modified to run a secondary
  process that adjusts transaction records.

- A service account **`ghost_svc`** that doesn't appear in NovaPay's employee directory.
  This account was created 6 months ago and has write access to the transactions table.

- The `.env` file contains database credentials. The `ghost_svc` user has a separate
  connection string hidden in `/novapay/config/app/.env.local` — someone went to
  effort to keep this off the radar.

## What This Means

The fraud is automated. Someone planted a script and a service account to siphon money
through the system. The cron job runs during the maintenance window when monitoring
is reduced.

## Next Steps

Now you need to go deeper. Connect to the database and follow the money:

- Look at transactions created by `ghost_svc`
- Check for transactions during off-hours (02:00–04:00)
- Find the reversal pattern — the fraudster creates a legitimate-looking transaction,
  then reverses it with a slight amount difference. The difference goes somewhere.

The database connection details are in the `.env` file you found. Use `psql` or
write SQL queries to trace the pattern.

---

*— SPHINX*
