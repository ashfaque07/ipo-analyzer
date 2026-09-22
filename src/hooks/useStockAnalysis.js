// Hook: runs real-time AI fundamental analysis for a searched stock.

import { useRef, useState } from 'react'
import { streamStockAnalysis } from '../services/stockApi.js'

export function useStockAnalysis() {
  const [result, setResult] = useState(null)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const abortRef = useRef(null)

  async function analyze(rawQuery) {
    const q = rawQuery.trim()
    if (!q) return

    // Cancel any in-flight analysis.
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setQuery(q)
    setError(null)
    setStreaming(true)
    setResult({ provider: 'gemini', summary: '' })

    try {
      const final = await streamStockAnalysis(
        q,
        (chunk) => {
          setResult((prev) => ({ ...prev, summary: (prev?.summary || '') + chunk }))
        },
        controller.signal
      )
      setResult(final)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message)
        setResult(null)
      }
    } finally {
      setStreaming(false)
    }
  }

  function reset() {
    abortRef.current?.abort()
    setResult(null)
    setError(null)
    setStreaming(false)
    setQuery('')
  }

  return { result, streaming, error, query, analyze, reset }
}
