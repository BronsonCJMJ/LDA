# LDA Website — Infrastructure & Data Safety Guide

## Architecture Overview

```
                        ┌─────────────────────────────────┐
                        │   GitHub (BronsonCJMJ/LDA)      │
                        │   Push to main / staging branch  │
                        └──────────────┬──────────────────┘
                                       │ Cloud Build trigger
                                       ▼
                        ┌──────────────────────────────────┐
                        │  Google Cloud Build               │
                        │  Docker multi-stage build         │
                        │  → Artifact Registry              │
                        └──────────────┬───────────────────┘
                                       │ gcloud run services update
                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Cloud Run (northamerica-northeast1)            │
│                   Node.js 20 Alpine container                    │
│                                                                  │
│  ┌─────────────────┐          ┌──────────────────┐              │
│  │  Static Frontend │          │  Express Backend  │              │
│  │  (React + Vite)  │          │  (Port 8080)      │              │
│  │  /app/public     │          │  /app/dist         │              │
│  └─────────────────┘          └────────┬───────────┘              │
│                                        │                          │
└────────────────────────────────────────┼──────────────────────────┘
                          ┌──────────────┼──────────────┐
                          ▼                             ▼
              ┌───────────────────────┐    ┌────────────────────────┐
              │  Neon PostgreSQL      │    │  Google Cloud Storage   │
              │  (Serverless)         │    │  (GCS Bucket)           │
              │                       │    │                         │
              │  11 tables:           │    │  Uploaded files:        │
              │  - admins             │    │  - gallery/ (photos)    │
              │  - news_articles      │    │  - documents/ (PDFs)    │
              │  - tournaments        │    │  - board-members/       │
              │  - tournament_results │    │  - news/ (article imgs) │
              │  - tournament_stats   │    │                         │
              │  - members            │    │  Access: Signed URLs    │
              │  - gallery_albums     │    │  (1-hour expiration)    │
              │  - gallery_photos     │    │                         │
              │  - documents          │    │                         │
              │  - form_submissions   │    │                         │
              │  - site_settings      │    │                         │
              └───────────────────────┘    └────────────────────────┘
```

## What Data Lives Where

### Neon PostgreSQL (critical — this is the association's content)

| Table | What it stores | Importance |
|-------|---------------|------------|
| `admins` | Admin login credentials | Can be recreated |
| `news_articles` | All published news, tags, content | **HIGH** — hand-written content |
| `tournaments` | Tournament schedules, venues, fees, seasons | **HIGH** — event history |
| `tournament_results` | Placement results by category | **HIGH** — competitive records |
| `tournament_stats` | Performance records (averages, checkouts) | **HIGH** — player achievements |
| `members` | Player registrations, contact info, MCP numbers | **HIGH** — membership data |
| `gallery_albums` | Photo album metadata | **HIGH** — event memories |
| `gallery_photos` | Photo references (URLs to GCS files) | **HIGH** — linked to GCS files |
| `documents` | Document metadata (titles, categories) | Medium — metadata only |
| `form_submissions` | Registration forms, contact submissions | **HIGH** — submitted data |
| `site_settings` | Homepage config, announcements, board members | Medium — can be reconfigured |

### Google Cloud Storage (uploaded files)

| Folder | Contents |
|--------|----------|
| `gallery/` | Event photos uploaded via admin gallery manager |
| `documents/` | PDFs — rules, bylaws, registration forms |
| `board-members/` | Executive board member headshots |
| `news/` | News article images |

**If GCS files are lost**: Photo URLs in the database become broken links. The actual image files cannot be recovered without backups.

---

## Environment Variables

These are set on the Cloud Run service and preserved across deployments.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `NODE_ENV` | Yes | `production` |
| `PORT` | No | Defaults to `8080` (set in Dockerfile) |
| `FRONTEND_URL` | Yes | `https://labradordarts.ca` (for CORS) |
| `GCS_BUCKET_NAME` | Yes | Google Cloud Storage bucket name |
| `GCS_PROJECT_ID` | Yes | GCP project ID (`labradordartsassociation`) |
| `GCS_KEY_FILE` | No | Path to service account key (not needed if using Workload Identity) |
| `JWT_ACCESS_SECRET` | Yes | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Yes | Secret for signing refresh tokens |
| `CONTACT_EMAIL` | No | Defaults to `labradordarts23@gmail.com` |
| `SMTP_USER` | No | Gmail address for sending notifications |
| `SMTP_PASS` | No | Gmail app password for SMTP |

---

## Deployment Pipeline

### How it works
1. Developer pushes to `main` branch on GitHub
2. Cloud Build trigger detects the push and clones the repo
3. Docker multi-stage build: frontend (Vite) → backend (TypeScript) → production image
4. Image pushed to Artifact Registry (`northamerica-northeast1-docker.pkg.dev`)
5. `gcloud run services update labradordarts` updates the Cloud Run service with the new image
6. **Environment variables are preserved** — they're set on the service, not the image

### Cloud Build Trigger Details
- **Name**: Auto-generated by Cloud Run continuous deployment
- **Branch**: `^main$`
- **Config**: Autodetected (uses Dockerfile)
- **Region**: `northamerica-northeast1`
- **Project**: `labradordartsassociation`

