# competiLearn — AI-Powered Competitor Intelligence Feed

A web app where you register your company, and competiLearn discovers competitors
and builds a scrollable feed of cards. Each card pairs a **verified fact** about a
competitor (sourced from the [Cala](https://docs.cala.ai) knowledge graph) with an
**AI-generated insight** explaining what it means and what to consider doing about it.

This is not a live social-media scraper. "Refresh feed" re-queries Cala for the
latest known facts about each competitor and re-runs the AI analysis.

## Architecture

| Layer    | Tech                                  | Port (dev) |
| -------- | ------------------------------------- | ---------- |
| Backend  | Node.js + Express + better-sqlite3    | `3000`     |
| Frontend | Next.js (App Router) + TailwindCSS    | `3001`     |
| LLM      | OpenAI (optional — mock mode if unset)| —          |
| Data     | Cala API (`https://api.cala.ai`)      | —          |

The Next.js dev server proxies `/api/*` to the Express backend, so you open the
app at **http://localhost:3001** and the frontend talks to the backend transparently.

## Setup

```bash
# 1. Create your env file
cp .env.example .env.local
#    then fill in CALA_API_KEY (and optionally OPENAI_API_KEY)

# 2. Install dependencies (root + server + web)
npm run install:all

# 3. Run both servers
npm run dev
```

Open http://localhost:3001.

### Environment variables (`.env.local`)

```
CALA_API_KEY=        # required for competitor data
OPENAI_API_KEY=      # optional — leave blank to run in mock AI mode
PORT=3000            # Express backend port
```

### Mock-first AI

The app is fully functional without an OpenAI key. The single
`generateInsight()` function in `server/services/aiInsight.js` is the only place
that touches the OpenAI SDK:

- If `OPENAI_API_KEY` is set → calls OpenAI and parses the JSON insight.
- If not → returns a clearly-labeled **mock** insight built from the real Cala
  fact text (same JSON shape, so no other code branches on it).

Mock items are flagged with `is_mock` and show a badge in the UI. The server logs
the active mode on startup.

## Verifying the Cala integration

```bash
npm run test:cala            # smoke-tests Cala with "OpenAI"
npm run test:cala "Stripe"   # or any company name
```

## API

| Method | Path                                          | Description                                  |
| ------ | --------------------------------------------- | -------------------------------------------- |
| GET    | `/api/health`                                 | AI mode + Cala config status                 |
| GET    | `/api/companies/current`                      | The registered user company (or `null`)      |
| POST   | `/api/companies/register`                     | Register the user company                    |
| POST   | `/api/companies/:id/discover-competitors`     | Discover competitors via Cala                |
| GET    | `/api/companies/:id/competitors`              | List linked competitors                      |
| POST   | `/api/companies/:id/competitors`              | Manually add a competitor (fallback)         |
| POST   | `/api/companies/:id/refresh-feed`             | `:id` = competitor id → fetch + synthesize   |
| GET    | `/api/companies/:id/feed`                     | `:id` = user company id → all feed items     |
| POST   | `/api/feed/refresh-all`                        | Refresh every competitor for a user company  |
