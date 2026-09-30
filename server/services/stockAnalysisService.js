// Real-time AI fundamental analysis for a listed stock. Reuses the shared
// AI streaming/caching helper and yields markdown text tokens as they arrive.

import { streamCompletion } from './analysisService.js'
import { STOCK_SYSTEM_PROMPT, stockUserPrompt } from './prompts.js'

function buildMessages(query) {
  return [
    {
      role: 'system',
      content: STOCK_SYSTEM_PROMPT
    },
    {
      role: 'user',
      content: stockUserPrompt(query)
    }
  ]
}

// Async generator that yields markdown chunks for a stock's fundamental analysis.
export async function* streamStockAnalysis(query, model) {
  const normalized = String(query).trim()
  yield* streamCompletion(buildMessages(normalized), `stock:${normalized.toLowerCase()}`, model)
}
