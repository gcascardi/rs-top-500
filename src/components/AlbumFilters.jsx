export default function AlbumFilters({ filters, setFilters, decades, genres, view, setView, count, onReset }) {
  const update = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }))
  return (
    <section className="filter-section" aria-label="Pesquisa e filtros">
      <div className="collection-toggle" role="group" aria-label="Lista de álbuns">
        <button type="button" aria-pressed={filters.collection === 'all'} onClick={() => setFilters((current) => ({ ...current, collection: 'all' }))}>Todos os álbuns</button>
        <button type="button" aria-pressed={filters.collection === 'listen-later'} onClick={() => setFilters((current) => ({ ...current, collection: 'listen-later' }))}>♥ Ouvir depois</button>
      </div>
      <div className="filter-topline">
        <label className="search-field">
          <span>Pesquisar no ranking</span>
          <input type="search" value={filters.search} onChange={update('search')} placeholder="Álbum ou artista…" />
        </label>
        <div className="view-toggle" role="group" aria-label="Modo de visualização">
          <button aria-pressed={view === 'grid'} onClick={() => setView('grid')}>▦ <span>Grade</span></button>
          <button aria-pressed={view === 'list'} onClick={() => setView('list')}>☷ <span>Lista</span></button>
        </div>
      </div>
      <details className="mobile-filter-disclosure">
        <summary>Filtros e ordenação</summary>
        <FilterControls {...{ filters, update, decades, genres, onReset }} />
      </details>
      <div className="desktop-filters"><FilterControls {...{ filters, update, decades, genres, onReset }} /></div>
      <p className="result-count"><strong>{count}</strong> {count === 1 ? 'álbum encontrado' : 'álbuns encontrados'}</p>
    </section>
  )
}

function FilterControls({ filters, update, decades, genres, onReset }) {
  return (
    <div className="filter-controls">
      <label>Status<select value={filters.status} onChange={update('status')}><option value="all">Todos</option><option value="listened">Ouvidos</option><option value="unlistened">Não ouvidos</option></select></label>
      <label>Década<select value={filters.decade} onChange={update('decade')}><option value="all">Todas</option>{decades.map((item) => <option key={item} value={item}>{item}s</option>)}</select></label>
      <label>Gênero<select value={filters.genre} onChange={update('genre')}><option value="all">Todos</option>{genres.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Avaliação<select value={filters.rating} onChange={update('rating')}><option value="all">Todas</option><option value="rated">Avaliados</option><option value="unrated">Não avaliados</option>{[1,2,3,4,5].map((star) => <option key={star} value={star}>{star} {star === 1 ? 'estrela' : 'estrelas'}</option>)}</select></label>
      <label>Ordenar<select value={filters.sort} onChange={update('sort')}><option value="position-asc">Posição crescente</option><option value="position-desc">Posição decrescente</option><option value="title">Título</option><option value="artist">Artista</option><option value="year-asc">Ano crescente</option><option value="year-desc">Ano decrescente</option><option value="rating-desc">Maior avaliação</option><option value="rating-asc">Menor avaliação</option><option value="recently-listened">Ouvido recentemente</option></select></label>
      <button className="text-button" onClick={onReset}>Limpar filtros</button>
    </div>
  )
}
