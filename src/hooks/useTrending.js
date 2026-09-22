// Hook: loads live trending stocks (top gainers / losers) from the proxy.

import { useCallback, useEffect, useState } from 'react'
import { fetchTrending } from '../services/trendingApi.js'

export function useTrending() {
  const [type, setType] = useState('gainers')
  const [stocks, setStocks] = useState([])
  const [timestamp, setTimestamp] = useState(null)
  const [dayStartedAt, setDayStartedAt] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async (nextType, force = false) => {
    if (force) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const data = await fetchTrending(nextType, force)
      if (data.error) throw new Error(data.error)
      setStocks(data.stocks || [])
      setTimestamp(data.timestamp || null)
      setDayStartedAt(data.dayStartedAt || null)
      setUpdatedAt(data.updatedAt || null)
    } catch (err) {
      setError(err.message)
      if (!force) setStocks([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load(type)
  }, [type, load])

  return {
    type,
    setType,
    stocks,
    timestamp,
    dayStartedAt,
    updatedAt,
    loading,
    refreshing,
    error,
    reload: () => load(type, true)
  }
}
