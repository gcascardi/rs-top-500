import ListenLaterButton from './ListenLaterButton'
import { publicPath } from '../utils/publicPath'
import RatingControl from './RatingControl'

export default function FeaturedAlbum({ album, state, onUpdate, onView, saving, eager = true }) {
  return (
    <article className={`featured-album ${state.listened ? 'is-listened' : ''}`}>
      <div className="featured-album__cover">
        <span className="rank-number">#{album.position}</span>
        <img src={publicPath(album.cover)} alt={`Capa de ${album.title}, de ${album.artist}`} loading={eager ? 'eager' : 'lazy'} />
      </div>
      <div className="featured-album__content">
        <p className="album-meta">{album.year} · {album.genres.length ? album.genres.join(' / ') : 'Gênero não informado'}</p>
        <h3>{album.title}</h3>
        <p className="album-artist">{album.artist}</p>
        <div className="featured-album__actions">
          <button disabled={saving} className={`listen-button ${state.listened ? 'active' : ''}`} onClick={() => onUpdate(album.id, { listened: !state.listened })}>{state.listened ? '✓ Ouvido' : '+ Marcar como ouvido'}</button>
          <ListenLaterButton album={album} state={state} onUpdate={onUpdate} disabled={saving} />
          <RatingControl album={album} state={state} onUpdate={onUpdate} disabled={saving} size="medium" />
          <button className="button button--outline" onClick={() => onView(album.id)}>Ver na lista</button>
        </div>
      </div>
    </article>
  )
}
