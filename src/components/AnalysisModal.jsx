// Modal that displays the AI analysis result for one IPO.

import { useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function AnalysisModal({ analysis, streaming, onClose }) {
  // Lock background scroll while the modal is open.
  useEffect(() => {
    if (!analysis) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [analysis])

  if (!analysis) return null

  const { ipo, result } = analysis
  const empty = !result.summary

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-body" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>AI Analysis · {ipo.company}</h2>
          <button className="close" onClick={onClose}>✕</button>
        </div>
        {result.verdict && (
          <div className="verdict">
            <span className={`pill ${result.verdict.includes('Positive') ? 'good' : result.verdict.includes('Cautious') ? 'bad' : 'neutral'}`}>
              {result.verdict}
            </span>
            {result.score != null && <span className="score">Score: {result.score}/100</span>}
            <span className="provider">via {result.provider}</span>
          </div>
        )}
        {streaming && empty && <p className="info">🤖 Analyzing in real time…</p>}
        <div className="summary markdown">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.summary}</ReactMarkdown>
          {streaming && <span className="cursor">▍</span>}
        </div>
      </div>
    </div>
  )
}
