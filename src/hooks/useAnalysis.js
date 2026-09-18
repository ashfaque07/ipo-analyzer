// Analysis hook: runs real-time AI analysis for a selected IPO and tracks modal state.

import { useRef, useState } from 'react'
import { streamAnalysis } from '../services/analysisService.js'

export function useAnalysis() {
  const [analysis, setAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(null)
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef(null)

  async function analyze(ipo, idx) {
    // Cancel any in-flight analysis.
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setAnalyzing(idx)
    setStreaming(true)
    setAnalysis({ ipo, result: { provider: 'gemini', score: null, verdict: null, summary: '' } })

    try {
      const result = await streamAnalysis(
        ipo,
        (chunk) => {
          setAnalysis((prev) =>
            prev && prev.ipo === ipo
              ? { ipo, result: { ...prev.result, summary: prev.result.summary + chunk } }
              : prev
          )
        },
        controller.signal
      )
      setAnalysis({ ipo, result })
    } catch (err) {
      if (err.name !== 'AbortError') {
        setAnalysis({
          ipo,
          result: { provider: 'error', score: null, verdict: null, summary: `Analysis failed: ${err.message}` }
        })
      }
    } finally {
      setAnalyzing(null)
      setStreaming(false)
    }
  }

  function close() {
    abortRef.current?.abort()
    setAnalysis(null)
    setStreaming(false)
  }

  return { analysis, analyzing, streaming, analyze, close }
}
