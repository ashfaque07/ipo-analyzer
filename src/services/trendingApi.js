// API client for live trending stocks (top gainers / losers) from the proxy.

export async function fetchTrending(type = 'gainers', force = false) {
  const params = new URLSearchParams({ type })
  if (force) params.set('refresh', '1')
  const res = await fetch(`/api/trending?${params.toString()}`)
  return res.json()
}
