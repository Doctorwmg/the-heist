# INTEL DROP — STAGE 2 COMPLETE

**From:** SPHINX
**Classification:** EYES ONLY

---

Outstanding SQL work, operative. The picture is becoming clear.

## What You Uncovered

- **847 suspicious transactions** totaling **$2,314,887.43** — all created by the
  `ghost_svc` account during off-hours.

- The pattern: legitimate-looking payments are created to real vendor accounts, then
  partially reversed. The reversal amount is always slightly less than the original.
  The difference — typically between $500 and $5,000 per transaction — is routed to
  a set of accounts linked to **Meridian Dynamics LLC**.

- Meridian Dynamics is a shell company. Our background check shows it was registered
  6 months ago — the same week `ghost_svc` was created. The registered agent is a
  nominee service in Delaware. Dead end on paper, but the timing is damning.

- The `audit_log` table has gaps. Someone with database admin access has been
  selectively deleting log entries that correspond to the fraudulent transactions.

## What This Means

This is an inside job. Whoever did this had:
- Access to create database users (`ghost_svc`)
- Access to modify server scripts (`reconcile.sh`)
- Access to delete audit logs
- Knowledge of the maintenance window timing

That narrows it to someone on NovaPay's infrastructure team.

## Final Stage

Time to build the case. Write a Python script that:
1. Queries all suspicious transactions
2. Calculates the total amount diverted
3. Generates a structured evidence report

Your report needs to be airtight. Names, amounts, methods, timeline.

---

*— SPHINX*
