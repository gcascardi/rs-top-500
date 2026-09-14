import test from 'node:test'
import assert from 'node:assert/strict'
import { buildAlbumProgress, buildBatchProgress } from '../src/utils/progressState.js'
import { filterAndSortAlbums, initialFilters } from '../src/utils/albumFilters.js'
import { loadLocalProgress, saveLocalProgress } from '../src/lib/storage.js'

const now = '2026-09-14T12:00:00Z'

test('rating marks listened, preserves favorites and keeps the first listening date', () => {
  const saved = buildAlbumProgress({ listen_later: true }, { rating: 4 }, now)
  assert.equal(saved.listened, true)
  assert.equal(saved.listened_at, now)
  assert.equal(saved.listen_later, true)
  const rerated = buildAlbumProgress(saved, { rating: 5 }, '2026-09-15T12:00:00Z')
  assert.equal(rerated.listened_at, now)
  const cleared = buildAlbumProgress(rerated, { rating: null })
  assert.equal(cleared.listened, true)
  assert.equal(cleared.rating, null)
  assert.equal(buildAlbumProgress({}, { rating: null }, now).listened, false)
})

test('favorite toggles and batch listening preserve independent progress', () => {
  const saved = buildAlbumProgress({ rating: 5, listened: true, listened_at: now }, { listen_later: true }, now)
  assert.equal(saved.rating, 5)
  assert.equal(saved.listened_at, now)
  const batch = buildBatchProgress({ 1: saved }, [1], false, now)
  assert.equal(batch[1].listen_later, true)
  assert.equal(batch[1].rating, 5)
  assert.equal(batch[1].listened_at, null)
  assert.equal(buildAlbumProgress(saved, { listen_later: false }).listen_later, false)
})

test('favorites combine with search and listening filters', () => {
  const albums = [1, 2, 3].map((id) => ({ id, position: id, title: `Album ${id}`, artist: 'Artist', genres: [] }))
  const progress = { 1: { listen_later: true }, 2: { listen_later: true, listened: true } }
  const filters = { ...initialFilters, collection: 'listen-later' }
  assert.deepEqual(filterAndSortAlbums(albums, progress, filters).map((a) => a.id), [1, 2])
  assert.deepEqual(filterAndSortAlbums(albums, progress, { ...filters, status: 'unlistened' }).map((a) => a.id), [1])
  assert.deepEqual(filterAndSortAlbums(albums, progress, { ...filters, search: 'Album 2' }).map((a) => a.id), [2])
})

test('local storage retains favorites and loads old records without the flag', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const items = new Map()
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
  } })
  try {
    saveLocalProgress({ 1: { listen_later: true, rating: 4, listened: true }, 2: { rating: null } })
    assert.equal(loadLocalProgress()[1].listen_later, true)
    assert.equal(loadLocalProgress()[2].listen_later, false)
    items.set('rstop500-user-data', JSON.stringify({ version: 1, albums: { 3: { rating: 8, listened: true } } }))
    assert.equal(loadLocalProgress()[3].rating, 4)
    assert.equal(loadLocalProgress()[3].listen_later, false)
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original)
    else delete globalThis.localStorage
  }
})
