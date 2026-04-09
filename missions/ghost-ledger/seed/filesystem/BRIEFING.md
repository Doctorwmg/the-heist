# CLASSIFIED — OPERATION: GHOST LEDGER

**Priority:** HIGH
**Handler:** SPHINX
**Operative:** You

---

## Situation

NovaPay Technologies — a mid-tier fintech processing $400M annually — has a problem
they can't explain. Their Q4 reconciliation flagged a **$2.3 million discrepancy**
between their transaction ledger and their settlement accounts. The internal audit
team spent three weeks looking at it before quietly reaching out to us.

Here's what makes this interesting: their books *almost* balance. The discrepancy is
spread across thousands of transactions over six months. Someone with deep access to
their systems built this to stay hidden.

## Your Mission

You've been inserted as a "forensic data consultant" with full read access to NovaPay's
production database and filesystem. Your cover will hold for **2 hours** — after that,
their security team rotates credentials and you're locked out.

You need to:

1. **Recon the environment** — Examine NovaPay's server filesystem. Look at logs,
   config files, scripts. Something here will tell you where the bodies are buried.

2. **Follow the money** — Query the transaction database. Find the pattern. Identify
   which transactions are fraudulent and how the money was moved.

3. **Build the case** — Compile your evidence into a final report. Names, amounts,
   methods, timeline. Everything the prosecution needs.

## What You Have

- Full access to this server's filesystem (`/novapay/`)
- Read access to the PostgreSQL database (connection details in `/novapay/config/app/.env`)
- Standard command-line tools: `bash`, `psql`, `python3`, `jq`, `grep`, etc.

## Where to Start

Start by exploring the filesystem. Run `ls -la /novapay/` and work from there.
The logs directory and config files are particularly interesting.

Good luck, operative. The clock is ticking.

---

*— SPHINX*
