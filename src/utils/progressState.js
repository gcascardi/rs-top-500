import { normalizeRating } from './rating.js'

export const emptyProgress = { listened: false, listen_later: false, rating: null, listened_at: null, updated_at: null }

export function buildAlbumProgress(previousState, patch, now = new Date().toISOString()) {
  const previous = { ...emptyProgress, ...(previousState || {}) }
  const rating = Object.hasOwn(patch, 'rating') ? normalizeRating(patch.rating) : previous.rating
  const listened = Object.hasOwn(patch, 'rating') && rating != null
    ? true
    : patch.listened ?? previous.listened
  return {
    ...previous,
    ...patch,
    listened,
    rating,
    listened_at: listened ? (previous.listened_at || now) : null,
    updated_at: now,
  }
}

export function buildBatchProgress(progress, albumIds, listened, now = new Date().toISOString()) {
  return Object.fromEntries(albumIds.map((id) => {
    const previous = { ...emptyProgress, ...(progress[id] || {}) }
    return [id, {
      ...previous,
      listened,
      rating: previous.rating,
      listened_at: listened ? (previous.listened_at || now) : null,
      updated_at: now,
    }]
  }))
}
