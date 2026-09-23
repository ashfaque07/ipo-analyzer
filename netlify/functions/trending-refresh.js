// Scheduled Netlify Function: refreshes the trending-stocks snapshot.
//
// Schedule (UTC cron): every 15 minutes between 03:00 and 10:00 UTC, which
// covers the NSE trading window 09:00–15:30 IST (IST = UTC+5:30). The handler
// additionally gates on `isMarketOpen()` so it only fetches during market hours.
//
// Uses the `schedule()` wrapper from @netlify/functions (the correct pairing
// for a legacy `export const handler`), so Netlify registers the cron.
//
// The first refresh at/after 09:00 IST starts a new trading day: every stock
// gets a fresh `createdAt`. Subsequent 15-minute refreshes update `modifiedAt`
// while preserving each stock's original `createdAt`.

import { schedule } from '@netlify/functions'
import { refreshTrending, isMarketOpen, loadHolidays } from '../../server/services/trendingService.js'

export const handler = schedule('*/15 3-10 * * *', async () => {
  // Load the dynamic NSE holiday list (cached) before gating on market hours.
  await loadHolidays()

  if (!isMarketOpen()) {
    return { statusCode: 200, body: 'Outside NSE market hours — skipped.' }
  }

  const results = []
  for (const type of ['gainers', 'losers']) {
    try {
      const snap = await refreshTrending(type)
      results.push({ type, count: snap.count, dayStartedAt: snap.dayStartedAt, updatedAt: snap.updatedAt })
    } catch (err) {
      console.error(`Trending refresh failed for ${type}:`, err)
      results.push({ type, error: err.message })
    }
  }

  return { statusCode: 200, body: JSON.stringify(results) }
})
