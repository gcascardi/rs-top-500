import { useEffect, useRef } from 'react'
import FeaturedAlbum from './FeaturedAlbum'

export default function AlbumDetailPanel({ album, state, onUpdate, onView, onClose, saving }) {
  const panelRef = useRef(null)

  useEffect(() => {
    panelRef.current?.focus()
    const closeOnEscape = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [album, onClose])

  return (
    <div className="modal-backdrop album-detail-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={panelRef} className="album-detail-panel" tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="album-detail-title">
        <div className="random-panel__heading">
          <div><span className="section-kicker">Detalhes do álbum</span><h2 id="album-detail-title">Em destaque</h2></div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar detalhes do álbum">×</button>
        </div>
        <FeaturedAlbum {...{ album, state, onUpdate, onView, saving }} />
      </section>
    </div>
  )
}
