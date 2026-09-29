// Application configuration and constants.

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// When bundled to CommonJS (e.g. Netlify Functions via esbuild) `import.meta.url`
// is undefined, so guard against it. `__dirname` is only needed for the local
// data-file path, which isn't used on serverless (we write to /tmp there).
const __dirname = import.meta.url ? dirname(fileURLToPath(import.meta.url)) : process.cwd()

export const PORT = process.env.PORT || 8787

// JSON file where every IPO ever seen is persisted for future reference.
// On serverless platforms (Netlify / AWS Lambda) the app filesystem is
// read-only except for /tmp, so persist there. We detect the serverless
// runtime via common env vars set by those platforms.
export const IS_SERVERLESS = Boolean(
  process.env.NETLIFY ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.AWS_EXECUTION_ENV
)

export const DATA_FILE = IS_SERVERLESS
  ? '/tmp/ipos.json'
  : join(__dirname, '..', 'data', 'ipos.json')

// JSON file where the daily trending-stocks snapshot is persisted (per type).
export const TRENDING_FILE = IS_SERVERLESS
  ? '/tmp/trending.json'
  : join(__dirname, '..', 'data', 'trending.json')

// Indian market (NSE) hours in IST used to gate the scheduled refresh.
export const IST_OFFSET_MIN = 5 * 60 + 30 // UTC+5:30
export const MARKET_OPEN_MIN = 9 * 60 // 09:00 IST — day start
export const MARKET_CLOSE_MIN = 15 * 60 + 30 // 15:30 IST

// NSE trading holidays (market fully closed) as IST YYYY-MM-DD strings.
// This is a STATIC FALLBACK only — at runtime the holiday list is fetched
// dynamically from the NSE holiday-master API (see holidayService.js) and
// cached. These dates are merged in so we never regress if the API is down.
// Weekends are handled separately.
export const NSE_HOLIDAYS = new Set([
  // 2026
  '2026-01-26', // Republic Day
  '2026-03-04', // Holi
  '2026-03-21', // Id-Ul-Fitr (Ramzan Id)
  '2026-03-31', // Ram Navami
  '2026-04-01', // Mahavir Jayanti
  '2026-04-03', // Good Friday
  '2026-04-14', // Dr. Baba Saheb Ambedkar Jayanti
  '2026-05-01', // Maharashtra Day
  '2026-05-28', // Bakri Id
  '2026-08-15', // Independence Day
  '2026-08-25', // Ganesh Chaturthi
  '2026-10-02', // Mahatma Gandhi Jayanti / Dussehra
  '2026-10-20', // Diwali (tentative)
  '2026-11-10', // Guru Nanak Jayanti
  '2026-12-25' // Christmas
])

// InvestorGain report API.
// Path: /cloud/v2/report/data-read/{reportId}/{page}/{month}/{year}/{financialYear}/{sort}/{param}
export const API_HOST = 'https://webnodejs.investorgain.com'
export const REPORT_ID = 331

export const SITE_HOST = 'https://www.investorgain.com'
export const REPORT_REFERER = 'https://www.investorgain.com/report/ipo-gmp-live/331/'

// AI providers (OpenAI-compatible endpoints) used for real-time analysis.
// Each provider is enabled only when its API key env var is set; its selectable
// models come from the matching comma-separated *_MODELS env var. This lets the
// user switch between providers/models from the UI dropdown, so hitting one
// provider's daily limit (e.g. Gemini) can be worked around by picking another.
const splitModels = (value) =>
  String(value || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean)

const PROVIDER_DEFS = [
  {
    name: 'gemini',
    apiKey: process.env.GEMINI_API_KEY || '',
    baseUrl: process.env.GEMINI_BASE_URL ||
      'https://generativelanguage.googleapis.com/v1beta/openai',
    models: splitModels(process.env.GEMINI_MODELS)
  },
  {
    name: 'groq',
    apiKey: process.env.GROQ_API_KEY || '',
    baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    models: splitModels(process.env.GROQ_MODELS)
  },
  {
    name: 'openai',
    apiKey: process.env.OPENAI_API_KEY || '',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    models: splitModels(process.env.OPENAI_MODELS)
  },
  // Generic OpenAI-compatible provider configured via the legacy AI_* vars.
  {
    name: 'custom',
    apiKey: process.env.AI_API_KEY || '',
    baseUrl: process.env.AI_BASE_URL ||
      'https://generativelanguage.googleapis.com/v1beta/openai',
    models: splitModels(process.env.AI_MODELS || process.env.AI_MODEL)
  }
]

// Only providers with an API key AND at least one model are active.
export const AI_PROVIDERS = PROVIDER_DEFS.filter(
  (p) => p.apiKey && p.models.length
).map((p) => ({ ...p, baseUrl: p.baseUrl.replace(/\/+$/, '') }))

// Flat, ordered list of every selectable model with its provider config.
export const AI_MODELS = AI_PROVIDERS.flatMap((p) =>
  p.models.map((model) => ({
    model,
    provider: p.name,
    apiKey: p.apiKey,
    baseUrl: p.baseUrl
  }))
)

// Plain model-name list (for the UI dropdown) and the default selection.
export const AI_MODEL_NAMES = AI_MODELS.map((m) => m.model)
export const DEFAULT_MODEL = AI_MODEL_NAMES[0] || ''

// Resolve the provider config for a given model name (null if unknown).
export function getModelConfig(model) {
  return AI_MODELS.find((m) => m.model === model) || null
}

// Ordered list of model configs to try for a request: the selected model first,
// then every other configured model as fallback (for rate-limit / overload).
export function getModelFallbacks(selected) {
  const chosen = getModelConfig(selected)
  const rest = AI_MODELS.filter((m) => m.model !== chosen?.model)
  return chosen ? [chosen, ...rest] : AI_MODELS
}

// Maps InvestorGain status codes to human-readable labels.
export const STATUS_MAP = {
  U: 'Upcoming',
  O: 'Open',
  CT: 'Closing Today',
  C: 'Closed',
  L: 'Listed'
}