### Docker Build (multi-stage)
- **Stage 1** (frontend-build): `npm ci` + `npm run build` → React app in `/app/dist`
- **Stage 2** (backend-build): `npm ci` + `prisma generate` + `tsc` → compiled JS in `/app/dist`
- **Stage 3** (production): copies backend to `/app/dist`, frontend to `/app/public`, runs `node dist/index.js`

**Important**: `backend/.env` is excluded via `.dockerignore` — secrets never enter the image.

---

## Staging Environment

### Git Workflow
```
feature branch → staging branch → main branch
                     ↓                  ↓
            staging.labradordarts.ca   labradordarts.ca
```

- Push to `staging` branch → builds and deploys to staging
- Test on staging, verify everything works
- Merge `staging` → `main` → production deployment

### Staging Infrastructure
| Component | Production | Staging |
|-----------|-----------|---------|
| Cloud Run service | `labradordarts` | `labradordarts-staging` |
| Database | Neon production branch | Neon `staging` branch |
| File storage | Production GCS bucket | Staging GCS bucket |
| Domain | `labradordarts.ca` | `staging.labradordarts.ca` |
| Build trigger | Push to `main` | Push to `staging` |

### Setting Up Staging (GCP Console Steps)

1. **Neon**: Create a database branch called `staging` from the production branch
   - Dashboard → Branches → Create Branch → Name: "staging"
   - Copy the connection string for the staging branch

2. **Cloud Run**: Create service `labradordarts-staging`
   - Use the production image as initial container: `northamerica-northeast1-docker.pkg.dev/labradordartsassociation/cloud-run-source-deploy/lda/labradordarts:latest`
   - Region: `northamerica-northeast1`
   - Allow public access, request-based billing, 0 min instances

3. **Set environment variables on staging service**:
   - `DATABASE_URL` = Neon staging branch connection string
   - `NODE_ENV` = `production`
   - `FRONTEND_URL` = Cloud Run staging URL (or `https://staging.labradordarts.ca`)
   - `JWT_ACCESS_SECRET` = generate a new random string
   - `JWT_REFRESH_SECRET` = generate a new random string
   - `GCS_BUCKET_NAME` = staging bucket name (create one, or skip for local storage fallback)
   - `GCS_PROJECT_ID` = `labradordartsassociation`

4. **Cloud Build Trigger**: Create new trigger
   - Source: `BronsonCJMJ/LDA`
   - Branch: `^staging$`
   - Config: Cloud Build configuration file → `cloudbuild-staging.yaml`
   - Substitution variables: same as production trigger but with `_SERVICE_NAME` = `labradordarts-staging`

5. **DNS** (optional): Add CNAME record `staging.labradordarts.ca` → staging Cloud Run URL

---

## Data Backup Strategy (3-2-1 Method)

### Current Risk Assessment

**Neon restore window: 0.3 days (~7 hours)**

This means if data is accidentally deleted (a bug, a bad migration, human error), you have approximately 7 hours to notice and restore. After that window, the data is **permanently lost**.

The association has invested significant effort in:
- Writing news articles and tournament reports
- Recording tournament results and player statistics
- Uploading event photos to the gallery
- Managing member registrations

**Losing this data would be catastrophic and unrecoverable without backups.**

### Recommended 3-2-1 Setup

| Copy | Type | Where | How |
|------|------|-------|-----|
| 1 (Primary) | Live database | Neon production branch | Always current |
| 2 (Automated) | Point-in-time recovery | Neon PITR | Increase restore window to 7+ days |
| 3 (Export) | Database dump | GCS bucket or local | Weekly `pg_dump` export |

### Immediate Actions Required

#### 1. Increase Neon Restore Window (CRITICAL)
- Go to Neon Dashboard → Project Settings → Storage
- Increase restore window to **7 days** (requires Neon paid plan)
- This gives you 7 days to notice and recover from any data loss

#### 2. Enable GCS Object Versioning
- Go to GCP Console → Cloud Storage → Select your bucket
- Click "Protection" tab → Enable "Object versioning"
- This means overwritten or deleted files can be recovered
- Set a lifecycle rule to delete old versions after 90 days (to control costs)

#### 3. Set Up Weekly Database Exports (Recommended)
You can export the database weekly using `pg_dump`:
```bash
# Run locally or set up as a scheduled Cloud Run job
pg_dump "$DATABASE_URL" --format=custom --file=lda-backup-$(date +%Y%m%d).dump
```
Store exports in a separate GCS bucket or download locally.

### How to Restore from Neon PITR
1. Go to Neon Dashboard → Branches
2. Click "Restore" on the production branch
3. Select the point in time to restore to
4. Neon creates a new branch at that point — verify the data
5. Switch the production branch to the restored version

### Verification Checklist
- [ ] Neon restore window is at least 7 days
- [ ] GCS object versioning is enabled
- [ ] Weekly database exports are being stored
- [ ] Test a restore from Neon PITR at least once per quarter
- [ ] Verify GCS file recovery works (delete a test file, restore from version)

---

## Useful Commands

```bash
# Start local development
npm run dev                          # Frontend (Vite, port 5173)
cd backend && npm run dev            # Backend (Express, port 3001)

# Database
cd backend && npx prisma studio      # Visual database browser
cd backend && npx prisma migrate dev # Apply migrations locally
cd backend && npx prisma db push     # Push schema to database

# Build & test production image locally
docker build -t lda-local .
docker run -p 8080:8080 --env-file backend/.env lda-local
```
