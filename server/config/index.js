// Application configuration and constants.

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const PORT = process.env.PORT || 8787

// JSON file where every IPO ever seen is persisted for future reference.
export const DATA_FILE = join(__dirname, '..', 'data', 'ipos.json')

// InvestorGain report API.
// Path: /cloud/v2/report/data-read/{reportId}/{page}/{month}/{year}/{financialYear}/{sort}/{param}
export const API_HOST = 'https://webnodejs.investorgain.com'
export const REPORT_ID = 331

export const SITE_HOST = 'https://www.investorgain.com'
export const REPORT_REFERER = 'https://www.investorgain.com/report/ipo-gmp-live/331/'

// AI provider (OpenAI-compatible) used for real-time IPO analysis. Configure via
// .env. If no API key is set, the client falls back to a local heuristic.
export const AI = {
  apiKey: process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '',
  baseUrl: (
    process.env.AI_BASE_URL ||
    'https://generativelanguage.googleapis.com/v1beta/openai'
  ).replace(/\/+$/, ''),
  // Models tried in order; if one is overloaded (503) or rate-limited (429) we
  // fall back to the next. Configure a comma-separated list via AI_MODELS.
  models: (process.env.AI_MODELS || process.env.AI_MODEL ||
    'gemini-3.6-flash,gemini-3.6-flash-lite,gemini-3.5-flash,gemini-2.5-flash')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean)
}

// Maps InvestorGain status codes to human-readable labels.
export const STATUS_MAP = {
  U: 'Upcoming',
  O: 'Open',
  CT: 'Closing Today',
  C: 'Closed',
  L: 'Listed'
}
