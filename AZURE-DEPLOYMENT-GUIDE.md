# 🚀 **AZURE DEPLOYMENT GUIDE FOR ODESSI.TFI**

## 📋 **YOUR DEPLOYMENT CHECKLIST**

✅ **GitHub**: Latest code pushed to https://github.com/codewithsaiteja/Odessi.git  
✅ **Azure Database**: Already set up and ready  
🔄 **Backend**: Deploy to Railway/Render  
🔄 **Frontend**: Deploy to Vercel  

---

## 🎯 **BACKEND DEPLOYMENT (Railway - RECOMMENDED)**

### **Step 1: Deploy to Railway**

1. **Sign up**: https://railway.app
2. **Create New Project**: Click "Deploy from GitHub repo"
3. **Select Repository**: `codewithsaiteja/Odessi`
4. **Root Directory**: Change to `backend/odessi-api`
5. **Auto-Deploy**: Railway will detect Spring Boot and build automatically

### **Step 2: Set Environment Variables in Railway**

In Railway dashboard → Environment Variables, add:

```bash
# ══════════════════════════════════════════════════════
# AZURE DATABASE CONNECTION
# ══════════════════════════════════════════════════════
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://YOUR_AZURE_SERVER.postgres.database.azure.com:5432/YOUR_DATABASE_NAME?sslmode=require
DB_USERNAME=your_azure_username@YOUR_AZURE_SERVER
DB_PASSWORD=your_azure_password

# ══════════════════════════════════════════════════════
# SECURITY & AUTHENTICATION
# ══════════════════════════════════════════════════════
JWT_SECRET=mySuperSecureJWTSecretKeyThatIsAtLeast32CharactersLongForProduction123
JWT_ACCESS_EXPIRATION=900000
JWT_REFRESH_EXPIRATION=604800000
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=None

# ══════════════════════════════════════════════════════
# CORS & FRONTEND URL (Update after frontend deployment)
# ══════════════════════════════════════════════════════
FRONTEND_URL=https://your-frontend-name.vercel.app

# ══════════════════════════════════════════════════════
# RAZORPAY (PRODUCTION KEYS)
# ══════════════════════════════════════════════════════
RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
RAZORPAY_KEY_SECRET=your_live_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# ══════════════════════════════════════════════════════
# APPLICATION SETTINGS
# ══════════════════════════════════════════════════════
SERVER_PORT=8080
SEED_DATA_ENABLED=false
RATE_LIMIT_UNAUTH_MAX=5
RATE_LIMIT_AUTH_MAX=50
```

### **Step 3: Get Your Backend URL**
After deployment, Railway will provide a URL like:
`https://your-backend-name.up.railway.app`

---

## 🎯 **FRONTEND DEPLOYMENT (Vercel)**

### **Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

### **Step 2: Deploy Frontend**
```bash
cd odessi-store
vercel --prod
```

### **Step 3: Set Environment Variables in Vercel**
In Vercel dashboard → Environment Variables:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-name.up.railway.app
```

### **Step 4: Update Backend CORS**
Go back to Railway dashboard and update:
```bash
FRONTEND_URL=https://your-frontend-name.vercel.app
```

---

## 🔧 **AZURE DATABASE CONFIGURATION**

### **Your Azure Connection Details:**
```bash
# Format: postgresql://username%40servername:password@servername.postgres.database.azure.com:5432/databasename?sslmode=require

Server: YOUR_SERVER.postgres.database.azure.com
Database: YOUR_DATABASE_NAME
Username: YOUR_USERNAME@YOUR_SERVER
Password: YOUR_PASSWORD
SSL: Required (sslmode=require)
```

### **Flyway Migrations**
The backend will automatically run database migrations on first startup.

---

## 🚨 **CRITICAL SECURITY STEPS**

### **1. Generate New JWT Secret**
```bash
# Use this command or generate a 64+ character random string
openssl rand -base64 64
```

### **2. Razorpay Production Setup**
- Switch from test to live keys in Razorpay dashboard
- Configure webhook URL: `https://your-backend.railway.app/api/payments/razorpay/webhook`
- Test payment flow in live mode

### **3. HTTPS & Security Headers**
- Railway and Vercel provide HTTPS automatically
- Security headers are configured in the application

---

## 📁 **DEPLOYMENT FOLDERS & FILES**

### **Backend Files (Railway):**
- 📁 `backend/odessi-api/` - Main Spring Boot application
- 📄 `backend/odessi-api/pom.xml` - Dependencies and build config
- 📄 `backend/odessi-api/src/main/resources/application.yml` - Configuration
- 📁 `backend/odessi-api/src/main/resources/db/migration/` - Database migrations

### **Frontend Files (Vercel):**
- 📁 `odessi-store/` (root directory)
- 📄 `package.json` - Dependencies
- 📄 `next.config.js` - Next.js configuration
- 📄 `vercel.json` - Vercel deployment settings

### **Docker Alternative (Self-Hosted):**
- 📄 `docker-compose.yml` - Full-stack containerization
- 📄 `Dockerfile` - Frontend container
- 📄 `backend/Dockerfile` - Backend container

---

## 🔗 **DEPLOYMENT URLS**

After deployment, you'll have:
- **Frontend**: https://your-app.vercel.app
- **Backend API**: https://your-backend.railway.app
- **API Docs**: https://your-backend.railway.app/swagger-ui.html
- **Health Check**: https://your-backend.railway.app/actuator/health

---

## 🧪 **TESTING CHECKLIST**

### **After Backend Deployment:**
- [ ] Visit health check endpoint: `/actuator/health`
- [ ] Check database connection in Railway logs
- [ ] Verify Flyway migrations completed
- [ ] Test API endpoints: `/api/health`

### **After Frontend Deployment:**
- [ ] Visit homepage - should load without errors
- [ ] Test user registration/login
- [ ] Browse products and categories
- [ ] Add items to cart
- [ ] Test checkout flow (use Razorpay test mode first)

### **Integration Testing:**
- [ ] Frontend connects to backend API
- [ ] Authentication works end-to-end
- [ ] Database operations function correctly
- [ ] Payment processing works

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues:**

1. **Database Connection Failed**
   - Check Azure firewall rules allow Railway IP ranges
   - Verify connection string format with `%40` encoding
   - Ensure SSL mode is required

2. **CORS Errors**
   - Verify `FRONTEND_URL` matches exact Vercel domain
   - Check for `https://` prefix in URL

3. **Authentication Issues**
   - Generate new JWT secret for production
   - Verify cookie settings for cross-domain

4. **Payment Failures**
   - Switch to live Razorpay keys
   - Configure webhook URL correctly
   - Test with small amounts first

### **Getting Help:**
- Railway logs: Dashboard → Deployments → Logs
- Vercel logs: Dashboard → Functions → View Function Logs
- Azure logs: Portal → Database → Monitoring

---

## 🎉 **GO LIVE STEPS**

1. **Deploy Backend** → Get Railway URL
2. **Deploy Frontend** → Get Vercel URL  
3. **Update CORS settings** in backend
4. **Test all functionality** end-to-end
5. **Switch to live Razorpay keys**
6. **Configure custom domain** (optional)
7. **Set up monitoring** and alerts
8. **Announce launch!** 🚀

**Your Odessi.tfi store is ready for production!**