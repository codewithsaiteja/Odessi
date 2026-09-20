# Odessi.tfi Operations & Monitoring

This document details how to monitor the production application, inspect logs, and respond to incidents.

## 1. Container Monitoring
All production services run via Docker Compose. You can check the overall health of the cluster using:
```bash
docker compose -f docker-compose.prod.yml ps
```
A healthy system will show `Up (healthy)` for `postgres`, `backend`, and `frontend`, and `Up` for `caddy`.

## 2. Viewing Logs
Logs are captured by Docker natively and can be inspected via the CLI.

**View all logs (tailed):**
```bash
docker compose -f docker-compose.prod.yml logs -f
```

**View specific service logs:**
```bash
# Backend (Spring Boot errors, Hibernate warnings, Authentication events)
docker compose -f docker-compose.prod.yml logs -f backend

# Frontend (Next.js server-side errors)
docker compose -f docker-compose.prod.yml logs -f frontend

# Proxy (Caddy traffic and Let's Encrypt certificate renewals)
docker compose -f docker-compose.prod.yml logs -f caddy
```

*Note: As per Phase 8 security policies, sensitive information such as JWTs, passwords, and Razorpay secrets are strictly omitted from backend logs. The backend `application-prod.yml` restricts root logging to `INFO` and SQL logging to `WARN` to minimize noise and accidental data exposure.*

## 3. Flyway Migrations
Schema changes are managed entirely by Flyway during the Spring Boot backend startup. 
To verify if migrations succeeded or failed:
```bash
docker compose -f docker-compose.prod.yml logs backend | grep -i flyway
```
If a migration fails, the backend will exit and its health check will fail. You must NOT repeatedly restart a failing container blindly. Instead, inspect the exact SQL error, fix the root cause, or refer to `BACKUP-RESTORE.md` to restore database integrity.

## 4. Incident Response
**Database Connection Failures**: Check `postgres` container logs. Ensure the volume `postgres_data` is mounted and has not exhausted disk space.
**Razorpay Webhook Failures**: Check the Razorpay Dashboard -> Webhooks for delivery statuses. Cross-reference failed delivery timestamps with the `backend` logs for `SignatureVerificationException` or `DataIntegrityViolationException`.
**Let's Encrypt Rate Limits**: If Caddy fails to provision SSL, ensure DNS points correctly to the VPS IP and ports 80/443 are open. Wait 1 hour before aggressive retries to avoid ACME rate limits.
