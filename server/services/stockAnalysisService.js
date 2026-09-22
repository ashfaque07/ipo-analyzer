// Real-time AI fundamental analysis for a listed stock. Reuses the shared
// AI streaming/caching helper and yields markdown text tokens as they arrive.

import { streamCompletion } from './analysisService.js'

function buildMessages(query) {
  return [
    {
      role: 'system',
      content:
        'You are a sharp equity research analyst specialising in listed stocks. ' +
        'The user gives you a company name or ticker symbol. Using your knowledge of ' +
        "the company's fundamentals (business model, revenue and profit growth, margins, " +
        'return ratios, debt, valuation multiples, competitive position and key risks), ' +
        'respond ONLY in the exact markdown template below. Fill every bracketed ' +
        'placeholder; if a value is genuinely unknown, write "N/A". Do not add extra ' +
        'sections, preamble, or text outside the template.\n\n' +
        '## AI Stock Analysis\n\n' +
        '**[Company Name] ([Ticker]):** Fundamental analysis indicates ' +
        '**[Positive/Neutral/Cautious]** sentiment. Confidence is **[High/Medium/Low]**. ' +
        'For informational purposes only, not investment advice.\n\n' +
        '| Metric | Assessment | AI Signal |\n' +
        '| --- | --- | --- |\n' +
        '| Business Quality | [Short note] | Strong / Average / Weak |\n' +
        '| Revenue Growth | [Trend] | Accelerating / Steady / Declining |\n' +
        '| Profitability | [Margins / ROE] | Strong / Average / Weak |\n' +
        '| Balance Sheet | [Debt level] | Healthy / Moderate / Leveraged |\n' +
        '| Valuation | P/E [X]x · P/B [X]x | Attractive / Fair / Expensive |\n' +
        '| Key Risk | [Short risk] | Low / Medium / High |\n' +
        '| AI Outlook | Buy / Hold / Avoid | Confidence: [X]% |\n\n' +
        '**Fundamental rationale:** The strongest factor is **[factor]**, while the main ' +
        'concern is **[risk]**. Summarise the investment case in two to three sentences.\n\n' +
        '*Disclaimer: Automated analysis based on the model\u2019s knowledge, which may be ' +
        'outdated. Not investment advice.*'
    },
    {
      role: 'user',
      content: `Analyze the fundamentals of this listed stock: ${query}`
    }
  ]
}

// Async generator that yields markdown chunks for a stock's fundamental analysis.
export async function* streamStockAnalysis(query) {
  const normalized = String(query).trim()
  yield* streamCompletion(buildMessages(normalized), `stock:${normalized.toLowerCase()}`)
}
