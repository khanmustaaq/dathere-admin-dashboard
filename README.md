# datHere Admin Dashboard

Modern admin interface for managing CKAN datasets with PortalJS integration.

## Quick Setup

```bash
# Clone the repo
git clone https://github.com/dathere/dathere-admin-dashboard.git
cd dathere-admin-dashboard

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

Edit `.env.local`:
```bash
CKAN_API_URL=http://172.19.0.5:5000          # Your CKAN Docker IP
NEXT_PUBLIC_CKAN_URL=http://localhost:5050   # CKAN public URL
CKAN_API_KEY=your-api-key-here               # Get from CKAN user profile
NEXT_PUBLIC_PORTALJS_URL=http://localhost:3001  # PortalJS portal URL
NEXT_PUBLIC_APP_URL=http://localhost:3002    # Dashboard URL
PORTALJS_STORIES_PATH=/path/to/portaljs/content/stories  # Local dev: path to PortalJS stories folder
```

```bash
# Start dev server
npm run dev
```

Access at: **http://localhost:3002**

##  Get CKAN API Key

1. Go to `http://localhost:5050`
2. Login → Profile → API Tokens
3. Create token → Copy to `.env.local`

##  Features

- **Dataset Management** - Create, edit, delete, search datasets
- **Resource Upload** - Add CSV, Excel, PDF files to datasets
- **Search & Filter** - By organization, tags, visibility
- **PortalJS Integration** - "View Online" opens datasets in public portal
- **Dashboard Analytics** - Quick stats and recent activity

##  Works With PortalJS

```bash
# Terminal 1 - PortalJS (public portal)
cd ~/projects/portaljs-dathere
npm run dev  # http://localhost:3001

# Terminal 2 - Admin Dashboard
cd ~/projects/dathere-admin-dashboard  
npm run dev  # http://localhost:3002
```

**Workflow:**
1. Create/edit datasets in Admin Dashboard (port 3002)
2. View publicly in PortalJS Portal (port 3001)
3. Click "View Online" to open dataset in portal

##  CKAN Setup

Get Docker container IP:
```bash
docker inspect YOUR_CKAN_CONTAINER | grep IPAddress
```

Enable CORS in CKAN:
```bash
docker cp YOUR_CKAN_CONTAINER:/srv/app/ckan.ini ./ckan.ini

# Add to ckan.ini:
ckan.cors.origin_allow_all = true
ckan.cors.origin_whitelist = http://localhost:3001 http://localhost:3002

docker cp ./ckan.ini YOUR_CKAN_CONTAINER:/srv/app/ckan.ini
docker restart YOUR_CKAN_CONTAINER
```

##  Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- CKAN 2.11 API

##  Current Status

 **Working:**
- Dataset CRUD operations
- Search and filtering
- Organization management
- Dashboard analytics
- PortalJS integration

 **In Progress:**
- Visual chart builder with CKAN data integration
- OAuth authentication (Google/GitHub/LinkedIn)
- User management

##  Known Issues
- Resource files must be uploaded to CKAN FileStore (not local storage)
- Currently uses single API key (multi-user auth coming soon)
---
