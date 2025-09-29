# TaskVIP Deployment Guide

This guide covers deploying the TaskVIP platform to production using various cloud providers.

## 🚀 Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- Domain name (optional)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd TaskVIP
```

### 2. Configure Environment
```bash
# Copy environment files
cp backend/env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Edit backend/.env
MONGODB_URI=mongodb://admin:password123@mongodb:27017/taskvip?authSource=admin
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://localhost:3000

# Edit frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Deploy with Docker Compose
```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Seed Sample Data
```bash
# Run seed script
docker-compose exec backend node scripts/seed-data.js
```

### 5. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- MongoDB: localhost:27017

## ☁️ Production Deployment

### Option 1: AWS EC2 + Vercel

#### Backend (AWS EC2)

1. **Launch EC2 Instance**
   - Instance Type: t3.medium or larger
   - OS: Ubuntu 20.04 LTS
   - Security Groups: HTTP (80), HTTPS (443), SSH (22), Custom (5000)

2. **Setup Server**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

3. **Deploy Application**
```bash
# Clone repository
git clone <repository-url>
cd TaskVIP/backend

# Install dependencies
npm install --production

# Configure environment
cp env.example .env
# Edit .env with production values

# Start with PM2
pm2 start server.js --name taskvip-backend
pm2 save
pm2 startup
```

4. **Setup Nginx (Optional)**
```bash
# Install Nginx
sudo apt install nginx

# Configure reverse proxy
sudo nano /etc/nginx/sites-available/taskvip
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Frontend (Vercel)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy Frontend**
```bash
cd frontend
vercel --prod
```

3. **Configure Environment Variables**
In Vercel dashboard:
- `NEXT_PUBLIC_API_URL`: https://your-backend-domain.com/api

### Option 2: MongoDB Atlas + Railway/Render

#### Database (MongoDB Atlas)

1. **Create MongoDB Atlas Account**
2. **Create Cluster**
   - Choose AWS/Google Cloud/Azure
   - Select region closest to your users
   - Choose M0 (Free) or M2+ for production

3. **Configure Database Access**
   - Create database user
   - Set password
   - Whitelist IP addresses (0.0.0.0/0 for development)

4. **Get Connection String**
```
mongodb+srv://username:password@cluster.mongodb.net/taskvip
```

#### Backend (Railway)

1. **Connect GitHub Repository**
2. **Set Environment Variables**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskvip
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

3. **Deploy**
Railway will automatically build and deploy

#### Frontend (Vercel)

Same as Option 1

### Option 3: Full AWS Deployment

#### Using AWS Elastic Beanstalk

1. **Backend Deployment**
```bash
# Install EB CLI
pip install awsebcli

# Initialize EB
eb init

# Create environment
eb create production

# Deploy
eb deploy
```

2. **Frontend Deployment**
```bash
# Build for production
cd frontend
npm run build

# Deploy to S3 + CloudFront
aws s3 sync out/ s3://your-bucket-name
```

#### Using AWS ECS with Fargate

1. **Create ECS Cluster**
2. **Create Task Definitions**
3. **Create Services**
4. **Configure Load Balancer**

## 🔧 Environment Configuration

### Backend Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/taskvip

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Ad Network API Keys
PROPELLERADS_API_KEY=your-propellerads-api-key
ADSTERRA_API_KEY=your-adsterra-api-key
ADGATE_API_KEY=your-adgate-api-key
ADSCEND_API_KEY=your-adscend-api-key

# Payment Gateway
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Admin Configuration
ADMIN_EMAIL=admin@taskvip.com
ADMIN_PASSWORD=admin123

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

### Frontend Environment Variables

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
```

## 📊 Monitoring and Logging

### Application Monitoring

1. **Health Checks**
   - Backend: `GET /api/health`
   - Frontend: Built-in Next.js health checks

2. **Logging**
   - Backend: Console logs with timestamps
   - Frontend: Browser console + server logs

3. **Error Tracking**
   - Consider integrating Sentry for error tracking
   - Set up alerts for critical errors

### Database Monitoring

1. **MongoDB Atlas**
   - Built-in monitoring dashboard
   - Performance insights
   - Alert configuration

2. **Self-hosted MongoDB**
   - Use MongoDB Compass for monitoring
   - Set up log rotation
   - Monitor disk space

## 🔒 Security Considerations

### SSL/TLS Certificates

1. **Let's Encrypt (Free)**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com
```

2. **AWS Certificate Manager**
   - Request certificate in ACM
   - Attach to CloudFront/ALB

### Security Headers

1. **Helmet.js** (Already configured)
2. **CORS Configuration**
3. **Rate Limiting**
4. **Input Validation**

### Database Security

1. **MongoDB Authentication**
2. **Network Security**
3. **Regular Backups**
4. **Access Control**

## 📈 Performance Optimization

### Backend Optimization

1. **Database Indexing**
   - All models have proper indexes
   - Monitor slow queries

2. **Caching**
   - Consider Redis for session storage
   - Cache frequently accessed data

3. **Load Balancing**
   - Use multiple backend instances
   - Configure health checks

### Frontend Optimization

1. **Next.js Optimization**
   - Image optimization
   - Code splitting
   - Static generation where possible

2. **CDN Configuration**
   - Use Vercel's global CDN
   - Configure caching headers

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection**
   - Check MongoDB URI
   - Verify network connectivity
   - Check authentication credentials

2. **CORS Errors**
   - Verify FRONTEND_URL in backend
   - Check CORS configuration

3. **JWT Issues**
   - Verify JWT_SECRET
   - Check token expiration

4. **Build Failures**
   - Check Node.js version
   - Verify all dependencies
   - Check environment variables

### Debug Commands

```bash
# Check backend logs
docker-compose logs backend

# Check frontend logs
docker-compose logs frontend

# Check database
docker-compose logs mongodb

# Restart services
docker-compose restart

# View running processes
docker-compose ps
```

## 📞 Support

For deployment issues:
- Check the logs first
- Verify environment variables
- Test database connectivity
- Check network configuration

## 🔄 Updates and Maintenance

### Updating the Application

1. **Pull Latest Changes**
```bash
git pull origin main
```

2. **Rebuild and Restart**
```bash
docker-compose down
docker-compose up -d --build
```

3. **Run Migrations** (if any)
```bash
docker-compose exec backend node scripts/migrate.js
```

### Backup Strategy

1. **Database Backups**
   - MongoDB Atlas: Automatic backups
   - Self-hosted: Regular mongodump

2. **Application Backups**
   - Code: Git repository
   - Environment: Secure storage
   - SSL certificates: Secure storage

---

**Happy Deploying! 🚀**
