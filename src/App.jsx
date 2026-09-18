import Header from './components/Header.jsx'
import Toolbar from './components/Toolbar.jsx'
import IpoGrid from './components/IpoGrid.jsx'
import AnalysisModal from './components/AnalysisModal.jsx'
import { useIpos } from './hooks/useIpos.js'
import { useAnalysis } from './hooks/useAnalysis.js'

export default function App() {
  const { ipos, source, loading, error, filter, setFilter, search, setSearch, filtered, counts, reload } = useIpos()
  const { analysis, analyzing, streaming, analyze, close } = useAnalysis()

  return (
    <div className="app">
      <Header source={source} count={ipos.length} onRefresh={reload} />

      <Toolbar search={search} onSearch={setSearch} filter={filter} onFilter={setFilter} counts={counts} />

      {loading && <p className="info">Loading IPOs…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && !filtered.length && <p className="info">No IPOs match your filter.</p>}

      <IpoGrid ipos={filtered} analyzing={analyzing} onAnalyze={analyze} />

      <AnalysisModal analysis={analysis} streaming={streaming} onClose={close} />
    </div>
  )
}
