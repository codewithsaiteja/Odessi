# 🚀 **ODESSI.TFI DEPLOYMENT GUIDE**

Complete guide to deploy your full-stack e-commerce application to production.

---

## 📋 **PREREQUISITES**

### **Required Accounts:**
- ✅ **Vercel** (Frontend hosting - free tier available)
- ✅ **Railway** or **Render** (Backend + Database hosting)
- ✅ **Razorpay** (Payment processing - live account)
- ✅ **Domain** (optional but recommended)

### **Required Tools:**
```bash
npm install -g vercel    # Vercel CLI
git                      # Version control
```

---

## 🎯 **DEPLOYMENT OPTIONS**

### **Option 1: Vercel + Railway (RECOMMENDED)**
- ✅ **Frontend**: Vercel (optimized for Next.js)
- ✅ **Backend**: Railway (includes PostgreSQL)
- ✅ **Database**: Railway PostgreSQL addon
- ✅ **Cost**: Free tier available, scales with usage

### **Option 2: Docker Compose (Self-Hosted)**
- ✅ **All services**: Your own VPS/server
- ✅ **Database**: PostgreSQL container
- ✅ **Cost**: VPS hosting costs only

### **Option 3: Cloud Providers (AWS/Azure/GCP)**
- ✅ **Advanced**: Full cloud infrastructure
- ✅ **Scalable**: Enterprise-grade deployment

---

## 🚀 **OPTION 1: VERCEL + RAILWAY (RECOMMENDED)**

### **Step 1: Deploy Backend to Railway**

1. **Create Railway Account**: https://railway.app
2. **Create New Project**: 
   - Connect your GitHub repository
   - Select `odessi-store/backend/odessi-api` folder
3. **Add PostgreSQL**: 
   - Click "Add Service" → "Database" → "PostgreSQL"
4. **Set Environment Variables** in Railway dashboard:
   ```env
   SPRING_PROFILES_ACTIVE=prod
   JWT_SECRET=your-super-secure-jwt-secret-change-this
   FRONTEND_URL=https://your-app.vercel.app
   RAZORPAY_KEY_ID=your_live_razorpay_key
   RAZORPAY_KEY_SECRET=your_live_razorpay_secret
   AUTH_COOKIE_SECURE=true
   SEED_DATA_ENABLED=false
   ```
5. **Deploy**: Railway auto-deploys on git push

### **Step 2: Deploy Frontend to Vercel**

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy from project root**:
   ```bash
   cd odessi-store
   vercel
   ```

3. **Set Environment Variables** in Vercel dashboard:
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   ```

4. **Custom Domain** (optional):
   - Add your domain in Vercel dashboard
   - Update DNS records as instructed

### **Step 3: Configure Production Settings**

1. **Update Backend CORS**:
   - Set `FRONTEND_URL` to your Vercel domain
   
2. **Update Razorpay**:
   - Switch to live API keys
   - Configure webhook URL: `https://your-backend.railway.app/api/payments/razorpay/webhook`

3. **Test Deployment**:
   - Visit your Vercel URL
   - Test user registration/login
   - Test product browsing and cart
   - Test checkout flow

---

## 🐳 **OPTION 2: DOCKER COMPOSE**

### **Prerequisites:**
- Docker & Docker Compose installed
- VPS/server with public IP
- Domain name (optional)

### **Deploy:**

1. **Clone to server**:
   ```bash
   git clone your-repo-url
   cd odessi-store
   ```

2. **Configure environment**:
   ```bash
   cp .env.production.example .env.production
   cp backend/odessi-api/.env.production.example backend/odessi-api/.env.production
   # Edit both files with your actual values
   ```

3. **Start services**:
   ```bash
   docker-compose up -d
   ```

4. **Setup reverse proxy** (recommended):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       location /api {
           proxy_pass http://localhost:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

---

## 🔒 **SECURITY CHECKLIST**

### **Environment Variables:**
- ✅ Generate new JWT_SECRET for production
- ✅ Use live Razorpay keys
- ✅ Set AUTH_COOKIE_SECURE=true
- ✅ Disable SEED_DATA_ENABLED in production

### **Database:**
- ✅ Use strong database passwords
- ✅ Enable SSL connections
- ✅ Regular backups configured
- ✅ Network access restrictions

### **Application:**
- ✅ HTTPS enforced (handled by hosting platforms)
- ✅ Security headers configured
- ✅ Rate limiting enabled
- ✅ Error messages don't expose internals

---

## 📊 **MONITORING & MAINTENANCE**

### **Health Checks:**
- **Backend**: `https://your-backend/actuator/health`
- **Frontend**: Monitor via hosting platform dashboards

### **Logs:**
- **Railway**: Built-in log viewer
- **Vercel**: Function logs in dashboard
- **Docker**: `docker-compose logs -f`

### **Database Backups:**
- **Railway**: Automatic backups included
- **Self-hosted**: Configure pg_dump cron jobs

### **Updates:**
```bash
git pull origin main
# Railway/Vercel auto-deploy on push
# Docker: docker-compose up -d --build
```

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues:**

1. **CORS Errors**:
   - Check FRONTEND_URL environment variable
   - Verify domain matches exactly

2. **Database Connection**:
   - Verify DB_URL format: `postgresql://user:password@host:port/database`
   - Check if database addon is properly linked

3. **Payment Issues**:
   - Ensure live Razorpay keys are set
   - Configure webhook URL correctly
   - Test in Razorpay dashboard

4. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Check for environment variable dependencies

### **Getting Help:**
- Check hosting platform documentation
- Review application logs
- Test locally with production environment variables

---

## 💡 **PERFORMANCE OPTIMIZATION**

### **Frontend (Vercel):**
- ✅ Next.js Image Optimization enabled
- ✅ Static assets cached automatically
- ✅ CDN distribution worldwide

### **Backend (Railway):**
- ✅ Connection pooling configured
- ✅ Rate limiting implemented
- ✅ Health check endpoints

### **Database:**
- ✅ Proper indexing on queries
- ✅ Connection pooling
- ✅ Query optimization

---

## 🎉 **GO LIVE CHECKLIST**

Before launching:
- [ ] Test user registration/login flow
- [ ] Test product browsing and search
- [ ] Test cart functionality
- [ ] Test checkout process
- [ ] Test payment processing
- [ ] Test admin functions
- [ ] Verify email notifications
- [ ] Check mobile responsiveness
- [ ] Performance test with load
- [ ] Security scan completed
- [ ] Backup strategy confirmed
- [ ] Monitoring alerts configured

**Your Odessi.tfi e-commerce store is ready for production! 🚀**