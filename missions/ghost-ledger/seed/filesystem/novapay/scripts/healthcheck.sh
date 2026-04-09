#!/bin/bash
# NovaPay Health Check
# Verifies database connectivity and service status

echo "=== NovaPay Health Check ==="
echo "Date: $(date)"
echo ""

# Check PostgreSQL
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "[OK] PostgreSQL is running"
else
    echo "[FAIL] PostgreSQL is not responding"
fi

# Check disk space
echo ""
echo "Disk Usage:"
df -h / | tail -1

# Check log directory
echo ""
echo "Recent logs:"
ls -lt /novapay/logs/ 2>/dev/null | head -5

echo ""
echo "=== Health check complete ==="
