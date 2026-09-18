// App header: title, source link, live badge and refresh button.

export default function Header({ source, count, onRefresh, theme, onToggleTheme }) {
  return (
    <header>
      <h1><span className="logo">📈</span> <span className="title-text">IPO Analyzer</span></h1>
      <p className="subtitle">
        Live IPO data (GMP, rating, dates &amp; more) from{' '}
        <a href="https://www.investorgain.com/report/ipo-gmp-live/331/" target="_blank" rel="noreferrer">
          InvestorGain Live IPO GMP
        </a>
        {source === 'live' && <span className="badge">Live · {count} IPOs</span>}
      </p>
      <div className="header-actions">
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle color theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="refresh" onClick={onRefresh}>↻ Refresh</button>
      </div>
    </header>
  )
}
