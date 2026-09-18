// App header: title, source link, live badge and refresh button.

export default function Header({ source, count, onRefresh }) {
  return (
    <header>
      <h1>📈 IPO Analyzer</h1>
      <p className="subtitle">
        Live IPO data (GMP, rating, dates &amp; more) from{' '}
        <a href="https://www.investorgain.com/report/ipo-gmp-live/331/" target="_blank" rel="noreferrer">
          InvestorGain Live IPO GMP
        </a>
        {source === 'live' && <span className="badge">Live · {count} IPOs</span>}
      </p>
      <button className="refresh" onClick={onRefresh}>↻ Refresh</button>
    </header>
  )
}
