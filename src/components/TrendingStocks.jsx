// Live trending stocks page: NSE top gainers / losers (All Securities).

import { useTrending } from '../hooks/useTrending.js'

const fmtNum = (n, d = 2) =>
  n === null || n === undefined || Number.isNaN(n)
    ? '—'
    : Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d })

const fmtInt = (n) =>
  n === null || n === undefined || Number.isNaN(n) ? '—' : Number(n).toLocaleString('en-IN')

// Show an ISO timestamp as IST time (HH:MM), e.g. for created / modified.
const fmtTime = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  })
}

export default function TrendingStocks() {
  const {
    type,
    setType,
    stocks,
    timestamp,
    dayStartedAt,
    updatedAt,
    loading,
    refreshing,
    error,
    reload
  } = useTrending()

  return (
    <section className="trending">
      <div className="trending-head">
        <div className="trending-tabs">
          <button
            className={`trend-tab ${type === 'gainers' ? 'active' : ''}`}
            onClick={() => setType('gainers')}
          >
            🚀 Top Gainers
          </button>
          <button
            className={`trend-tab ${type === 'losers' ? 'active' : ''}`}
            onClick={() => setType('losers')}
          >
            📉 Top Losers
          </button>
        </div>
        <div className="trending-meta">
          {dayStartedAt && <span className="trending-time">Day start {fmtTime(dayStartedAt)}</span>}
          {updatedAt && <span className="trending-time">Updated {fmtTime(updatedAt)}</span>}
          {timestamp && <span className="trending-time">NSE {timestamp}</span>}
          <button className="trend-refresh" onClick={reload} disabled={loading || refreshing}>
            {refreshing ? 'Refreshing…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {!error && !loading && !stocks.length && (
        <p className="info">No trending stocks available right now.</p>
      )}

      {loading && !stocks.length ? (
        <p className="info">Loading live trending stocks…</p>
      ) : (
        !!stocks.length && (
          <div className="trending-table-wrap">
            <table className="trending-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th className="ta-left">Symbol</th>
                  <th>LTP</th>
                  <th>Change</th>
                  <th>% Change</th>
                  <th>Open</th>
                  <th>High</th>
                  <th>Low</th>
                  <th>Prev Close</th>
                  <th>Volume</th>
                  <th>Turnover (₹L)</th>
                  <th className="ta-left">Reason (Trending)</th>
                  <th>Created</th>
                  <th>Modified</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((s, i) => {
                  const up = (s.percentChange ?? 0) >= 0
                  return (
                    <tr key={s.symbol} className={s.stale ? 'stale' : ''}>
                      <td className="muted">{i + 1}</td>
                      <td className="ta-left sym">
                        {s.symbol}
                        {s.stale && (
                          <span className="stale-badge" title="Not in the latest refresh">
                            not updated
                          </span>
                        )}
                      </td>
                      <td>{fmtNum(s.ltp)}</td>
                      <td className={up ? 'pos' : 'neg'}>{fmtNum(s.change)}</td>
                      <td className={up ? 'pos' : 'neg'}>
                        {up ? '▲' : '▼'} {fmtNum(s.percentChange)}%
                      </td>
                      <td>{fmtNum(s.open)}</td>
                      <td>{fmtNum(s.high)}</td>
                      <td>{fmtNum(s.low)}</td>
                      <td>{fmtNum(s.prevClose)}</td>
                      <td>{fmtInt(s.volume)}</td>
                      <td>{fmtNum(s.turnover)}</td>
                      <td className="ta-left reason" title={s.reasonExDate ? `Ex-date: ${s.reasonExDate}` : undefined}>
                        {s.reason || '—'}
                      </td>
                      <td className="muted">{fmtTime(s.createdAt)}</td>
                      <td className="muted">{fmtTime(s.modifiedAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </section>
  )
}
