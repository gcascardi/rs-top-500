export function getAlbumStats(albums, progress) {
  const listened = albums.filter((album) => progress[album.id]?.listened).length
  const ratedAlbums = albums.filter((album) => progress[album.id]?.rating != null)
  const ratings = ratedAlbums.map((album) => Number(progress[album.id].rating))
  const distribution = Object.fromEntries([1, 2, 3, 4, 5].map((star) => [star, ratings.filter((rating) => rating === star).length]))
  const topRated = ratedAlbums
    .sort((a, b) => Number(progress[b.id].rating) - Number(progress[a.id].rating) || a.position - b.position)[0] || null
  const decades = [...new Set(albums.map((album) => album.decade))].sort().map((decade) => {
    const decadeAlbums = albums.filter((album) => album.decade === decade)
    return { decade, listened: decadeAlbums.filter((album) => progress[album.id]?.listened).length, total: decadeAlbums.length }
  })
  return {
    total: albums.length,
    listened,
    remaining: albums.length - listened,
    percentage: albums.length ? Math.round((listened / albums.length) * 100) : 0,
    average: ratings.length ? (ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '—',
    rated: ratings.length,
    distribution,
    topRated,
    topRating: topRated ? progress[topRated.id].rating : null,
    decades,
  }
}
