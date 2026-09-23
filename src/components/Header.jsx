// App header: title, source link, live badge and refresh button.

const HEADINGS = {
  ipos: {
    title: 'IPO Analyzer',
    logo: '📈',
    subtitle: (
      <>
        Live IPO data (GMP, rating, dates &amp; more) from{' '}
        <a href="https://www.investorgain.com/report/ipo-gmp-live/331/" target="_blank" rel="noreferrer">
          InvestorGain Live IPO GMP
        </a>
      </>
    )
  },
  stocks: {
    title: 'Stock Analysis',
    logo: '🏦',
    subtitle: 'AI-powered fundamental analysis for any listed stock.'
  },
  trending: {
    title: 'Trending Stocks',
    logo: '🔥',
    subtitle: 'Live NSE top gainers & losers, refreshed through the trading day.'
  }
}

export default function Header({ view = 'ipos', source, count, onRefresh, theme, onToggleTheme }) {
  const heading = HEADINGS[view] || HEADINGS.ipos

  return (
    <header>
      <h1>
        <span className="logo">{heading.logo}</span>{' '}
        <span className="title-text">{heading.title}</span>
      </h1>
      <p className="subtitle">
        {heading.subtitle}
        {view === 'ipos' && source === 'live' && <span className="badge">Live · {count} IPOs</span>}
      </p>
      <div className="header-actions">
        {view === 'ipos' && (
          <button className="refresh" onClick={onRefresh}>↻ Refresh</button>
        )}
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle color theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
