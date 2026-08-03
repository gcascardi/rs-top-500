import { isSupabaseConfigured, supabase } from '../lib/supabase'

export async function loadProgress() {
  if (!isSupabaseConfigured) return []

  const { data, error } = await supabase
    .from('album_progress')
    .select('album_id, listened, rating, listened_at, updated_at')

  if (error) {
    console.error('Erro ao carregar progresso do Supabase:', error)
    throw new Error('progress-load-failed')
  }

  return data || []
}

export async function saveAlbumProgress(progress) {
  if (!isSupabaseConfigured) return

  const { error } = await supabase
    .from('album_progress')
    .upsert(progress, { onConflict: 'album_id' })

  if (error) {
    console.error('Erro ao salvar progresso no Supabase:', error)
    throw new Error('progress-save-failed')
  }
}

export async function saveProgressBatch(progressList) {
  if (!isSupabaseConfigured || progressList.length === 0) return

  const { error } = await supabase
    .from('album_progress')
    .upsert(progressList, { onConflict: 'album_id' })

  if (error) {
    console.error('Erro ao salvar progresso em lote no Supabase:', error)
    throw new Error('progress-batch-save-failed')
  }
}
