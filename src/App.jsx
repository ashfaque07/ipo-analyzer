import Header from './components/Header.jsx'
import Toolbar from './components/Toolbar.jsx'
import IpoGrid from './components/IpoGrid.jsx'
import IpoSkeleton from './components/IpoSkeleton.jsx'
import AnalysisModal from './components/AnalysisModal.jsx'
import { useIpos } from './hooks/useIpos.js'
import { useAnalysis } from './hooks/useAnalysis.js'
import { useTheme } from './hooks/useTheme.js'

export default function App() {
  const { ipos, source, loading, error, filter, setFilter, search, setSearch, filtered, counts, reload } = useIpos()
  const { analysis, analyzing, streaming, analyze, close } = useAnalysis()
  const { theme, toggle } = useTheme()

  return (
    <div className="app">
      <Header source={source} count={ipos.length} onRefresh={reload} theme={theme} onToggleTheme={toggle} />

      <Toolbar search={search} onSearch={setSearch} filter={filter} onFilter={setFilter} counts={counts} />

      {error && <p className="error">{error}</p>}
      {!loading && !error && !filtered.length && <p className="info">No IPOs match your filter.</p>}

      {loading ? (
        <IpoSkeleton />
      ) : (
        <IpoGrid ipos={filtered} analyzing={analyzing} onAnalyze={analyze} />
      )}

      <AnalysisModal analysis={analysis} streaming={streaming} onClose={close} />
    </div>
  )
}
