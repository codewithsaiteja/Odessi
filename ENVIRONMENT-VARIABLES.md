# 🔐 **ENVIRONMENT VARIABLES REFERENCE**

## 🎯 **BACKEND ENVIRONMENT VARIABLES**

### **Copy these exact variables to Railway Dashboard:**

```bash
# ══════════════════════════════════════════════════════
# SPRING BOOT CONFIGURATION
# ══════════════════════════════════════════════════════
SPRING_PROFILES_ACTIVE=prod

# ══════════════════════════════════════════════════════
# AZURE DATABASE CONNECTION
# Replace with your actual Azure database details
# ══════════════════════════════════════════════════════
DB_URL=jdbc:postgresql://YOUR_AZURE_SERVER.postgres.database.azure.com:5432/YOUR_DATABASE_NAME?sslmode=require
DB_USERNAME=your_username@YOUR_AZURE_SERVER
DB_PASSWORD=your_strong_password

# ══════════════════════════════════════════════════════
# JWT AUTHENTICATION (Generate new secret!)
# ══════════════════════════════════════════════════════
JWT_SECRET=yourSuperSecureJWTSecretKeyThatShouldBeAtLeast64CharactersLongForProductionSecurity123
JWT_ACCESS_EXPIRATION=900000
JWT_REFRESH_EXPIRATION=604800000

# ══════════════════════════════════════════════════════
# SECURITY SETTINGS
# ══════════════════════════════════════════════════════
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=None
AUTH_REQUIRE_EMAIL_VERIFICATION=false

# ══════════════════════════════════════════════════════
# CORS CONFIGURATION (Update after frontend deployment)
# ══════════════════════════════════════════════════════
FRONTEND_URL=https://your-frontend.vercel.app

# ══════════════════════════════════════════════════════
# RAZORPAY PAYMENT GATEWAY (Use LIVE keys for production)
# ══════════════════════════════════════════════════════
RAZORPAY_KEY_ID=rzp_live_your_actual_live_key_id
RAZORPAY_KEY_SECRET=your_actual_live_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_from_razorpay

# ══════════════════════════════════════════════════════
# RATE LIMITING (Production values)
# ══════════════════════════════════════════════════════
RATE_LIMIT_UNAUTH_MAX=5
RATE_LIMIT_UNAUTH_WINDOW=60
RATE_LIMIT_AUTH_MAX=50
RATE_LIMIT_AUTH_WINDOW=60

# ══════════════════════════════════════════════════════
# APPLICATION SETTINGS
# ══════════════════════════════════════════════════════
SERVER_PORT=8080
SEED_DATA_ENABLED=false
RESERVATION_EXPIRATION_MINUTES=15
```

---

## 🎯 **FRONTEND ENVIRONMENT VARIABLES**

### **Copy these to Vercel Dashboard:**

```bash
# ══════════════════════════════════════════════════════
# API CONNECTION (Update with your Railway backend URL)
# ══════════════════════════════════════════════════════
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app

# ══════════════════════════════════════════════════════
# FRONTEND URL (Your Vercel deployment URL)
# ══════════════════════════════════════════════════════
NEXT_PUBLIC_FRONTEND_URL=https://your-frontend.vercel.app

# ══════════════════════════════════════════════════════
# OPTIONAL: Analytics (if you want to add Google Analytics)
# ══════════════════════════════════════════════════════
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## 🔄 **HOW TO UPDATE ENVIRONMENT VARIABLES**

### **Railway (Backend):**
1. Go to your Railway project dashboard
2. Click on your service
3. Navigate to "Variables" tab
4. Add/Edit environment variables
5. Railway will automatically redeploy

### **Vercel (Frontend):**
1. Go to your Vercel project dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add/Edit variables
4. Redeploy by going to "Deployments" → "Redeploy"

---

## 🔐 **SECURITY NOTES**

### **JWT Secret Generation:**
```bash
# Generate a secure JWT secret (64+ characters)
openssl rand -base64 64

# Or use online generator: https://generate-secret.vercel.app/64
```

### **Razorpay Keys:**
- **Test Keys**: Start with `rzp_test_` (for testing)
- **Live Keys**: Start with `rzp_live_` (for production)
- Get from: Razorpay Dashboard → Settings → API Keys

### **Database Connection:**
- Your Azure connection string should include `sslmode=require`
- Username format: `username@servername`
- Ensure Azure firewall allows Railway's IP ranges

---

## 🚨 **CRITICAL DEPLOYMENT ORDER**

1. **Deploy Backend First** → Get Railway URL
2. **Update FRONTEND_URL** in backend env vars
3. **Deploy Frontend** → Use Railway URL in `NEXT_PUBLIC_API_URL`
4. **Test Connection** between frontend and backend
5. **Update Payment Keys** from test to live
6. **Final Testing** with real transactions

---

## 📋 **ENVIRONMENT VARIABLES CHECKLIST**

### **Backend (Railway) - 11 Variables:**
- [ ] `SPRING_PROFILES_ACTIVE=prod`
- [ ] `DB_URL` (Azure PostgreSQL connection string)
- [ ] `DB_USERNAME` (Azure database username)
- [ ] `DB_PASSWORD` (Azure database password)
- [ ] `JWT_SECRET` (64+ character secure string)
- [ ] `JWT_ACCESS_EXPIRATION=900000`
- [ ] `JWT_REFRESH_EXPIRATION=604800000`
- [ ] `AUTH_COOKIE_SECURE=true`
- [ ] `AUTH_COOKIE_SAME_SITE=None`
- [ ] `FRONTEND_URL` (Vercel deployment URL)
- [ ] `RAZORPAY_KEY_ID` (Live key)
- [ ] `RAZORPAY_KEY_SECRET` (Live secret)
- [ ] `SEED_DATA_ENABLED=false`

### **Frontend (Vercel) - 1 Variable:**
- [ ] `NEXT_PUBLIC_API_URL` (Railway deployment URL)

**Total**: 13 environment variables to configure

---

## 🔧 **EXAMPLE WITH PLACEHOLDER VALUES**

### **Backend Example:**
```bash
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://odessi-server.postgres.database.azure.com:5432/odessi_db?sslmode=require
DB_USERNAME=odessi_admin@odessi-server
DB_PASSWORD=MyStr0ngP@ssw0rd123!
JWT_SECRET=mySuperSecureJWTSecretThatIsVeryLongAndSecureForProduction12345678901234567890
FRONTEND_URL=https://odessi-store.vercel.app
RAZORPAY_KEY_ID=rzp_live_abcd1234567890
RAZORPAY_KEY_SECRET=live_secret_key_here_1234567890
```

### **Frontend Example:**
```bash
NEXT_PUBLIC_API_URL=https://odessi-api.up.railway.app
```

**Remember**: Replace ALL placeholder values with your actual credentials!

---

## 🎯 **NEXT STEPS**

1. **Gather Your Credentials**:
   - Azure database connection details
   - Razorpay live API keys
   - Generate new JWT secret

2. **Deploy Backend**:
   - Create Railway account
   - Connect GitHub repository
   - Set all backend environment variables

3. **Deploy Frontend**:
   - Install Vercel CLI: `npm i -g vercel`
   - Run `vercel --prod` in project root
   - Set frontend environment variables

4. **Test & Launch**! 🚀