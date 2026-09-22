// Controller: serves live trending stocks (top gainers / losers) from NSE.

import { readTrending, refreshTrending } from '../services/trendingService.js'

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
