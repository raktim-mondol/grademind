# GradeMind - Production Deployment Guide

## Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or cloud)
- Clerk account with production keys
- Domain name (optional but recommended)

## Frontend Deployment

### 1. Environment Setup

Create `.env.production` in the `client` directory:

```bash
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY
REACT_APP_API_URL=https://your-backend-domain.com/api
```

### 2. Build for Production

```bash
cd client
npm install
npm run build
```

This creates an optimized production build in the `client/build` directory.

### 3. Deploy Options

#### Option A: Vercel (Recommended for Frontend)

```bash
npm install -g vercel
vercel --prod
```

#### Option B: Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=build
```

#### Option C: Static Hosting (AWS S3, Cloudflare Pages, etc.)

Upload the contents of `client/build` to your static hosting provider.

**Important:** Configure your hosting to serve `index.html` for all routes (SPA routing).

## Backend Deployment

### 1. Environment Setup

Create `.env` in the `server` directory:

```bash
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/edugrade
REDIS_URL=redis://your-redis-instance:6379
GEMINI_API_KEY=your_gemini_api_key
CLERK_SECRET_KEY=sk_live_YOUR_SECRET_KEY
```

### 2. Deploy Options

#### Option A: Railway (Recommended for Backend)

1. Push code to GitHub
2. Connect Railway to your repository
3. Add environment variables in Railway dashboard
4. Deploy automatically

#### Option B: Heroku

```bash
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set MONGO_URI=your_mongo_uri
# ... set other env vars
git push heroku main
```

#### Option C: VPS (DigitalOcean, AWS EC2, etc.)

```bash
# On your server
git clone your-repo
cd server
npm install --production
pm2 start server.js --name grademind
pm2 save
pm2 startup
```

## Post-Deployment Checklist

### Security
- [ ] All environment variables are set correctly
- [ ] HTTPS is enabled on both frontend and backend
- [ ] CORS is configured to allow only your frontend domain
- [ ] Rate limiting is enabled
- [ ] Database has authentication enabled

### Performance
- [ ] Frontend build is minified and optimized
- [ ] Images are compressed
- [ ] CDN is configured (optional)
- [ ] Caching headers are set

### Monitoring
- [ ] Error tracking is set up (Sentry recommended)
- [ ] Analytics is configured (Google Analytics optional)
- [ ] Uptime monitoring is enabled
- [ ] Database backups are scheduled

### SEO
- [ ] Meta tags are configured
- [ ] Sitemap is generated
- [ ] robots.txt is configured
- [ ] SSL certificate is valid

## Environment Variables Reference

### Frontend (client/.env.production)
```
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_live_xxx
REACT_APP_API_URL=https://api.yourdomain.com/api
```

### Backend (server/.env)
```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://...
REDIS_URL=redis://...
GEMINI_API_KEY=xxx
CLERK_SECRET_KEY=sk_live_xxx
R2_ENDPOINT=https://...
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=edugrade-files
```

## Troubleshooting

### Frontend Issues

**Blank page after deployment:**
- Check browser console for errors
- Verify `REACT_APP_API_URL` is correct
- Ensure routing is configured for SPA

**API calls failing:**
- Check CORS configuration on backend
- Verify API URL includes `/api` path
- Check network tab for actual error

### Backend Issues

**Database connection failed:**
- Verify MongoDB URI is correct
- Check IP whitelist in MongoDB Atlas
- Ensure network access is configured

**Worker processes not starting:**
- Check Redis connection
- Verify all environment variables are set
- Check logs for specific errors

## Support

For deployment issues, check:
- [Deployment Guide](./DEPLOYMENT.md)
- [Clerk Setup Guide](./CLERK_SETUP_GUIDE.md)
- GitHub Issues

## Production URLs

After deployment, update these in your Clerk dashboard:
- **Allowed redirect URLs:** `https://yourdomain.com/*`
- **Allowed origins:** `https://yourdomain.com`
