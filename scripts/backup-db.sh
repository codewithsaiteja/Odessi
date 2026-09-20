#!/bin/bash
# ══════════════════════════════════════════════════════════════
# DATABASE BACKUP SCRIPT
# ══════════════════════════════════════════════════════════════
# Usage: ./scripts/backup-db.sh
# 
# Requires .env.production to be present in the root directory.
# Uses pg_dump from inside the postgres container.
#
# To automate (daily at 2am), add to crontab (crontab -e):
# 0 2 * * * cd /path/to/odessi-store && ./scripts/backup-db.sh >> /var/log/odessi_backup.log 2>&1

set -e

# Load environment variables
if [ ! -f ".env.production" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') ❌ Error: .env.production not found."
    exit 1
fi
export $(grep -v '^#' .env.production | xargs)

# Variables
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/odessi_db_${TIMESTAMP}.sql.gz"
DB_USER=${DB_USERNAME:-odessi}
DB_NAME=${DB_NAME:-odessi}
CONTAINER_NAME="odessi_postgres"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "$(date '+%Y-%m-%d %H:%M:%S') ⏳ Starting database backup..."

# Execute pg_dump inside the container and compress on the host
if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') ✅ Backup successful: $BACKUP_FILE"
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') ❌ Error: pg_dump failed!"
    # Optionally trigger alerting here (Slack webhook, email, etc.)
    exit 1
fi

# Retention Policy: Keep only the last 7 backups locally
echo "$(date '+%Y-%m-%d %H:%M:%S') 🧹 Cleaning up backups older than 7 days..."
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -exec rm {} \;

# S3 Upload (Requires AWS CLI configured)
if [ -n "$S3_BACKUP_BUCKET" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') ☁️  Uploading to S3 ($S3_BACKUP_BUCKET)..."
    if aws s3 cp "$BACKUP_FILE" "s3://${S3_BACKUP_BUCKET}/db_backups/$(basename $BACKUP_FILE)"; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') ✅ S3 Upload successful."
    else
        echo "$(date '+%Y-%m-%d %H:%M:%S') ❌ Error: S3 upload failed!"
        exit 1
    fi
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') ⚠️  S3_BACKUP_BUCKET not set. Skipping external upload."
    echo "🚨 WARNING: Backups must not remain only on the VPS! Please configure external storage."
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') 🎉 Backup process complete."
