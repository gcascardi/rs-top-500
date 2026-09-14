import ListenLaterButton from './ListenLaterButton'
import RatingControl from './RatingControl'
import { publicPath } from '../utils/publicPath'

export default function AlbumCard({ album, state, onUpdate, selectionMode, selected, onSelect, savingIds, onOpen }) {
  const cover = publicPath(album.cover)
  const openFromCard = (event) => {
    if (!event.target.closest('button, input, select, label, a')) onOpen(album)
  }
  return (
    <article id={`album-${album.id}`} className={`album-card album-card--openable ${state.listened ? 'is-listened' : ''} ${selected ? 'is-selected' : ''}`} onClick={openFromCard}>
      <div className="album-card__visual">
        <span className="rank-number">#{album.position}</span>
        {selectionMode && <label className="selection-check"><input type="checkbox" checked={selected} onChange={() => onSelect(album.id)} /><span className="sr-only">Selecionar {album.title}</span></label>}
        <img src={cover} alt={`Capa de ${album.title}, de ${album.artist}`} loading="lazy" />
        {state.listened && <span className="listened-stamp">✓ Ouvido</span>}
      </div>
      <div className="album-card__body">
        <p className="album-meta">{album.year} · {album.genres.join(' / ')}</p>
        <h2>{album.title}</h2>
        <p className="album-artist">{album.artist}</p>
        <button type="button" className="album-detail-trigger" onClick={() => onOpen(album)}>Ver detalhes</button>
        <div className="album-actions">
          <button disabled={savingIds?.has(album.id)} className={`listen-button ${state.listened ? 'active' : ''}`} onClick={() => onUpdate(album.id, { listened: !state.listened })}>{state.listened ? '✓ Ouvido' : '+ Marcar como ouvido'}</button>
          <ListenLaterButton album={album} state={state} onUpdate={onUpdate} disabled={savingIds?.has(album.id)} />
          <RatingControl album={album} state={state} onUpdate={onUpdate} disabled={savingIds?.has(album.id)} />
        </div>
      </div>
    </article>
  )
}
