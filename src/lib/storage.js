const DATA_KEY = 'rstop500-user-data'
const VIEW_KEY = 'rstop500-view'

export function loadLocalProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(DATA_KEY))
    if (!data?.albums || ![1, 2].includes(data.version)) return {}
    const migrateRating = data.version === 1 ? convertLegacyRating : normalizeRating
    const albums = Object.fromEntries(Object.entries(data.albums).map(([id, state]) => [id, {
      ...state,
      listened: Boolean(state.listened),
      rating: migrateRating(state.rating),
    }]))
    if (data.version === 1) localStorage.setItem(DATA_KEY, JSON.stringify({ version: 2, albums, migratedFromVersion: 1 }))
    return albums
  } catch {
    return {}
  }
}

export function saveLocalProgress(albums) {
  localStorage.setItem(DATA_KEY, JSON.stringify({ version: 2, albums }))
}

export function hasLocalProgress() {
  return Object.keys(loadLocalProgress()).length > 0
}

export function clearLocalProgress() {
  localStorage.removeItem(DATA_KEY)
}

export function loadView() {
  return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid'
}

export function saveView(view) {
  localStorage.setItem(VIEW_KEY, view)
}
import { convertLegacyRating, normalizeRating } from '../utils/rating.js'
