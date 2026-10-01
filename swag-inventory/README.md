# SWAG Inventory

Asset inventory for SWAG group branches — React + Tailwind frontend, FastAPI + PostgreSQL backend, own user accounts with roles and branch access. Odoo 17/18 look, English/Arabic (RTL), light/dark.

```
swag-inventory/
├── backend/            FastAPI + SQLAlchemy (Postgres in prod, SQLite for local/tests)
├── frontend/           React 18 + Vite + Tailwind 3
├── docker-compose.yml  Postgres + backend
└── .env.example
```

## Who can do what

| Role   | Sees                     | Can do |
|--------|--------------------------|--------|
| Viewer | Only assigned branches   | View, export, print QR, request a transfer into their own branch |
| Editor | Only assigned branches   | + add / edit / delete assets and photos, approve or reject transfers *out of* their branches |
| Admin  | Everything               | + create users, set roles and branches, manage branches and dropdown options, Excel import |

Every rule is enforced by the API, not just hidden in the UI. Disabling a user cuts their session off immediately. The system always keeps at least one active admin.

## Run locally

```bash
# backend (SQLite, no Postgres needed)
cd backend
pip install -r requirements.txt
ADMIN_EMAIL=you@swag.sa ADMIN_PASSWORD=admin123 uvicorn app.main:app --reload   # :8000

# frontend (proxies /api and /uploads to :8000)
cd frontend
npm install
npm run dev                                                                       # :5173
```

Tests: `cd backend && pytest -q`

## Deploy (same pattern as the other SWAG apps)

**Backend on the shared VM**

```bash
# on your PC — wipe the old copy BEFORE uploading (never after)
ssh vm "rm -rf ~/swag-inventory"
scp -r .\swag-inventory vm:~/swag-inventory

# on the VM
cd ~/swag-inventory
cp .env.example .env && nano .env        # DB_PASSWORD, SECRET_KEY, ADMIN_*, CORS_ORIGINS
docker compose up -d --build
curl localhost:8120/api/health           # {"ok":true}
```

Then point a Cloudflare Tunnel hostname (e.g. `inventory-api.swag.sa`) at `http://localhost:8120`.
Database and uploaded photos live in Docker volumes (`pgdata`, `uploads`), so they survive rebuilds.

**Frontend on Vercel**

- Root directory: `frontend`, build `npm run build`, output `dist`
- Environment variable: `VITE_API_URL=https://inventory-api.swag.sa`
- Add the Vercel domain to `CORS_ORIGINS` in the backend `.env`, then `docker compose up -d`

> The QR scanner needs HTTPS (Vercel and Cloudflare already give you that).

## First login

1. Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`, then change the password (avatar menu → Change password).
2. **Settings** — check branches and dropdown options. Four Outfit branches and the old category/status/colour lists are pre-filled.
3. **Users → New User** — set name, email and password, pick a role and tick the branches.

## Moving data from the old SharePoint dashboard

1. Open the old dashboard → **Export** (Excel).
2. In the new app: **Assets → Import** (admin) → choose that file.

Missing branches are created automatically. Columns are matched by the old export headers (Name, Branch, Category, Model, Serial Number, Qty, Status, Color, Amount SAR, Invoice, Purchase Date, Notes) or their Arabic names.
Photos are not in the export, so add them again from the asset form.

## Features

- Overview: KPIs, top branches, recent assets
- Branches: cards and a per-branch page with category groups
- Assets:
  - list and kanban views, search, filters, sorting, Odoo-style pager
  - multi-select, then print QR label sheets (A4) or export the selection
  - Excel export and import
- Asset dialog:
  - photo with lightbox
  - activity log (who changed what)
  - edit, QR, print, request transfer
- Photos are resized in the browser before upload (~300 KB instead of 5 MB). The camera button opens the phone camera.
- QR codes encode `https://<app>/a/<id>`:
  - a phone camera opens the asset directly
  - the in-app scanner also reads old labels that contain just the ID
- Requests: a transfer is approved by an editor/admin of the source branch, and the asset moves branch automatically
- Needs Attention: missing photo, price or status, and the same item in 2+ branches
- Analytics: units by branch, category, status and brand, and value by branch
- Alerts bell, auto-refresh every 3 minutes, EN/AR with full RTL, light/dark theme, animated login
