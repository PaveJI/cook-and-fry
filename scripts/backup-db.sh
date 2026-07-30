#!/bin/bash
set -e

PROJECT_DIR="/home/pasha/cook-and-fry"
DB_PATH="${PROJECT_DIR}/data/orders.db"
BACKUP_DIR="${PROJECT_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

gzip -c "$DB_PATH" > "${BACKUP_DIR}/orders-${TIMESTAMP}.db.gz"

echo "Backup created: ${BACKUP_DIR}/orders-${TIMESTAMP}.db.gz"

# Optional: keep only last N backups
RETENTION=${BACKUP_RETENTION_COUNT:-30}
ls -1t "${BACKUP_DIR}"/orders-*.db.gz | tail -n +$((RETENTION + 1)) | xargs -r rm
