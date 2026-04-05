FROM ubuntu:24.04

# System tools
RUN apt-get update && apt-get install -y \
    bash curl wget git vim nano less \
    postgresql-client \
    python3.12 python3-pip python3.12-venv \
    && rm -rf /var/lib/apt/lists/*

# Python packages (pre-installed for all missions)
RUN pip3 install --break-system-packages \
    pandas numpy scipy scikit-learn \
    psycopg2-binary sqlalchemy \
    sentence-transformers \
    pgvector \
    requests httpx \
    python-dotenv pyyaml

# Create player workspace
RUN useradd -m -s /bin/bash operative
RUN mkdir -p /home/operative/workspace && chown operative:operative /home/operative/workspace
WORKDIR /home/operative/workspace
USER operative

# Resource limits enforced at container level:
# - 1 CPU core
# - 1GB RAM
# - 5GB disk
# - No network access (mission-specific exceptions)
# - 2-hour max lifetime
