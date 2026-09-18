# IPO Analyzer

A React (Vite) app that lists IPOs from the
[InvestorGain Live IPO GMP](https://www.investorgain.com/report/ipo-gmp-live/331/)
report and gives an **AI Analysis** for each IPO.

Each IPO card shows: company, type (Mainboard/SME), status, GMP & GMP %, fire
rating, subscription, price, issue size, lot size, P/E, anchor investors, and
the open / close / allotment / listing dates.

## How it works

- `server/` — a tiny Node proxy that calls the InvestorGain report API
  server-side (browsers block direct requests due to CORS) and returns
  normalized JSON at `/api/ipos`.
- `src/` — React UI that lists IPOs as cards with search + filters, plus the
  AI analysis. The analysis works offline with a local heuristic that scores
  GMP, rating, subscription, P/E, anchor investors, type and status.
  Optionally uses OpenAI if you provide a key.

## Project structure

```
server/                     # Backend (layered: config → utils → models → services → controllers → routes)
  index.js                  # HTTP server bootstrap
  config/index.js           # Constants (port, API host, status map)
  utils/html.js             # HTML/entity decoding
  utils/parsers.js          # GMP, rating, date/URL parsers
  models/ipo.js             # Normalizes a raw report row into a clean IPO
  services/ipoService.js    # Fetches + normalizes IPO data
  controllers/ipoController.js  # Maps service data to an HTTP response
  routes/router.js          # Request routing

src/                        # Frontend
  main.jsx                  # React entry point
  App.jsx                   # Root component (composition only)
  components/               # Header, Toolbar, IpoGrid, IpoCard, AnalysisModal
  hooks/                    # useIpos (data + filtering), useAnalysis
  services/                 # ipoApi (fetch), analysisService (AI/heuristic)
  constants/filters.js      # Filter options
  styles/styles.css         # App styles
```

## Run it

```powershell
npm install

# Terminal 1 - start the IPO proxy (needs Node 18+)
npm run server

# Terminal 2 - start the React app
npm run dev
```

Open http://localhost:5173

## Optional: richer AI via OpenAI

Create a `.env` file:

```
VITE_OPENAI_API_KEY=sk-...
```

Then the **AI Analysis** button calls OpenAI instead of the local heuristic.

> Analysis is automated and not investment advice.
