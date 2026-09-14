export default function ListenLaterButton({ album, state, onUpdate, disabled = false }) {
  return (
    <button
      type="button"
      className={`listen-later-button ${state.listen_later ? 'active' : ''}`}
      aria-pressed={Boolean(state.listen_later)}
      aria-label={`${state.listen_later ? 'Remover' : 'Adicionar'} ${album.title} ${state.listen_later ? 'de' : 'a'} Ouvir depois`}
      disabled={disabled}
      onClick={() => onUpdate(album.id, { listen_later: !state.listen_later })}
    >
      {state.listen_later ? '♥ Ouvir depois' : '♡ Ouvir depois'}
    </button>
  )
}
