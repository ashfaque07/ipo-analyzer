// AI "best pick" analysis over the live trending stocks list. Reuses the shared
// AI streaming/caching helper and yields markdown text tokens as they arrive.

import { streamCompletion, isAiConfigured } from './analysisService.js'
import {
  TRENDING_BEST_PICK_SYSTEM_PROMPT,
  trendingBestPickUserPrompt,
  trendingBestSymbolsSystemPrompt,
  trendingBestSymbolsUserPrompt
} from './prompts.js'

// Keep only the fields useful for analysis so the prompt stays compact and the
// cache key is stable across noisy fields.
function stockFacts(s) {
  return {
    symbol: s.symbol,
    ltp: s.ltp ?? null,
    open: s.open ?? null,
    high: s.high ?? null,
    low: s.low ?? null,
    prevClose: s.prevClose ?? null,
    change: s.change ?? null,
    percentChange: s.percentChange ?? null,
    volume: s.volume ?? null,
    turnover: s.turnover ?? null,
    reason: s.reason || ''
  }
}

function buildMessages(type, stocks) {
  const facts = stocks.map(stockFacts)
  const listLabel = type === 'losers' ? 'top losers' : 'top gainers'

  return [
    {
      role: 'system',
      content: TRENDING_BEST_PICK_SYSTEM_PROMPT
    },
    {
      role: 'user',
      content: trendingBestPickUserPrompt(listLabel, facts)
    }
  ]
}

// Build a stable cache key from the symbols and their % change so identical
// snapshots reuse the cached analysis.
function cacheKey(type, stocks) {
  const sig = stocks
    .map((s) => `${s.symbol}:${s.percentChange ?? ''}`)
    .join('|')
  return `trending-best:${type}:${sig}`
}

// Keep only currently-available (non-stale) stocks. Stale stocks are ones that
// were seen earlier today but dropped out of the latest live refresh; their
// data is outdated so they must not be considered for the AI best pick.
function availableStocks(stocks) {
  return (Array.isArray(stocks) ? stocks : []).filter((s) => !s?.stale)
}

// Async generator that yields markdown chunks for the best-pick analysis.
export async function* streamTrendingAnalysis(type, stocks, model) {
  const fresh = availableStocks(stocks)
  yield* streamCompletion(buildMessages(type, fresh), cacheKey(type, fresh), model, { noCache: true })
}

// Ask the AI to pick the best `limit` stocks from the trending list and return
// their symbols. Used at refresh time to flag `aiRecommended` stocks. Returns
// an array of uppercase symbols (a subset of the provided list); on any failure
// it returns an empty array so the refresh never breaks.
export async function recommendBestSymbols(type, stocks, limit = 3) {
  const live = availableStocks(stocks)
  if (!isAiConfigured() || !live.length) return []

  const valid = new Set(live.map((s) => String(s.symbol).toUpperCase()))
  const facts = live.map(stockFacts)
  const listLabel = type === 'losers' ? 'top losers' : 'top gainers'

  const messages = [
    {
      role: 'system',
      content: trendingBestSymbolsSystemPrompt(limit)
    },
    {
      role: 'user',
      content: trendingBestSymbolsUserPrompt(listLabel, facts)
    }
  ]

  try {
    let text = ''
    for await (const token of streamCompletion(messages, `${cacheKey(type, live)}:best-symbols:${limit}`, undefined, { noCache: true })) {
      text += token
    }
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return []
    const parsed = JSON.parse(match[0])
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((s) => String(s).toUpperCase().trim())
      .filter((s) => valid.has(s))
      .slice(0, limit)
  } catch (err) {
    console.error('[trending] AI recommendation failed:', err.message)
    return []
  }
}
