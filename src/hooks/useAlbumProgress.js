import { useCallback, useEffect, useRef, useState } from 'react'
import { hasLocalProgress, loadLocalProgress, saveLocalProgress } from '../lib/storage'
import { isSupabaseConfigured } from '../lib/supabase'
import { loadProgress, saveAlbumProgress, saveProgressBatch } from '../services/progressService'
import { normalizeRating } from '../utils/rating'
import { buildAlbumProgress, buildBatchProgress, emptyProgress } from '../utils/progressState'

function normalizeProgress(item) {
  return {
    listened: Boolean(item.listened),
    rating: normalizeRating(item.rating),
    listened_at: item.listened_at ?? null,
    updated_at: item.updated_at ?? null,
  }
}

function toPayload(albumId, state) {
  return {
    album_id: Number(albumId),
    listened: Boolean(state.listened),
    rating: state.rating ?? null,
    listened_at: state.listened ? state.listened_at : null,
    updated_at: state.updated_at,
  }
}

export function useAlbumProgress() {
  const [progress, setProgress] = useState(() => isSupabaseConfigured ? {} : loadLocalProgress())
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [saveState, setSaveState] = useState('idle')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [canImport, setCanImport] = useState(false)
  const [savingIds, setSavingIds] = useState(new Set())
  const timer = useRef()
  const savingAlbums = useRef(new Set())
  const savingBatch = useRef(false)

  const showState = useCallback((state, nextMessage = '') => {
    setSaveState(state)
    setMessage(nextMessage)
    clearTimeout(timer.current)
    if (state !== 'saving') timer.current = setTimeout(() => setSaveState('idle'), 2200)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true
    loadProgress()
      .then((rows) => {
        if (!active) return
        setProgress(Object.fromEntries(rows.map((item) => [item.album_id, normalizeProgress(item)])))
        setSaveState('idle')
      })
      .catch(() => {
        if (!active) return
        setError('Não foi possível carregar o progresso. Você ainda pode consultar a lista.')
      })
      .finally(() => {
        if (!active) return
        setCanImport(hasLocalProgress())
        setLoading(false)
      })
    return () => { active = false }
  }, [showState])

  const updateAlbum = useCallback(async (albumId, patch) => {
    if (savingBatch.current || savingAlbums.current.has(albumId)) return false
    const previous = { ...emptyProgress, ...(progress[albumId] || {}) }
    const now = new Date().toISOString()
    const nextState = buildAlbumProgress(previous, patch, now)
    const nextProgress = { ...progress, [albumId]: nextState }
    setProgress(nextProgress)
    showState('saving', 'Salvando…')
    savingAlbums.current.add(albumId)
    setSavingIds((current) => new Set(current).add(albumId))

    try {
      if (isSupabaseConfigured) await saveAlbumProgress(toPayload(albumId, nextState))
      else saveLocalProgress(nextProgress)
      const successMessage = Object.hasOwn(patch, 'rating')
        ? patch.rating == null ? 'Avaliação removida.' : 'Avaliação salva.'
        : patch.listened ? 'Álbum marcado como ouvido.' : 'Progresso salvo.'
      showState('saved', successMessage)
      return true
    } catch {
      setProgress((current) => ({ ...current, [albumId]: previous }))
      setError('Não foi possível salvar a alteração.')
      showState('error', 'Não foi possível salvar a alteração.')
      return false
    } finally {
      savingAlbums.current.delete(albumId)
      setSavingIds((current) => {
        const next = new Set(current)
        next.delete(albumId)
        return next
      })
    }
  }, [progress, showState])

  const bulkUpdate = useCallback(async (albumIds, listened) => {
    if (savingBatch.current || savingAlbums.current.size > 0 || albumIds.length === 0) return false
    const previousStates = Object.fromEntries(albumIds.map((id) => [id, { ...emptyProgress, ...(progress[id] || {}) }]))
    const now = new Date().toISOString()
    const changes = buildBatchProgress(progress, albumIds, listened, now)
    const nextProgress = { ...progress, ...changes }
    setProgress(nextProgress)
    showState('saving', 'Salvando…')
    savingBatch.current = true

    try {
      if (isSupabaseConfigured) await saveProgressBatch(Object.entries(changes).map(([id, state]) => toPayload(id, state)))
      else saveLocalProgress(nextProgress)
      showState('saved', 'Progresso salvo.')
      return true
    } catch {
      setProgress((current) => ({ ...current, ...previousStates }))
      setError('Não foi possível salvar a alteração.')
      showState('error', 'Não foi possível salvar a alteração.')
      return false
    } finally {
      savingBatch.current = false
    }
  }, [progress, showState])

  const importLocal = useCallback(async () => {
    const local = loadLocalProgress()
    const now = new Date().toISOString()
    const imported = Object.fromEntries(Object.entries(local).map(([id, state]) => [id, {
      ...emptyProgress,
      ...state,
      listened_at: state.listened ? (state.listened_at || now) : null,
      updated_at: now,
    }]))
    showState('saving', 'Salvando…')
    try {
      await saveProgressBatch(Object.entries(imported).map(([id, state]) => toPayload(id, state)))
      setProgress((current) => ({ ...current, ...imported }))
      setCanImport(false)
      showState('saved', 'Progresso salvo.')
      return true
    } catch {
      setError('Não foi possível importar o progresso local.')
      showState('error', 'Não foi possível salvar a alteração.')
      return false
    }
  }, [showState])

  return {
    progress, loading, saveState, message, error, canImport, savingIds, updateAlbum, bulkUpdate, importLocal,
    dismissImport: () => setCanImport(false),
  }
}
