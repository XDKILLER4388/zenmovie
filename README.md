# StreamVault 🎬

Free movie & series streaming platform with a futuristic black-and-white design.

## Stack

- **Frontend**: React 18, React Router, custom CSS (Orbitron/Rajdhani fonts)
- **Backend**: Node.js + Express
- **Database**: MySQL
- **APIs**: TMDb, OMDb
- **Automation**: node-cron for daily content sync

---

## Quick Start

### 1. Database

```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in your DB credentials and API keys in .env
npm install
npm run dev
```

Get your free TMDb API key at: https://www.themoviedb.org/settings/api

### 3. Frontend

```bash
cd frontend
# Create .env with:
# REACT_APP_API_URL=http://localhost:5000/api
npm install
npm start
```

---

## Environment Variables (backend/.env)

| Variable | Description |
|---|---|
| `DB_HOST` | MySQL host |
| `DB_USER` | MySQL user |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name (`streamvault`) |
| `JWT_SECRET` | Random secret string |
| `TMDB_API_KEY` | Your TMDb API key |
| `OMDB_API_KEY` | Your OMDb API key (optional) |
| `FRONTEND_URL` | Frontend URL for CORS |

---

## Adding Streams

Content metadata is auto-fetched from TMDb. To add actual video streams, use the Admin Panel:

1. Go to `/admin` (requires admin account)
2. Navigate to Movies
3. Use the API to add streams: `POST /api/admin/movies/:id/streams`

```json
{
  "server_name": "Server 1",
  "stream_url": "https://your-embed-url.com/embed/...",
  "quality": "1080p",
  "language": "en",
  "priority": 1
}
```

Stream URLs should be embeddable iframe sources (e.g., from vidsrc.to, embedsito, etc.).

---

## Creating Admin Account

After registering normally, update the user role in MySQL:

```sql
UPDATE users SET role='admin' WHERE email='your@email.com';
```

---

## Cron Jobs

Runs automatically in production (`NODE_ENV=production`):

- Every 6 hours: Sync trending content
- Daily at 3am: Sync popular content  
- Weekly Sunday: Sync genres

Run manually:
```bash
cd backend && node cron/contentUpdater.js
```

---

## Project Structure

```
streamvault/
├── backend/
│   ├── config/         # DB + cache config
│   ├── cron/           # Automated content sync
│   ├── middleware/      # Auth middleware
│   ├── routes/         # API routes
│   ├── services/       # TMDb + content services
│   └── server.js
├── frontend/
│   ├── public/
│   └── src/
│       ├── api/        # API client
│       ├── components/ # Navbar, Cards, Rows, Hero
│       ├── context/    # Auth context
│       ├── pages/      # All pages + admin
│       └── styles/     # Global CSS
└── database/
    └── schema.sql
```
