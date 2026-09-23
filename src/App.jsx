import Header from './components/Header.jsx'
import Toolbar from './components/Toolbar.jsx'
import IpoGrid from './components/IpoGrid.jsx'
import IpoSkeleton from './components/IpoSkeleton.jsx'
import AnalysisModal from './components/AnalysisModal.jsx'
import StockAnalyzer from './components/StockAnalyzer.jsx'
import TrendingStocks from './components/TrendingStocks.jsx'
import { useIpos } from './hooks/useIpos.js'
import { useAnalysis } from './hooks/useAnalysis.js'
import { useTheme } from './hooks/useTheme.js'
import { useState } from 'react'

export default function App() {
  const { ipos, source, loading, error, filter, setFilter, search, setSearch, filtered, counts, reload } = useIpos()
  const { analysis, analyzing, streaming, analyze, close } = useAnalysis()
  const { theme, toggle } = useTheme()
  const [view, setView] = useState('ipos')

  return (
    <div className="app">
      <Header source={source} count={ipos.length} onRefresh={reload} theme={theme} onToggleTheme={toggle} view={view} />

      <nav className="view-nav">
        <button
          className={`view-tab ${view === 'ipos' ? 'active' : ''}`}
          onClick={() => setView('ipos')}
        >
          📈 IPOs
        </button>
        <button
          className={`view-tab ${view === 'trending' ? 'active' : ''}`}
          onClick={() => setView('trending')}
        >
          🔥 Trending
        </button>
        <button
          className={`view-tab ${view === 'stocks' ? 'active' : ''}`}
          onClick={() => setView('stocks')}
        >
          🏦 Stock Analysis
        </button>
      </nav>

      {view === 'stocks' ? (
        <StockAnalyzer />
      ) : view === 'trending' ? (
        <TrendingStocks />
      ) : (
        <>
          <Toolbar search={search} onSearch={setSearch} filter={filter} onFilter={setFilter} counts={counts} />

          {error && <p className="error">{error}</p>}
          {!loading && !error && !filtered.length && <p className="info">No IPOs match your filter.</p>}

          {loading ? (
            <IpoSkeleton />
          ) : (
            <IpoGrid ipos={filtered} analyzing={analyzing} onAnalyze={analyze} />
          )}

          <AnalysisModal analysis={analysis} streaming={streaming} onClose={close} />
        </>
      )}
    </div>
  )
}
