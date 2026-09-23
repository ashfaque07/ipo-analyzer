// Controller: serves live trending stocks (top gainers / losers) from NSE.

import { readTrending, refreshTrending, loadHolidays, isMarketOpen } from '../services/trendingService.js'

export async function handleGetTrending(req, res) {
  const url = new URL(req.url, 'http://localhost')
  const type = url.searchParams.get('type') || 'gainers'
  const force = url.searchParams.get('refresh') === '1'

  res.setHeader('Content-Type', 'application/json')

  try {
    const data = force ? await refreshTrending(type) : await readTrending(type)
    res.end(JSON.stringify(data))
  } catch (err) {
    console.error('Trending fetch failed:', err)
    res.statusCode = 502
    res.end(
      JSON.stringify({
        source: 'error',
        type,
        count: 0,
        stocks: [],
        error: `Could not fetch trending stocks from NSE: ${err.message}`
      })
    )
  }
}

// Manual trigger that mimics the scheduled refresh for both types. Useful to
// verify the whole persistence path (NSE fetch -> Blobs write) from the browser
// without waiting for the cron. Returns a small diagnostic summary.
export async function handleRefreshTrending(req, res) {
  res.setHeader('Content-Type', 'application/json')

  try {
    await loadHolidays()
    const marketOpen = isMarketOpen()

    const results = []
    for (const type of ['gainers', 'losers']) {
      try {
        const snap = await refreshTrending(type)
        results.push({
          type,
          count: snap.count,
          dayStartedAt: snap.dayStartedAt,
          updatedAt: snap.updatedAt
        })
      } catch (err) {
        results.push({ type, error: err.message })
      }
    }

    res.end(JSON.stringify({ marketOpen, results }))
  } catch (err) {
    console.error('Manual trending refresh failed:', err)
    res.statusCode = 502
    res.end(JSON.stringify({ error: err.message }))
  }
}
