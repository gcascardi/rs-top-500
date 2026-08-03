export function pickRandomAlbum(albums, progress, onlyUnlistened, recentIds = []) {
  if (!albums.length) return { album: null, usedFallback: false }
  const unlistened = albums.filter((album) => !progress[album.id]?.listened)
  const preferred = onlyUnlistened && unlistened.length ? unlistened : albums
  const blocked = new Set(recentIds.slice(-5))
  const withoutRecent = preferred.filter((album) => !blocked.has(album.id))
  const candidates = withoutRecent.length ? withoutRecent : preferred.length > 1
    ? preferred.filter((album) => album.id !== recentIds.at(-1))
    : preferred
  return {
    album: candidates[Math.floor(Math.random() * candidates.length)] || null,
    usedFallback: onlyUnlistened && unlistened.length === 0,
  }
}

function hashDate(value) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function albumOfTheDay(albums, date = new Date()) {
  if (!albums.length) return null
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  return albums[hashDate(key) % albums.length]
}
