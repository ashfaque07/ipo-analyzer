// AI "best pick" analysis over the live trending stocks list. Reuses the shared
// AI streaming/caching helper and yields markdown text tokens as they arrive.

import { streamCompletion, isAiConfigured } from './analysisService.js'

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
      content:
        'Act as a professional stock market analyst and portfolio manager. You are ' +
        'given a list of trending NSE stocks with their live intraday data. Identify the ' +
        'SINGLE BEST stock opportunity from the list and rank all stocks.\n\n' +
        'Evaluate each stock using this weighting: Fundamentals 30% (revenue growth, ' +
        'profit growth, EPS growth, ROE, ROCE, debt-to-equity, cash flow, promoter ' +
        'holding), Technicals 30% (breakout pattern, price vs 20/50/200 EMA, RSI, MACD, ' +
        'support & resistance, volume breakout, relative strength), Momentum 20% ' +
        '(trending activity, delivery %, sector strength, relative volume, institutional ' +
        'buying), News & Sentiment 10% (positive news, corporate announcements, earnings ' +
        'surprises, market sentiment), Risk 10% (volatility, operator activity, recent ' +
        'sharp swings).\n\n' +
        'Ranking rules: prefer stocks with strong fundamentals AND strong momentum; avoid ' +
        'operator-driven pump-and-dump stocks; give extra weight to stocks likely to hit ' +
        'the upper circuit due to genuine buying pressure. Use your knowledge of each ' +
        'company plus the supplied live data. If a value is genuinely unknown, write ' +
        '"N/A".\n\n' +
        'Respond ONLY in the exact markdown template below. Do not add preamble or text ' +
        'outside the template.\n\n' +
        '## 🏆 AI Best Trending Pick\n\n' +
        '**[Stock Name] ([Symbol])** is the top opportunity with an overall score of ' +
        '**[X]/100** and **[High/Medium/Low]** confidence.\n\n' +
        '| Field | Value |\n' +
        '| --- | --- |\n' +
        '| Overall Score | [X]/100 |\n' +
        '| Confidence | [X]% |\n' +
        '| Upper Circuit Probability | [X]% |\n' +
        '| Entry Price | ₹[X] |\n' +
        '| Ideal Buy Zone | ₹[X–Y] |\n' +
        '| Stop Loss | ₹[X] ([X]%) — [nearest support / swing low / ATR based] |\n' +
        '| Risk : Reward | [X] : [Y] |\n' +
        '| Investment Type | Intraday / Swing / Positional / Long Term |\n\n' +
        '**Targets**\n\n' +
        '| Target | Probability |\n' +
        '| --- | --- |\n' +
        '| ₹[X] (+5%) | [X]% |\n' +
        '| ₹[Y] (+10%) | [X]% |\n' +
        '| ₹[Z] (+20%) | [X]% |\n\n' +
        '**Bullish reasons**\n' +
        '- [Reason 1]\n' +
        '- [Reason 2]\n' +
        '- [Reason 3]\n\n' +
        '**Risk factors**\n' +
        '- [Risk 1]\n' +
        '- [Risk 2]\n\n' +
        '## 📊 Full Ranking\n\n' +
        '| Rank | Symbol | Score | Verdict |\n' +
        '| --- | --- | --- | --- |\n' +
        '| 1 | [SYM] | [X]/100 | Buy / Watch / Avoid |\n' +
        '| … | … | … | … |\n\n' +
        '## ❌ Why others were not selected\n\n' +
        '- **[Symbol]:** [Short reason]\n\n' +
        '*Disclaimer: Automated analysis based on the model\u2019s knowledge and live ' +
        'intraday data, which may be outdated or incomplete. Not investment advice.*'
    },
    {
      role: 'user',
      content:
        `Here is the current NSE ${listLabel} list. Pick the best stock and rank them all:\n` +
        `${JSON.stringify(facts, null, 2)}`
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

// Async generator that yields markdown chunks for the best-pick analysis.
export async function* streamTrendingAnalysis(type, stocks) {
  yield* streamCompletion(buildMessages(type, stocks), cacheKey(type, stocks))
}

// Ask the AI to pick the best `limit` stocks from the trending list and return
// their symbols. Used at refresh time to flag `aiRecommended` stocks. Returns
// an array of uppercase symbols (a subset of the provided list); on any failure
// it returns an empty array so the refresh never breaks.
export async function recommendBestSymbols(type, stocks, limit = 3) {
  if (!isAiConfigured() || !Array.isArray(stocks) || !stocks.length) return []

  const valid = new Set(stocks.map((s) => String(s.symbol).toUpperCase()))
  const facts = stocks.map(stockFacts)
  const listLabel = type === 'losers' ? 'top losers' : 'top gainers'

  const messages = [
    {
      role: 'system',
      content:
        'Act as a professional stock market analyst and portfolio manager. You are given ' +
        'a list of trending NSE stocks with live intraday data. Using fundamentals, ' +
        'technicals, momentum, news/sentiment and risk, pick the best genuine buying ' +
        'opportunities and avoid operator-driven pump-and-dump stocks. Respond ONLY with a ' +
        `compact JSON array of at most ${limit} stock symbols (strings), best first, e.g. ` +
        '["SYM1","SYM2"]. No markdown, no prose, no code fences.'
    },
    {
      role: 'user',
      content:
        `Here is the current NSE ${listLabel} list. Return the best symbols as a JSON array:\n` +
        `${JSON.stringify(facts, null, 2)}`
    }
  ]

  try {
    let text = ''
    for await (const token of streamCompletion(messages, `${cacheKey(type, stocks)}:best-symbols:${limit}`)) {
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
