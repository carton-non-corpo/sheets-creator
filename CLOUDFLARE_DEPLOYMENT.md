# Cloudflare Pages Deployment Guide

This guide covers deploying your Nuxt 4 application to Cloudflare Pages.

## Prerequisites

1. A Cloudflare account
2. GitHub repository set up
3. Required secrets configured

## Setup Instructions

### 1. Cloudflare Pages Setup

1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Click "Create a project"
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command**: `pnpm build`
   - **Build output directory**: `.output/public`
   - **Root directory**: `/` (leave empty)

### 2. Environment Variables

Set these environment variables in your Cloudflare Pages dashboard:

- `GOOGLE_SERVICE_ACCOUNT`: Your Google service account JSON
- `NODE_VERSION`: `20`

### 3. GitHub Secrets

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with Pages permissions
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
- `CLOUDFLARE_PROJECT_NAME`: Your Cloudflare Pages project name
- `GOOGLE_SERVICE_ACCOUNT`: Your Google service account JSON

### 4. Getting Cloudflare Credentials

**API Token:**
1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Custom token" template
4. Permissions:
   - `Account:Cloudflare Pages:Edit`
   - `Zone:Zone:Read`
   - `Zone:Page Rules:Edit`

**Account ID:**
1. Go to your Cloudflare dashboard
2. Select your domain
3. Copy the Account ID from the right sidebar

### 5. Local Development with Wrangler

Install dependencies and login to Wrangler:

```bash
pnpm install
pnpm cf:login
```

Build and deploy manually:

```bash
pnpm build
pnpm deploy
```

## Automatic Deployments

The CI/CD pipeline will automatically:

- Deploy to production when pushing to `main` branch
- Create preview deployments for pull requests
- Cache dependencies for faster builds
- Set environment variables from GitHub secrets

## Troubleshooting

### Build Issues

1. **Node.js version**: Ensure you're using Node.js 20+
2. **Dependencies**: Run `pnpm install --frozen-lockfile`
3. **Environment variables**: Check they're properly set in Cloudflare Pages

### Deployment Issues

1. **API Token**: Verify your Cloudflare API token has correct permissions
2. **Project Name**: Ensure the project name matches your Cloudflare Pages project
3. **Build Output**: Check that `.output/public` directory is created after build

### Runtime Issues

1. **Server Functions**: If using server-side features, ensure they're compatible with Cloudflare Workers
2. **Environment Variables**: Check they're accessible in the runtime config
3. **Node.js Compatibility**: Some Node.js APIs might not be available in the Cloudflare Workers runtime

## Manual Deployment

You can also deploy manually using Wrangler:

```bash
# Login to Wrangler (one time setup)
pnpm cf:login

# Build your application
pnpm build

# Deploy to Cloudflare Pages
pnpm deploy
```

## Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Nuxt Cloudflare Deployment](https://nuxt.com/docs/getting-started/deployment#cloudflare-pages)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
