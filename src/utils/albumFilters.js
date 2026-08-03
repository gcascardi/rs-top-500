export const initialFilters = { search: '', status: 'all', decade: 'all', genre: 'all', rating: 'all', sort: 'position-asc' }

const normalize = (value) => value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export function filterAndSortAlbums(albums, progress, filters) {
  const query = normalize(filters.search.trim())
  const result = albums.filter((album) => {
    const state = progress[album.id] || {}
    if (query && !normalize(`${album.title} ${album.artist}`).includes(query)) return false
    if (filters.status === 'listened' && !state.listened) return false
    if (filters.status === 'unlistened' && state.listened) return false
    if (filters.decade !== 'all' && String(album.decade) !== filters.decade) return false
    if (filters.genre !== 'all' && !album.genres.includes(filters.genre)) return false
    if (filters.rating === 'rated' && state.rating == null) return false
    if (filters.rating === 'unrated' && state.rating != null) return false
    if (/^[1-5]$/.test(filters.rating) && Number(state.rating) !== Number(filters.rating)) return false
    return true
  })

  const rating = (album) => progress[album.id]?.rating
  const listenedAt = (album) => progress[album.id]?.listened_at ? new Date(progress[album.id].listened_at).getTime() : 0
  return result.sort((a, b) => {
    switch (filters.sort) {
      case 'position-desc': return b.position - a.position
      case 'title': return a.title.localeCompare(b.title, 'pt-BR') || a.position - b.position
      case 'artist': return a.artist.localeCompare(b.artist, 'pt-BR') || a.position - b.position
      case 'year-asc': return a.year - b.year || a.position - b.position
      case 'year-desc': return b.year - a.year || a.position - b.position
      case 'rating-desc': return rating(a) == null ? 1 : rating(b) == null ? -1 : rating(b) - rating(a) || a.position - b.position
      case 'rating-asc': return rating(a) == null ? 1 : rating(b) == null ? -1 : rating(a) - rating(b) || a.position - b.position
      case 'recently-listened': return listenedAt(b) - listenedAt(a) || a.position - b.position
      default: return a.position - b.position
    }
  })
}
