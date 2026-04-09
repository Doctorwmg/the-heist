#!/bin/bash
set -e

# Configure pg_hba.conf to allow md5 password auth for local TCP connections
# This lets the operative user connect as novapay_app/ghost_svc via psql -h localhost
PG_HBA=$(find /etc/postgresql -name pg_hba.conf 2>/dev/null | head -1)
if [ -n "$PG_HBA" ]; then
    # Replace default peer/scram rules with md5 for local TCP and trust for unix socket
    cat > "$PG_HBA" << 'HBA'
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                trust
local   all             all                                     trust
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
HBA
fi

# Start PostgreSQL
echo "Starting PostgreSQL..."
pg_ctlcluster 16 main start 2>/dev/null || service postgresql start

# Wait for PostgreSQL to be ready
until pg_isready -h localhost -p 5432 -q; do
    sleep 0.5
done

# Create database and users
su - postgres -c "psql -c \"CREATE USER novapay_app WITH PASSWORD 'N0v4p4y_pr0d_2025!';\"" 2>/dev/null || true
su - postgres -c "psql -c \"CREATE USER ghost_svc WITH PASSWORD 'gh0st_r3c0n_x7!m';\"" 2>/dev/null || true
su - postgres -c "psql -c \"CREATE DATABASE novapay OWNER novapay_app;\"" 2>/dev/null || true
su - postgres -c "psql -d novapay -c \"GRANT ALL PRIVILEGES ON DATABASE novapay TO novapay_app;\"" 2>/dev/null || true
su - postgres -c "psql -d novapay -c \"GRANT ALL PRIVILEGES ON DATABASE novapay TO ghost_svc;\"" 2>/dev/null || true

# Run schema and seed data
if [ -f /docker-entrypoint-initdb.d/01-schema.sql ]; then
    echo "Loading schema..."
    su - postgres -c "psql -d novapay -f /docker-entrypoint-initdb.d/01-schema.sql" 2>/dev/null
fi

if [ -f /docker-entrypoint-initdb.d/02-seed.sql ]; then
    echo "Loading seed data (this may take a moment)..."
    su - postgres -c "psql -d novapay -f /docker-entrypoint-initdb.d/02-seed.sql" 2>/dev/null
fi

# Grant schema permissions
su - postgres -c "psql -d novapay -c \"GRANT USAGE ON SCHEMA novapay TO novapay_app, ghost_svc;\"" 2>/dev/null || true
su - postgres -c "psql -d novapay -c \"GRANT SELECT ON ALL TABLES IN SCHEMA novapay TO novapay_app;\"" 2>/dev/null || true
su - postgres -c "psql -d novapay -c \"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA novapay TO ghost_svc;\"" 2>/dev/null || true

# Set up .pgpass for operative so they can connect without password prompts
echo "localhost:5432:novapay:novapay_app:N0v4p4y_pr0d_2025!" > /home/operative/.pgpass
chmod 600 /home/operative/.pgpass
chown operative:operative /home/operative/.pgpass

# Create a .bashrc with helpful aliases
cat >> /home/operative/.bashrc << 'BASHRC'

# NovaPay environment
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=novapay
export PGUSER=novapay_app
alias db='psql -h localhost -U novapay_app -d novapay'

echo ""
echo "=== OPERATION: GHOST LEDGER ==="
echo "Read BRIEFING.md to begin."
echo "Type 'db' to connect to the NovaPay database."
echo ""
BASHRC

echo "Environment ready."

# Switch to operative user and run command
exec su - operative -c "$*"
