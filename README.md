# IPO Analyzer

A React (Vite) single-page app that lists Indian IPOs from the
[InvestorGain Live IPO GMP](https://www.investorgain.com/report/ipo-gmp-live/331/)
report and provides an **AI Analysis** for each IPO, plus **Trending Stocks**
(NSE top gainers/losers) and an **AI Stock Analysis** tool.

A small Node proxy (local) / Netlify Function (production) fetches and
normalizes third-party data server-side, since browsers cannot call the
upstream APIs directly due to CORS.

## Purpose

Give retail investors a single, fast view of live IPO data (GMP, ratings,
subscription, valuation, dates) with an optional automated AI summary. All
analysis is automated and **not investment advice**.

## Main capabilities

- List IPOs as cards with search + filters (All / IPO / SME / status).
- Persist every IPO ever seen so closed/listed IPOs remain browsable.
- AI IPO analysis via an OpenAI-compatible streaming endpoint (Gemini by default).
- Trending stocks (NSE top gainers/losers) with a daily snapshot and history.
- AI fundamental analysis for any listed stock by name or ticker.
- Light/dark theme, view persisted to `localStorage`.

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, react-markdown, remark-gfm |
| Backend | Node.js (`node:http`), ESM modules |
| Serverless | Netlify Functions (`@netlify/functions`), Netlify Blobs |
| Config | `dotenv` |
| Tooling | `concurrently`, Vite dev server |

See [ARCHITECTURE.md](ARCHITECTURE.md) and [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for detail.

## Prerequisites

- Node.js 18+ (required for global `fetch`).
- npm.

## Installation

```powershell
npm install
```

## Configuration

Configuration lives in `server/config/index.js` (non-secret constants) and
environment variables loaded via `dotenv`. Create a `.env` file in the
repository root for local overrides. `.env` is git-ignored.

### Environment variables

All values below are placeholders — do not commit real secrets.

| Variable | Purpose | Example |
|---|---|---|
| `PORT` | Local proxy port | `8787` |
| `AI_API_KEY` | AI provider API key (also accepts `GEMINI_API_KEY`) | `your-api-key` |
| `AI_BASE_URL` | OpenAI-compatible base URL | `https://generativelanguage.googleapis.com/v1beta/openai` |
| `AI_MODELS` | Comma-separated model fallback list (also `AI_MODEL`) | `gemini-2.5-flash` |
| `AI_CACHE_TTL_MS` | AI response cache TTL in ms | `1800000` |
| `VITE_OPENAI_API_KEY` | Referenced by the client for optional OpenAI use | `your-api-key` |

> If no AI key is configured, AI IPO/stock analysis endpoints return `503`.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server (port 5173) |
| `npm run server` | Start the Node proxy (port 8787) |
| `npm start` | Run proxy + dev server together (`concurrently`) |
| `npm run build` | Build the production frontend to `dist/` |
| `npm run preview` | Preview the production build |

Test / lint / format commands: **To be confirmed** (no test, lint, or
formatter configuration is present in the repository).

## Usage

```powershell
npm install

# Terminal 1 — start the IPO proxy (needs Node 18+)
npm run server

# Terminal 2 — start the React app
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to
`http://localhost:8787` (see `vite.config.js`).

To enable AI analysis, add an AI key to `.env`:

```
AI_API_KEY=your-api-key
```

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| "Could not reach the IPO proxy server." | Proxy not running — run `npm run server`. |
| AI analysis returns 503 | `AI_API_KEY` not set. |
| Empty IPO list / `source: "cache"` or `"error"` | Upstream InvestorGain fetch failed; app falls back to stored data. |
| Trending stocks fail | NSE may challenge the request; the service retries with a cookie handshake. |

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — components, data flow, integrations.
- [CODING_GUIDELINES.md](CODING_GUIDELINES.md) — conventions observed in the code.
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) — directory map and change scenarios.

## Security

- Never commit `.env` or API keys; `.env` is git-ignored.
- The proxy sets permissive CORS (`Access-Control-Allow-Origin: *`) — review
  before exposing publicly.
- No authentication layer is present. **To be confirmed** whether one is intended.

## Contributing

Contribution guidelines are **To be confirmed** (no `CONTRIBUTING.md` present).
Follow the conventions in [CODING_GUIDELINES.md](CODING_GUIDELINES.md).

> Analysis is automated and not investment advice.
