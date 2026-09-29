// App header: title, source link, live badge and refresh button.

import { ICONS } from '../constants/ui.js'

const HEADINGS = {
  ipos: {
    title: 'IPO Analyzer',
    logo: ICONS.ipos,
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
    logo: ICONS.stocks,
    subtitle: 'AI-powered fundamental analysis for any listed stock.'
  },
  trending: {
    title: 'Trending Stocks',
    logo: ICONS.trending,
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
          <button className="refresh" onClick={onRefresh}>{ICONS.refresh} Refresh</button>
        )}
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle color theme"
        >
          {theme === 'dark' ? ICONS.light : ICONS.dark}
        </button>
      </div>
    </header>
  )
}
