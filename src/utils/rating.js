export function normalizeRating(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  return Math.max(1, Math.min(5, Math.round(parsed)))
}

export function convertLegacyRating(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  if (parsed <= 0) return 1
  return Math.max(1, Math.min(5, Math.round(parsed / 2)))
}
