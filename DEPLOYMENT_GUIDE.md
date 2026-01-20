# StyleSwap Multi-Boutique Deployment Guide

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Database Setup](#database-setup)
3. [Environment Configuration](#environment-configuration)
4. [Deployment Steps](#deployment-steps)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`pnpm test`)
- [ ] No TypeScript errors (`pnpm build`)
- [ ] No linting issues (`pnpm lint`)
- [ ] Code reviewed by team
- [ ] Security audit completed

### Documentation
- [ ] README updated
- [ ] API documentation complete
- [ ] Database schema documented
- [ ] Deployment guide reviewed
- [ ] Runbook created

### Infrastructure
- [ ] Database backups configured
- [ ] SSL certificates valid
- [ ] CDN configured
- [ ] Monitoring tools set up
- [ ] Logging configured

### Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Load testing completed
- [ ] Security testing completed

---

## Database Setup

### 1. Create Database
```bash
# Create MySQL database
CREATE DATABASE styleswap_production;
CREATE USER 'styleswap'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON styleswap_production.* TO 'styleswap'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Run Migrations
```bash
# Set environment
export DATABASE_URL="mysql://styleswap:secure_password@localhost:3306/styleswap_production"

# Run all migrations
pnpm db:push
```

### 3. Verify Schema
```bash
# Check tables created
mysql -u styleswap -p styleswap_production -e "SHOW TABLES;"

# Verify key tables
mysql -u styleswap -p styleswap_production -e "DESC boutiques;"
mysql -u styleswap -p styleswap_production -e "DESC boutiqueCredits;"
mysql -u styleswap -p styleswap_production -e "DESC products;"
```

### 4. Backup Strategy
```bash
# Daily backup
0 2 * * * mysqldump -u styleswap -p styleswap_production > /backups/styleswap_$(date +\%Y\%m\%d).sql

# Weekly backup to S3
0 3 * * 0 aws s3 cp /backups/styleswap_$(date +\%Y\%m\%d).sql s3://styleswap-backups/
```

---

## Environment Configuration

### 1. Create .env.production
```bash
# Database
DATABASE_URL=mysql://styleswap:secure_password@host:3306/styleswap_production

# OAuth
VITE_APP_ID=your_oauth_app_id
OAUTH_SERVER_URL=https://oauth.server.com
VITE_OAUTH_PORTAL_URL=https://oauth.portal.com
JWT_SECRET=your_jwt_secret_key

# Fitroom API
FITROOM_API_KEY=your_fitroom_api_key

# Payment Processing (Yoko)
YOKO_API_BASE_URL=https://api.yoko.com
YOKO_PUBLIC_KEY=your_yoko_public_key
YOKO_SECRET_KEY=your_yoko_secret_key

# Manus APIs
BUILT_IN_FORGE_API_URL=https://api.manus.com
BUILT_IN_FORGE_API_KEY=your_forge_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.com
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_key

# Twilio (SMS notifications)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+27...

# Analytics
VITE_ANALYTICS_ENDPOINT=https://analytics.styleswap.com
VITE_ANALYTICS_WEBSITE_ID=your_website_id

# App Configuration
VITE_APP_TITLE="StyleSwap"
VITE_APP_LOGO=https://cdn.styleswap.com/logo.png
OWNER_NAME="StyleSwap Admin"
OWNER_OPEN_ID=admin_open_id
```

### 2. Verify Environment
```bash
# Check all required variables
node -e "
const required = [
  'DATABASE_URL', 'FITROOM_API_KEY', 'JWT_SECRET',
  'VITE_APP_ID', 'OAUTH_SERVER_URL'
];
required.forEach(v => {
  if (!process.env[v]) console.error(\`Missing: \${v}\`);
});
"
```

---

## Deployment Steps

### 1. Pre-Deployment
```bash
# Create backup of current production
mysqldump -u styleswap -p styleswap_production > /backups/pre-deploy-$(date +%Y%m%d-%H%M%S).sql

# Notify team
echo "Deployment starting at $(date)" | mail -s "StyleSwap Deployment" team@styleswap.com
```

### 2. Build
```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build application
pnpm build

# Verify build output
ls -la dist/
```

### 3. Database Migration
```bash
# Generate migrations if needed
pnpm drizzle-kit generate

# Apply migrations
pnpm db:push

# Verify schema
pnpm db:check
```

### 4. Deploy Application
```bash
# Stop current service
systemctl stop styleswap

# Deploy new version
cp -r dist/* /opt/styleswap/
cp .env.production /opt/styleswap/

# Start service
systemctl start styleswap

# Verify service
systemctl status styleswap
```

### 5. Post-Deployment
```bash
# Check application health
curl -s https://styleswap.com/api/health | jq .

# Verify database connection
curl -s https://styleswap.com/api/trpc/system.health | jq .

# Check logs
tail -f /var/log/styleswap/error.log
```

---

## Post-Deployment Verification

### 1. Health Checks
```bash
# API Health
curl https://styleswap.com/api/health

# Database Connection
curl https://styleswap.com/api/trpc/system.health

# OAuth Integration
curl https://styleswap.com/api/oauth/status

# Fitroom API
curl https://styleswap.com/api/trpc/system.fitroomStatus
```

### 2. Functionality Tests
```bash
# Test B2C flow
curl -X POST https://styleswap.com/api/trpc/tryon.createTryOn \
  -H "Content-Type: application/json" \
  -d '{"bodyPhotoBase64":"...", "clothingImageBase64":"..."}'

# Test B2B flow
curl -X POST https://styleswap.com/api/trpc/b2bTryon.createB2BTryOn \
  -H "Content-Type: application/json" \
  -d '{"boutiqueId":1, "productId":1, "bodyPhotoBase64":"..."}'

# Test billing
curl https://styleswap.com/api/trpc/billing.getCreditTiers
```

### 3. Performance Monitoring
```bash
# Check response times
ab -n 100 -c 10 https://styleswap.com/

# Monitor server resources
top -b -n 1 | head -20

# Check disk usage
df -h /opt/styleswap/

# Check database performance
mysql -u styleswap -p styleswap_production -e "SHOW STATUS LIKE 'Threads%';"
```

### 4. Log Analysis
```bash
# Check for errors
grep ERROR /var/log/styleswap/*.log

# Check for warnings
grep WARN /var/log/styleswap/*.log

# Monitor API calls
tail -f /var/log/styleswap/api.log | grep -E "ERROR|WARN"
```

---

## Monitoring & Maintenance

### 1. Daily Tasks
- [ ] Check error logs
- [ ] Monitor database performance
- [ ] Verify backups completed
- [ ] Check disk space
- [ ] Review API metrics

### 2. Weekly Tasks
- [ ] Review security logs
- [ ] Analyze usage patterns
- [ ] Check credit system accuracy
- [ ] Review customer support tickets
- [ ] Update documentation

### 3. Monthly Tasks
- [ ] Full system audit
- [ ] Performance optimization
- [ ] Security assessment
- [ ] Capacity planning
- [ ] Team training

### 4. Monitoring Tools
```bash
# Set up monitoring
# Option 1: Prometheus
docker run -d -p 9090:9090 prom/prometheus

# Option 2: Datadog
curl -s https://s3.amazonaws.com/dd-agent/scripts/install_agent.sh | bash

# Option 3: New Relic
npm install newrelic
```

---

## Troubleshooting

### Issue: Database Connection Error
```bash
# Check connection string
echo $DATABASE_URL

# Test connection
mysql -u styleswap -p -h host styleswap_production -e "SELECT 1;"

# Check MySQL service
systemctl status mysql

# Restart MySQL
systemctl restart mysql
```

### Issue: High Memory Usage
```bash
# Check Node process
ps aux | grep node

# Monitor memory
watch -n 1 'ps aux | grep node'

# Restart service
systemctl restart styleswap
```

### Issue: Slow API Responses
```bash
# Check database queries
mysql -u styleswap -p styleswap_production -e "SHOW PROCESSLIST;"

# Analyze slow queries
mysql -u styleswap -p styleswap_production -e "SELECT * FROM mysql.slow_log;"

# Optimize tables
mysql -u styleswap -p styleswap_production -e "OPTIMIZE TABLE boutiques;"
```

### Issue: Credit System Not Working
```bash
# Check boutique credits
mysql -u styleswap -p styleswap_production -e "SELECT * FROM boutiqueCredits LIMIT 5;"

# Check transactions
mysql -u styleswap -p styleswap_production -e "SELECT * FROM boutiqueTransactions ORDER BY createdAt DESC LIMIT 10;"

# Verify credit logic
pnpm test -- billing
```

---

## Rollback Procedures

### 1. Quick Rollback (Last 1 Hour)
```bash
# Stop current service
systemctl stop styleswap

# Restore from backup
cp /backups/pre-deploy-*.sql /tmp/
mysql -u styleswap -p styleswap_production < /tmp/pre-deploy-*.sql

# Restore previous build
git checkout HEAD~1
pnpm build
cp -r dist/* /opt/styleswap/

# Start service
systemctl start styleswap

# Verify
curl https://styleswap.com/api/health
```

### 2. Full Rollback (Last 24 Hours)
```bash
# Stop service
systemctl stop styleswap

# Restore database from daily backup
mysql -u styleswap -p styleswap_production < /backups/styleswap_$(date -d yesterday +%Y%m%d).sql

# Restore previous version from git
git checkout v1.0.0
pnpm install
pnpm build
cp -r dist/* /opt/styleswap/

# Start service
systemctl start styleswap

# Notify team
echo "Rollback completed at $(date)" | mail -s "StyleSwap Rollback" team@styleswap.com
```

### 3. Verify Rollback
```bash
# Check service status
systemctl status styleswap

# Verify database
mysql -u styleswap -p styleswap_production -e "SELECT COUNT(*) FROM boutiques;"

# Test API
curl https://styleswap.com/api/health

# Check logs for errors
tail -100 /var/log/styleswap/error.log
```

---

## Deployment Checklist (Final)

### Before Deployment
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Database backup created
- [ ] Team notified
- [ ] Rollback plan ready

### During Deployment
- [ ] Monitor logs in real-time
- [ ] Check API responses
- [ ] Verify database migrations
- [ ] Test critical flows
- [ ] Monitor server resources

### After Deployment
- [ ] All health checks passing
- [ ] No error spikes
- [ ] Performance acceptable
- [ ] Team confirmed working
- [ ] Deployment documented

---

## Support & Escalation

### Critical Issues
- Contact: devops@styleswap.com
- Escalation: CTO
- Response Time: 15 minutes

### High Priority Issues
- Contact: support@styleswap.com
- Response Time: 1 hour

### Low Priority Issues
- Contact: support@styleswap.com
- Response Time: 24 hours

---

## Additional Resources

- [Database Schema Documentation](./DATABASE_SCHEMA.md)
- [API Documentation](./API_DOCS.md)
- [B2C vs B2B Flow Guide](./B2C_B2B_FLOW_GUIDE.md)
- [Security & Compliance](./SECURITY_COMPLIANCE_FRAMEWORK.md)
- [Pricing Model](./PRICING_MODEL.md)
