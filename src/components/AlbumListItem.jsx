import RatingControl from './RatingControl'
import { publicPath } from '../utils/publicPath'

export default function AlbumListItem({ album, state, onUpdate, selectionMode, selected, onSelect, savingIds, onOpen }) {
  const openFromItem = (event) => {
    if (!event.target.closest('button, input, select, label, a')) onOpen(album)
  }
  return (
    <article id={`album-${album.id}`} className={`album-list-item album-card--openable ${state.listened ? 'is-listened' : ''} ${selected ? 'is-selected' : ''}`} onClick={openFromItem}>
      {selectionMode && <label className="selection-check selection-check--inline"><input type="checkbox" checked={selected} onChange={() => onSelect(album.id)} /><span className="sr-only">Selecionar {album.title}</span></label>}
      <span className="rank-number">#{album.position}</span>
      <img src={publicPath(album.cover)} alt={`Capa de ${album.title}, de ${album.artist}`} loading="lazy" />
      <div className="album-list-item__info"><p>{album.year} · {album.genres.join(' / ')}</p><h2>{album.title}</h2><h3>{album.artist}</h3><button type="button" className="album-detail-trigger" onClick={() => onOpen(album)}>Ver detalhes</button></div>
      <button disabled={savingIds?.has(album.id)} className={`listen-button ${state.listened ? 'active' : ''}`} onClick={() => onUpdate(album.id, { listened: !state.listened })}>{state.listened ? '✓ Ouvido' : '+ Ouvido'}</button>
      <RatingControl album={album} state={state} onUpdate={onUpdate} disabled={savingIds?.has(album.id)} />
    </article>
  )
}
