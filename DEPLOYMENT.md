# Deployment Guide: Django Backend on Render.com + React Frontend on Netlify

This guide explains how to deploy the EdTech platform with Django backend on Render.com and React frontend on Netlify.

## Prerequisites

- GitHub repository with your code
- Render.com account (free tier available)
- Netlify account (free tier available)
- Supabase account (optional, for file storage)

## Part 1: Deploy Django Backend on Render.com

### Step 1: Prepare Your Repository

1. Push your code to GitHub
2. Ensure `requirements.txt`, `build.sh`, and `render.yaml` are in the root directory

### Step 2: Create Database on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "PostgreSQL"
3. Configure:
   - Name: `edtech-db`
   - Database: `edtech`
   - User: `edtech`
   - Region: Choose closest to your users
   - Plan: Free (or paid for production)
4. Click "Create Database"
5. Save the connection details (you'll need them)

### Step 3: Deploy Web Service

1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - Name: `edtech-backend`
   - Runtime: Python 3
   - Build Command: `./build.sh`
   - Start Command: `gunicorn --chdir edtech edtech.wsgi:application`
   - Plan: Free (or paid for production)

### Step 4: Configure Environment Variables

Add these environment variables in Render:

**Required:**
- `DJANGO_SECRET_KEY`: Generate a secure secret key
- `DJANGO_DEBUG`: `False`
- `DJANGO_ALLOWED_HOSTS`: `your-app-name.onrender.com`

**Database (from your PostgreSQL database):**
- `DB_NAME`: `edtech`
- `DB_USER`: Your database user
- `DB_PASSWORD`: Your database password
- `DB_HOST`: Your database host
- `DB_PORT`: `5432`

**Frontend:**
- `FRONTEND_URL`: `https://your-netlify-app.netlify.app`

**Optional (Supabase for file storage):**
- `SUPABASE_URL`: Your Supabase URL
- `SUPABASE_SERVICE_ROLE`: Your Supabase service role key
- `SUPABASE_BUCKET`: `courses`

### Step 5: Deploy

1. Click "Create Web Service"
2. Wait for deployment to complete
3. Your backend will be available at: `https://your-app-name.onrender.com`

## Part 2: Deploy React Frontend on Netlify

### Step 1: Update Environment Variables

1. Update `.env.production` with your Render backend URL:
   ```
   VITE_API_BASE_URL=https://your-render-app.onrender.com/api
   VITE_DEMO_MODE=false
   ```

2. Update `netlify.toml` with your backend URL

### Step 2: Deploy to Netlify

**Option A: GitHub Integration (Recommended)**
1. Go to [Netlify](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect GitHub and select your repository
4. Configure:
   - Base directory: `frontend/courseguardian-hub-main`
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click "Deploy site"

**Option B: Manual Deploy**
1. In your frontend directory, run: `npm run build`
2. Go to Netlify and drag the `dist` folder to deploy

### Step 3: Configure Environment Variables on Netlify

In Netlify site settings → Environment variables, add:
- `VITE_API_BASE_URL`: `https://your-render-app.onrender.com/api`
- `VITE_DEMO_MODE`: `false`

### Step 4: Update Backend CORS Settings

Update your backend environment variables on Render:
- `FRONTEND_URL`: `https://your-netlify-app.netlify.app`
- `NETLIFY_URL`: `https://your-netlify-app.netlify.app`

## Part 3: Post-Deployment Steps

### 1. Create Admin User

Access your Render backend shell and create a superuser:
```bash
python edtech/manage.py createsuperuser
```

### 2. Test the Application

1. Visit your Netlify frontend URL
2. Try registering a new account
3. Test login functionality
4. Access admin panel at: `https://your-render-app.onrender.com/admin/`

### 3. Domain Configuration (Optional)

**Custom Domain for Backend:**
1. In Render, go to Settings → Custom Domains
2. Add your custom domain
3. Update `DJANGO_ALLOWED_HOSTS` environment variable

**Custom Domain for Frontend:**
1. In Netlify, go to Domain settings
2. Add your custom domain
3. Update backend `FRONTEND_URL` environment variable

## Important Notes

### Free Tier Limitations

**Render.com Free Tier:**
- Services spin down after 15 minutes of inactivity
- 750 hours/month (enough for always-on)
- Limited resources

**Netlify Free Tier:**
- 100GB bandwidth/month
- 300 build minutes/month
- Unlimited personal projects

### Production Considerations

1. **Database Backups**: Set up automated backups on Render
2. **Environment Security**: Use strong secret keys
3. **Monitoring**: Set up uptime monitoring
4. **SSL**: Both platforms provide free SSL certificates
5. **CDN**: Netlify includes global CDN for frontend

### Demo Mode Deployment

To deploy in demo mode (frontend only, no backend):

1. Set environment variables:
   ```
   VITE_API_BASE_URL=
   VITE_DEMO_MODE=true
   ```

2. Use the demo context in Netlify:
   ```bash
   netlify deploy --context=demo
   ```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure frontend URL is added to backend CORS settings
2. **Database Connection**: Verify all database environment variables
3. **Static Files**: Ensure `collectstatic` runs in build process
4. **Build Failures**: Check build logs for missing dependencies

### Useful Commands

**Check backend logs:**
```bash
# In Render dashboard, go to your service and check logs
```

**Test backend locally:**
```bash
cd edtech
python manage.py runserver
```

**Test frontend locally:**
```bash
cd frontend/courseguardian-hub-main
npm run dev
```

## Cost Estimation

### Free Tier (Suitable for demos and small projects)
- Render: Free
- Netlify: Free
- **Total: $0/month**

### Production Tier (Recommended for real applications)
- Render: $7/month (web service) + $7/month (database)
- Netlify: Free (or $19/month for pro features)
- **Total: $14-33/month**

## Support

For deployment issues:
- Render: [Render Docs](https://render.com/docs)
- Netlify: [Netlify Docs](https://docs.netlify.com/)
- Django: [Django Deployment](https://docs.djangoproject.com/en/4.2/howto/deployment/)
