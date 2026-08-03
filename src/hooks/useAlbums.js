import { useEffect, useState } from 'react'

export function useAlbums() {
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetch(`${import.meta.env.BASE_URL}albums.json`)
      .then((response) => {
        if (!response.ok) throw new Error('Não foi possível carregar a lista.')
        return response.json()
      })
      .then((data) => active && setAlbums(data))
      .catch(() => active && setError('Não conseguimos carregar os álbuns. Tente atualizar a página.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  return { albums, loading, error }
}
