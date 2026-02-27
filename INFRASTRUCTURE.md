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
              │  (Serverless, Launch) │    │  (GCS Buckets)          │
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

| Bucket | Environment | Object Versioning |
|--------|-------------|-------------------|
| `lda-production-uploads` | Production | Enabled |
| `lda-staging-uploads` | Staging | Enabled |

| Folder | Contents |
|--------|----------|
| `gallery/` | Event photos uploaded via admin gallery manager |
| `documents/` | PDFs — rules, bylaws, registration forms |
| `board-members/` | Executive board member headshots |
| `news/` | News article images |

**If GCS files are lost**: Photo URLs in the database become broken links. However, object versioning is enabled on both buckets, so overwritten or deleted files can be recovered from previous versions.

### Neon Project Details

| Detail | Value |
|--------|-------|
| Project name | `lda-website` |
| Project ID | `shy-frost-41609910` |
| PostgreSQL version | 17 |
| Plan | Launch (paid) |
| Restore window | **7 days** |
| Production branch | `main` |
| Staging branch | `staging` |
| Connection host format | `ep-twilight-water-a168aof6-pooler.ca-east-2.aws.neon.tech` |

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
| Database | Neon `main` branch | Neon `staging` branch |
| File storage | `lda-production-uploads` | `lda-staging-uploads` |
| Domain | `labradordarts.ca` | Cloud Run URL (bookmarked) |
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

### Why This Matters

The association has invested significant effort in news articles, tournament results, player statistics, event photos, and member registrations. Losing this data would be catastrophic and unrecoverable without backups.

### Current 3-2-1 Setup (Completed Feb 2026)

| Copy | Type | Where | Status |
|------|------|-------|--------|
| 1 (Primary) | Live database | Neon production branch | Always current |
| 2 (Automated) | Point-in-time recovery | Neon PITR — **7-day window** | Active (Launch plan) |
| 3 (Export) | Database dump + GCS files | `D:\LDA-Storage-Backup` (local drive) | Run weekly before major changes |

### What's Protected

| Data | Protection |
|------|-----------|
| Database (all 11 tables) | Neon 7-day PITR + weekly pg_dump to D: drive |
| GCS uploaded files | Object versioning on bucket + weekly gsutil rsync to D: drive |
| Code | GitHub repository (BronsonCJMJ/LDA) |

---

### Running a Backup

The backup script lives at `D:\LDA-Storage-Backup\backup-lda.sh` and does three things:
1. Dumps the Neon PostgreSQL database using `pg_dump` (PostgreSQL 17)
2. Syncs all GCS production files using `gsutil rsync`
3. Auto-cleans backups older than 28 days

**Run it before any major changes (migrations, bulk edits, deployments):**

```bash
# Set the Neon production connection string (get from Neon Dashboard → Connection Details)
export LDA_DATABASE_URL='postgresql://neondb_owner:<password>@ep-twilight-water-a168aof6-pooler.ca-east-2.aws.neon.tech/neondb?sslmode=require'

# Run the backup
bash /mnt/d/LDA-Storage-Backup/backup-lda.sh
```

**Requirements:**
- `postgresql-client-17` must be installed (Neon runs PostgreSQL 17)
- `gsutil` must be installed and authenticated (`gcloud auth login`)
- The `LDA_DATABASE_URL` env var must be set with the production connection string

**Output:**
- Database dump: `D:\LDA-Storage-Backup\db-backup-YYYYMMDD-HHMMSS.dump`
- GCS files: `D:\LDA-Storage-Backup\gcs-backup-YYYYMMDD-HHMMSS/`

**Recommended frequency:** Weekly, or before any database migration or major code deployment.

### Installing pg_dump (PostgreSQL 17)

If `pg_dump` is not installed or is the wrong version:

```bash
# Add PostgreSQL 17 apt repository
sudo apt install -y postgresql-common
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
sudo apt update
sudo apt install -y postgresql-client-17
```

The backup script uses `/usr/lib/postgresql/17/bin/pg_dump` directly to ensure version compatibility with Neon.

---

### How to Restore

#### Restore from Neon PITR (database — last 7 days)
1. Go to Neon Dashboard → Branches
2. Click "Restore" on the production branch
3. Select the point in time to restore to
4. Neon creates a new branch at that point — verify the data
5. Switch the production branch to the restored version

#### Restore from pg_dump backup (database — older than 7 days)
```bash
# Restore a specific dump file to the Neon database
pg_restore --dbname="$LDA_DATABASE_URL" --clean --if-exists /mnt/d/LDA-Storage-Backup/db-backup-XXXXXXXX-XXXXXX.dump
```

#### Restore GCS files (from local backup)
```bash
# Sync files back to the production GCS bucket
gsutil -m rsync -r /mnt/d/LDA-Storage-Backup/gcs-backup-XXXXXXXX-XXXXXX/ gs://lda-production-uploads/
```

#### Restore GCS files (from object versioning)
```bash
# List previous versions of a deleted/overwritten file
gsutil ls -la gs://lda-production-uploads/gallery/some-photo.jpg

# Restore a specific version by copying it back
gsutil cp gs://lda-production-uploads/gallery/some-photo.jpg#<generation> gs://lda-production-uploads/gallery/some-photo.jpg
```

---

### Verification Checklist
- [x] Neon restore window is 7 days (Launch plan, configured Feb 2026)
- [x] GCS object versioning is enabled on `lda-production-uploads`
- [x] GCS object versioning is enabled on `lda-staging-uploads`
- [x] Backup script created and tested (`D:\LDA-Storage-Backup\backup-lda.sh`)
- [x] First successful backup completed (Feb 27, 2026 — 27KB database dump)
- [ ] Test a restore from Neon PITR at least once per quarter
- [ ] Verify GCS file recovery works (delete a test file, restore from version)
- [ ] Set up a lifecycle rule on GCS to delete old versions after 90 days

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

# Backup (run from WSL)
export LDA_DATABASE_URL='postgresql://neondb_owner:<password>@ep-twilight-water-a168aof6-pooler.ca-east-2.aws.neon.tech/neondb?sslmode=require'
bash /mnt/d/LDA-Storage-Backup/backup-lda.sh

# List existing backups
ls -lh /mnt/d/LDA-Storage-Backup/db-backup-*.dump
ls -d /mnt/d/LDA-Storage-Backup/gcs-backup-*
```
