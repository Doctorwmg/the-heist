FROM heist-mission-base:latest

# Switch to root for setup
USER root

# Install PostgreSQL server for in-container database
RUN apt-get update && apt-get install -y \
    postgresql postgresql-contrib \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Create NovaPay filesystem structure
RUN mkdir -p /novapay/config/app \
    /novapay/scripts \
    /novapay/data/reports \
    /novapay/data/.transactions \
    /novapay/logs

# Copy seed filesystem
COPY seed/filesystem/BRIEFING.md /home/operative/workspace/BRIEFING.md
COPY seed/filesystem/novapay/config/app/.env /novapay/config/app/.env
COPY seed/filesystem/novapay/config/app/.env.local /novapay/config/app/.env.local
COPY seed/filesystem/novapay/scripts/ /novapay/scripts/
COPY seed/filesystem/novapay/data/reports/ /novapay/data/reports/
COPY seed/filesystem/novapay/data/.transactions/ /novapay/data/.transactions/
COPY seed/filesystem/logs/ /novapay/logs/

# Copy database schema and seed data
COPY seed/database/schema.sql /docker-entrypoint-initdb.d/01-schema.sql
COPY seed/database/seed.sql /docker-entrypoint-initdb.d/02-seed.sql

# Copy crontab (for player to discover, not actually running)
COPY seed/filesystem/novapay/scripts/crontab.txt /novapay/scripts/crontab.txt

# Set permissions
RUN chmod +x /novapay/scripts/*.sh && \
    chmod 644 /novapay/scripts/.recon_adjust.py && \
    chmod 644 /novapay/config/app/.env && \
    chmod 600 /novapay/config/app/.env.local && \
    chown -R operative:operative /home/operative/workspace

# Make novapay readable by operative
RUN chown -R operative:operative /novapay

# Copy and set up entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose PostgreSQL for local connections
EXPOSE 5432

ENTRYPOINT ["/entrypoint.sh"]
CMD ["bash"]
