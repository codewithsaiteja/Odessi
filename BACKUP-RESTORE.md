# Odessi.tfi Database Backups & Restore Guide

Data integrity is the highest priority for production. A backup is only considered production-ready once a restore has been successfully tested.

## 1. Automated Backups
The script `scripts/backup-db.sh` handles automated backups using `pg_dump`.

### Configuration
1. Backups are stored locally in `/opt/odessi-store/backups` and retained for 7 days.
2. Backups are automatically pushed to AWS S3 if `S3_BACKUP_BUCKET` is configured in `.env.production`.
3. To enable automation, add the script to the root crontab:
   ```bash
   crontab -e
   # Add this line to run daily at 02:00 AM server time
   0 2 * * * cd /opt/odessi-store && ./scripts/backup-db.sh >> /var/log/odessi_backup.log 2>&1
   ```

## 2. Restore Procedure (RESTORE TEST)
**WARNING: Do NOT test restorations directly against the production database.** 

To verify a backup, or to recover data, perform a restore into an isolated environment or a fresh database container.

### Step 1: Locate the Backup File
Find the desired `.sql.gz` file in `./backups` or download it from S3.
Example: `odessi_db_20260913_140000.sql.gz`

### Step 2: Prepare the Target Environment
If doing a test restore on the VPS, spin up a temporary standalone postgres container:
```bash
docker run --name pg_restore_test -e POSTGRES_USER=odessi_user -e POSTGRES_PASSWORD=testpass -e POSTGRES_DB=odessi_test -p 5433:5432 -d postgres:15-alpine
```

If recovering production (DOWNTIME REQUIRED):
```bash
# Stop backend so it doesn't write during restore
docker compose -f docker-compose.prod.yml stop backend

# Drop existing database connections and recreate the database
docker exec -it odessi_postgres psql -U <DB_USERNAME> -c "DROP DATABASE odessi WITH (FORCE);"
docker exec -it odessi_postgres psql -U <DB_USERNAME> -c "CREATE DATABASE odessi;"
```

### Step 3: Execute the Restore
Decompress and pipe the SQL dump directly into the target database:
```bash
# For a test container:
zcat backups/odessi_db_20260913_140000.sql.gz | docker exec -i pg_restore_test psql -U odessi_user -d odessi_test

# For production recovery:
zcat backups/odessi_db_20260913_140000.sql.gz | docker exec -i odessi_postgres psql -U <DB_USERNAME> -d <DB_NAME>
```

### Step 4: Verification
Log into the test container (or production if recovering) and verify critical tables:
```bash
docker exec -it pg_restore_test psql -U odessi_user -d odessi_test

# Inside psql, run:
\dt
SELECT count(*) FROM users;
SELECT count(*) FROM orders;
SELECT count(*) FROM payments;
```

Verify that schema, users, products, orders, payments, inventory, shipping, coupons, and reviews are present and match expectations.
Once verified, tear down the test container:
```bash
docker stop pg_restore_test
docker rm pg_restore_test
```
