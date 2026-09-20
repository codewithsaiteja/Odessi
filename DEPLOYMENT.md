# Odessi.tfi Production Deployment Guide

This document outlines the deployment procedure for Odessi.tfi onto a single Linux Virtual Private Server (VPS) using Docker Compose and Caddy.

## 1. VPS Requirements
- **OS**: Ubuntu 22.04 LTS (recommended) or Debian 12.
- **Resources**: Minimum 2vCPU, 4GB RAM.
- **Network**: A static public IP address.

## 2. DNS Configuration
Before deploying, configure your DNS provider (Cloudflare, Route53, GoDaddy, etc.) to point the domains to your VPS public IP:
- **A Record**: `odessi.shop` -> `<VPS_PUBLIC_IP>`
- **A Record**: `www.odessi.shop` -> `<VPS_PUBLIC_IP>`
- **A Record**: `api.odessi.shop` -> `<VPS_PUBLIC_IP>`

*Note: If using Cloudflare, set proxy status to "DNS Only" initially so Caddy can provision Let's Encrypt certificates.*

## 3. Firewall Rules
Configure the VPS firewall (e.g., UFW or AWS Security Groups) to strictly allow only the following inbound traffic:
- **TCP 22**: SSH
- **TCP 80**: HTTP (Caddy will redirect to HTTPS)
- **TCP 443**: HTTPS

Do **NOT** expose ports `5432` (PostgreSQL), `8080` (Backend), or `3000` (Frontend) to the public internet.

## 4. Software Installation
Install Docker and Docker Compose plugin on the VPS:
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## 5. Deployment Steps
1. Clone the repository onto the VPS.
   ```bash
   git clone <YOUR_REPO_URL> /opt/odessi-store
   cd /opt/odessi-store
   ```
2. Copy the environment template and fill in **REAL** secrets.
   ```bash
   cp .env.production.example .env.production
   nano .env.production
   ```
   > **CRITICAL**: Use TEST mode Razorpay keys initially. Do not set `rzp_live_*` keys until the deployment is verified.

3. Make scripts executable:
   ```bash
   chmod +x scripts/deploy.sh
   chmod +x scripts/backup-db.sh
   ```

4. Run the deployment script:
   ```bash
   ./scripts/deploy.sh
   ```

## 6. Razorpay LIVE Activation
**WARNING**: Live activation must be done manually ONLY after a successful Test Mode verification.

1. Ensure the production smoke test (Section 22 of the roadmap) passes using Test credentials.
2. Ensure you have activated your Razorpay account to Live Mode via their dashboard.
3. Edit `.env.production` on the VPS:
   - Change `RAZORPAY_KEY_ID` to your `rzp_live_...` key.
   - Change `RAZORPAY_KEY_SECRET` to your Live Secret.
   - Change `RAZORPAY_WEBHOOK_SECRET` to your Live Webhook Secret.
   - Change `NEXT_PUBLIC_RAZORPAY_KEY_ID` to your `rzp_live_...` key.
4. Restart the containers to apply changes:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --force-recreate
   ```
5. Ensure the Live Webhook URL (`https://api.odessi.shop/api/webhooks/razorpay`) is registered in the Razorpay Live Dashboard and all necessary events (`payment.failed`, `payment.captured`, `order.paid`) are checked.

## 7. Rollback Procedure
If a deployment fails critically (e.g., backend won't start):
1. Revert to the previous stable git commit: `git checkout <PREVIOUS_COMMIT>`
2. Re-run `./scripts/deploy.sh`
3. If database schema was broken, follow `BACKUP-RESTORE.md` to restore the last automatic backup.
