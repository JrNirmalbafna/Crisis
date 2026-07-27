# Helios Intelligence - Railway Deployment Guide

This repository contains both the Backend API and the React Dashboard, configured for zero-downtime deployment on Railway.

## Prerequisites
1. Create a GitHub repository and push this code to it.
2. Sign up / Log in to [Railway.app](https://railway.app).

## Deployment Steps

You will create two services in the same Railway project: one for the Backend, and one for the Frontend.

### 1. Backend Service (FastAPI + ML Models)
1. Click **"New Project"** -> **"Deploy from GitHub repo"** -> Select your repository.
2. Railway will automatically detect the `Dockerfile` at the root of the project.
3. Once deployed, click on the service -> **Settings**.
4. Scroll down to **Domains** -> Click **"Generate Domain"** (e.g., `helios-api.up.railway.app`).
5. **Environment Variables**: Add the following in the **Variables** tab:
   - `DEBUG=false`
   - `CORS_ORIGINS=https://<your-future-frontend-domain>` (You can update this later)

*Note: The backend will automatically initialize its database and seed the 2MB historical CME catalog on first boot thanks to the `docker-entrypoint.sh` script.*

### 2. Frontend Service (React + Nginx)
1. In the same Railway project, click **"New"** -> **"GitHub Repo"** -> Select the same repository again.
2. Before clicking deploy, click **"Add Variables"** or go to Settings immediately.
3. In the new service **Settings**:
   - Scroll to **Service Directory** (Root Directory) -> Type `/Crisis Dashboard` and save.
   - Railway will now look for the `Dockerfile` inside `Crisis Dashboard/`.
4. Scroll down to **Domains** -> Click **"Generate Domain"** (e.g., `helios-dashboard.up.railway.app`).
5. **Environment Variables**: Add the following in the **Variables** tab:
   - `VITE_API_URL=https://<your-backend-domain>` (Paste the domain generated in step 1.4)

## Why Railway?
As a Senior Developer for high-reliability systems, I chose Railway because:
- **Nixpacks / Dockerfile fallback**: It natively understands our multi-stage builds.
- **Global Edge Network**: Railway routes traffic through a global edge network, meaning your space weather dashboard will load blazingly fast globally with our Nginx Gzip configuration.
- **Private Networking**: You can optionally add a Redis or Postgres database later securely within the same private network.
- **Zero-Downtime Deployments**: Critical for mission-control systems; operators won't see disruptions during updates.
