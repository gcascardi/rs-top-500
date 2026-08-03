import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import AlbumFilters from './components/AlbumFilters'
import AlbumGrid from './components/AlbumGrid'
import BulkActions from './components/BulkActions'
import EmptyState from './components/EmptyState'
import Header from './components/Header'
import ProgressBar from './components/ProgressBar'
import StatsSummary from './components/StatsSummary'
import AlbumOfTheDay from './components/AlbumOfTheDay'
import RandomAlbumButton from './components/RandomAlbumButton'
import RandomAlbumPanel from './components/RandomAlbumPanel'
import Pagination from './components/Pagination'
import AlbumDetailPanel from './components/AlbumDetailPanel'
import { useAlbumProgress } from './hooks/useAlbumProgress'
import { useAlbums } from './hooks/useAlbums'
import { loadView, saveView } from './lib/storage'
import { isSupabaseConfigured } from './lib/supabase'
import { filterAndSortAlbums, initialFilters } from './utils/albumFilters'
import { getAlbumStats } from './utils/albumStats'
import { albumOfTheDay, pickRandomAlbum } from './utils/randomAlbum'

function App() {
  const pageSize = 100
  const { albums, loading: albumsLoading, error: albumsError } = useAlbums()
  const data = useAlbumProgress()
  const [filters, setFilters] = useState(initialFilters)
  const [view, setViewState] = useState(loadView)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [pendingBulk, setPendingBulk] = useState('listened')
  const [onlyUnlistened, setOnlyUnlistened] = useState(true)
  const [randomAlbum, setRandomAlbum] = useState(null)
  const [randomOpen, setRandomOpen] = useState(false)
  const [randomUsedFallback, setRandomUsedFallback] = useState(false)
  const [page, setPage] = useState(1)
  const [detailAlbum, setDetailAlbum] = useState(null)
  const randomHistory = useRef([])

  const stats = useMemo(() => getAlbumStats(albums, data.progress), [albums, data.progress])
  const visibleAlbums = useMemo(() => filterAndSortAlbums(albums, data.progress, filters), [albums, data.progress, filters])
  const totalPages = Math.max(1, Math.ceil(visibleAlbums.length / pageSize))
  const paginatedAlbums = useMemo(() => visibleAlbums.slice((page - 1) * pageSize, page * pageSize), [page, visibleAlbums])
  const decades = useMemo(() => [...new Set(albums.map((item) => item.decade))].sort(), [albums])
  const genres = useMemo(() => [...new Set(albums.flatMap((item) => item.genres))].sort(), [albums])
  const dailyAlbum = useMemo(() => albumOfTheDay(albums), [albums])
  const setFiltersAndResetPage = useCallback((nextFilters) => {
    setPage(1)
    setFilters(nextFilters)
  }, [])
  const resetFilters = () => setFiltersAndResetPage(initialFilters)
  useEffect(() => { if (page > totalPages) setPage(totalPages) }, [page, totalPages])
  const setView = (next) => { setViewState(next); saveView(next) }
  const toggleSelected = (id) => setSelectedIds((current) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
  const setManySelected = (ids) => setSelectedIds(new Set(ids))
  const setBulkActive = (active) => { setSelectionMode(active); if (!active) setSelectedIds(new Set()) }
  const saveBulk = async () => {
    const ok = await data.bulkUpdate([...selectedIds], pendingBulk === 'listened')
    if (ok) { setSelectedIds(new Set()); setSelectionMode(false) }
  }
  const drawRandomAlbum = useCallback(() => {
    const result = pickRandomAlbum(visibleAlbums, data.progress, onlyUnlistened, randomHistory.current)
    setRandomAlbum(result.album)
    setRandomUsedFallback(result.usedFallback)
    setRandomOpen(true)
    if (result.album) randomHistory.current = [...randomHistory.current, result.album.id].slice(-5)
  }, [data.progress, onlyUnlistened, visibleAlbums])
  const closeRandom = useCallback(() => setRandomOpen(false), [])
  const closeAlbumDetail = useCallback(() => setDetailAlbum(null), [])
  const goToAlbum = useCallback((albumId) => {
    const visibleIndex = visibleAlbums.findIndex((album) => album.id === albumId)
    if (visibleIndex >= 0) setPage(Math.floor(visibleIndex / pageSize) + 1)
    else {
      setFilters(initialFilters)
      const defaultIndex = albums.findIndex((album) => album.id === albumId)
      setPage(Math.floor(Math.max(0, defaultIndex) / pageSize) + 1)
    }
    window.setTimeout(() => document.getElementById(`album-${albumId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
  }, [albums, visibleAlbums])
  const changePage = (nextPage) => {
    setPage(nextPage)
    window.setTimeout(() => document.getElementById('ranking-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }
  const viewFromDetail = useCallback((albumId) => {
    setDetailAlbum(null)
    goToAlbum(albumId)
  }, [goToAlbum])

  return (
    <div id="top" className="app-shell">
      <Header stats={stats} configured={isSupabaseConfigured} />
      {!isSupabaseConfigured && <div className="mode-banner" role="status"><span>●</span><strong>Modo local:</strong> progresso salvo neste dispositivo.</div>}
      {data.canImport && <div className="import-banner"><div><strong>Há progresso local disponível.</strong><span>Você pode enviá-lo ao banco compartilhado.</span></div><button className="button button--red" onClick={data.importLocal}>Importar progresso salvo neste dispositivo</button><button className="text-button" onClick={data.dismissImport}>Agora não</button></div>}

      <main>
        {!albumsLoading && albums.length === 500 && <p className="sr-only" role="status">Catálogo com 500 álbuns carregado.</p>}
        <section className="hero-section" aria-labelledby="main-title">
          <div className="hero-section__issue">Edição 01 <span>—</span> Guia de escuta</div>
          <h1 id="main-title">Os 500 maiores álbuns <em>de todos os tempos</em></h1>
          <div className="hero-section__bottom">
            <p>Uma jornada pessoal pelo ranking que atravessa décadas, gêneros e revoluções musicais. Ouça, avalie e acompanhe cada descoberta.</p>
            <div className="hero-score"><strong>{stats.percentage}%</strong><span>da amostra concluída</span><ProgressBar value={stats.percentage} /></div>
          </div>
        </section>

        <p className="disclaimer">Projeto independente baseado no ranking editorial da Rolling Stone. Sem associação oficial com a publicação.</p>
        <StatsSummary stats={stats} />
        {!albumsLoading && <AlbumOfTheDay album={dailyAlbum} state={data.progress[dailyAlbum?.id] || { listened: false, rating: null }} onUpdate={data.updateAlbum} onView={goToAlbum} saving={data.savingIds.has(dailyAlbum?.id)} />}

        <section className="ranking-section" aria-labelledby="ranking-title">
          <div className="ranking-heading"><div><span className="section-kicker">A lista</span><h2 id="ranking-title">Comece a ouvir</h2></div><p>10 álbuns temporários nesta primeira versão</p></div>
          <AlbumFilters filters={filters} setFilters={setFiltersAndResetPage} decades={decades} genres={genres} view={view} setView={setView} count={visibleAlbums.length} onReset={resetFilters} />
          <div className="ranking-tools"><RandomAlbumButton onDraw={drawRandomAlbum} onlyUnlistened={onlyUnlistened} onPreferenceChange={setOnlyUnlistened} disabled={albumsLoading} /><BulkActions active={selectionMode} setActive={setBulkActive} selectedIds={selectedIds} visibleIds={paginatedAlbums.map((item) => item.id)} onToggle={setManySelected} onSave={saveBulk} pending={pendingBulk} setPending={setPendingBulk} /></div>
          {randomOpen && <RandomAlbumPanel album={randomAlbum} state={data.progress[randomAlbum?.id] || { listened: false, rating: null }} onUpdate={data.updateAlbum} onView={goToAlbum} onDrawAgain={drawRandomAlbum} onClose={closeRandom} onResetFilters={resetFilters} saving={data.savingIds.has(randomAlbum?.id)} usedFallback={randomUsedFallback} />}

          {(albumsLoading || data.loading) && <div className="loading-state" role="status"><span /><p>Preparando sua coleção…</p></div>}
          {!albumsLoading && albumsError && <div className="error-state" role="alert"><strong>Algo saiu do ritmo.</strong><p>{albumsError}</p></div>}
          {!albumsLoading && !albumsError && visibleAlbums.length === 0 && <EmptyState onReset={resetFilters} />}
          {!albumsLoading && !albumsError && visibleAlbums.length > 0 && <><Pagination page={page} totalPages={totalPages} totalItems={visibleAlbums.length} pageSize={pageSize} onChange={changePage} /><AlbumGrid albums={paginatedAlbums} progress={data.progress} view={view} onUpdate={data.updateAlbum} selectionMode={selectionMode} selectedIds={selectedIds} onSelect={toggleSelected} savingIds={data.savingIds} onOpen={setDetailAlbum} /><Pagination page={page} totalPages={totalPages} totalItems={visibleAlbums.length} pageSize={pageSize} onChange={changePage} /></>}
        </section>
      </main>

      <footer><a className="brand brand--footer" href="#top"><span>RS</span> TOP 500</a><p>Um álbum de cada vez.</p><p>Dados temporários para desenvolvimento · 2026</p></footer>
      {data.saveState !== 'idle' && <div className={`save-toast save-toast--${data.saveState}`} role="status">{data.message}</div>}
      {data.error && <div className="sr-only" role="alert">{data.error}</div>}
      {detailAlbum && <AlbumDetailPanel album={detailAlbum} state={data.progress[detailAlbum.id] || { listened: false, rating: null }} onUpdate={data.updateAlbum} onView={viewFromDetail} onClose={closeAlbumDetail} saving={data.savingIds.has(detailAlbum.id)} />}
    </div>
  )
}

export default App
