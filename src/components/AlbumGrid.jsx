import AlbumCard from './AlbumCard'
import AlbumListItem from './AlbumListItem'

export default function AlbumGrid({ albums, progress, view, ...props }) {
  const Component = view === 'grid' ? AlbumCard : AlbumListItem
  return (
    <div className={view === 'grid' ? 'album-grid' : 'album-list'}>
      {albums.map((album) => <Component key={album.id} album={album} state={progress[album.id] || { listened: false, rating: null }} {...props} selected={props.selectedIds.has(album.id)} />)}
    </div>
  )
}
