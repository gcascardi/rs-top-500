import { useEffect, useRef } from 'react'
import FeaturedAlbum from './FeaturedAlbum'

export default function RandomAlbumPanel({ album, state, onUpdate, onView, onDrawAgain, onClose, onResetFilters, saving, usedFallback }) {
  const panelRef = useRef(null)
  useEffect(() => {
    panelRef.current?.focus()
    const closeOnEscape = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [album, onClose])

  return (
    <section ref={panelRef} className="random-panel" tabIndex="-1" aria-labelledby="random-title" aria-live="polite">
      <div className="random-panel__heading">
        <div><span className="section-kicker">Álbum sorteado</span><h2 id="random-title">Sua próxima escuta</h2></div>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar álbum sorteado">×</button>
      </div>
      {album ? (
        <>
          <p className="sr-only" role="status">Álbum sorteado.</p>
          {usedFallback && <p className="random-note">Todos os resultados filtrados já foram ouvidos; o sorteio considerou todos eles.</p>}
          <FeaturedAlbum {...{ album, state, onUpdate, onView, saving }} />
          <button className="button button--dark random-again" onClick={onDrawAgain}>✦ Sortear outro</button>
        </>
      ) : (
        <div className="random-empty"><p>Nenhum álbum disponível para o sorteio com os filtros atuais.</p><button className="button button--dark" onClick={onResetFilters}>Limpar filtros</button></div>
      )}
    </section>
  )
}
