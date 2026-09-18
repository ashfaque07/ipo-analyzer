// Real-time AI IPO analysis via an OpenAI-compatible streaming endpoint
// (Gemini by default). Yields text tokens as they arrive from the provider.

import { AI } from '../config/index.js'

export function isAiConfigured() {
  return Boolean(AI.apiKey)
}

// In-memory cache of generated summaries, keyed by the IPO's analysis-relevant
// fields. Avoids re-calling the AI (cost + latency) for unchanged IPO data.
const CACHE_TTL_MS = Number(process.env.AI_CACHE_TTL_MS) || 30 * 60 * 1000
const cache = new Map()

function ipoFacts(ipo) {
  return {
    company: ipo.company,
    type: ipo.type,
    status: ipo.status,
    gmp: ipo.gmp,
    gmpPercent: ipo.gmpPercent,
    rating: ipo.rating,
    ratingValue: ipo.ratingValue,
    priceBand: ipo.priceBand,
    lotSize: ipo.lotSize,
    issueSize: ipo.issueSize,
    pe: ipo.pe,
    subscription: ipo.subscription,
    anchor: ipo.anchor,
    openDate: ipo.openDate,
    closeDate: ipo.closeDate,
    listingDate: ipo.listingDate
  }
}

function cacheKey(ipo) {
  return JSON.stringify(ipoFacts(ipo))
}

function getCached(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    cache.delete(key)
    return null
  }
  return entry.text
}

function setCached(key, text) {
  if (text) cache.set(key, { text, expires: Date.now() + CACHE_TTL_MS })
}

function buildMessages(ipo) {
  const facts = ipoFacts(ipo)

  return [
    {
      role: 'system',
      content:
        'You are a sharp equity research analyst specialising in Indian IPOs. ' +
        'Given structured IPO data (grey market premium, platform rating, subscription, ' +
        'P/E, anchor participation, issue size, dates and status), respond ONLY in the ' +
        'exact markdown template below. Fill every bracketed placeholder using the data; ' +
        'if a value is unavailable, write "N/A". Do not add extra sections, preamble, or ' +
        'text outside the template. Keep the summary to two sentences.\n\n' +
        '## AI IPO Summary\n\n' +
        '**[Company Name] IPO:** AI analysis indicates **[Positive/Neutral/Cautious]** ' +
        'sentiment based on live subscription demand, GMP movement, financial performance, ' +
        'valuation, and key risks. Current confidence is **[High/Medium/Low]**. For ' +
        'informational purposes, not investment advice.\n\n' +
        '| Metric | Current Data | AI Signal |\n' +
        '| --- | --- | --- |\n' +
        '| Price Band | ₹[X–Y] | Fair / Expensive |\n' +
        '| Subscription | [X]x | Strong / Moderate / Weak |\n' +
        '| GMP | ₹[X] or [X]% | Positive / Flat / Negative |\n' +
        '| Fundamentals | [Score]/10 | Strong / Average / Weak |\n' +
        '| Valuation | P/E [X]x | Attractive / Fair / High |\n' +
        '| Key Risk | [Short risk] | Low / Medium / High |\n' +
        '| AI Outlook | Apply / Watch / Avoid | Confidence: [X]% |\n\n' +
        '**AI rationale:** Strongest factor is **[factor]**, while the main concern is ' +
        '**[risk]**. GMP should be treated as an unofficial sentiment indicator rather ' +
        'than a guaranteed listing outcome.\n\n' +
        '*Disclaimer: Automated analysis, not investment advice.*'
    },
    {
      role: 'user',
      content: `Analyze this IPO:\n${JSON.stringify(facts, null, 2)}`
    }
  ]
}

// Async generator that yields text chunks streamed from the AI provider.
// Returns a cached summary instantly on a hit; otherwise streams from the AI,
// retries transient errors (503/429) with backoff and falls back across models,
// then caches the full result.
export async function* streamAnalysis(ipo) {
  const key = cacheKey(ipo)
  const cached = getCached(key)
  if (cached) {
    yield cached
    return
  }

  const messages = buildMessages(ipo)
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  let lastError = null

  for (const model of AI.models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      let upstream
      try {
        upstream = await fetch(`${AI.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${AI.apiKey}`
          },
          body: JSON.stringify({ model, messages, temperature: 0.4, stream: true })
        })
      } catch (err) {
        lastError = new Error(`Network error contacting AI provider: ${err.message}`)
        await sleep(500 * (attempt + 1))
        continue
      }

      if (upstream.ok && upstream.body) {
        let full = ''
        for await (const token of readStream(upstream.body)) {
          full += token
          yield token
        }
        setCached(key, full)
        return
      }

      const detail = await upstream.text().catch(() => '')
      lastError = new Error(`AI request failed (${upstream.status}) on ${model}: ${detail}`)

      // Transient — retry same model with backoff, then move to next model.
      if (upstream.status === 503 || upstream.status === 429) {
        await sleep(600 * (attempt + 1))
        continue
      }

      // Non-transient (e.g. 400/404) — skip to the next model immediately.
      break
    }
  }

  throw lastError ?? new Error('AI request failed: no models available.')
}

// Parses an OpenAI-style SSE stream body and yields text tokens.
async function* readStream(body) {
  const decoder = new TextDecoder()
  let buffer = ''

  for await (const value of body) {
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue

      const payload = trimmed.slice(5).trim()
      if (payload === '[DONE]') return

      try {
        const chunk = JSON.parse(payload)
        const token = chunk.choices?.[0]?.delta?.content
        if (token) yield token
      } catch {
        // Ignore partial or malformed chunks.
      }
    }
  }
}
