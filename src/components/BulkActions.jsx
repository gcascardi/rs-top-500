export default function BulkActions({ active, setActive, selectedIds, visibleIds, onToggle, onSave, pending, setPending }) {
  if (!active) return <button className="button button--outline bulk-trigger" onClick={() => setActive(true)}>Seleção múltipla</button>
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
  return (
    <aside className="bulk-bar" aria-label="Ações em lote">
      <strong>{selectedIds.size} selecionado{selectedIds.size === 1 ? '' : 's'}</strong>
      <button onClick={() => onToggle(allSelected ? [] : visibleIds)}>{allSelected ? 'Desmarcar todos' : 'Selecionar visíveis'}</button>
      <label>Ação<select value={pending} onChange={(event) => setPending(event.target.value)}><option value="listened">Marcar como ouvidos</option><option value="unlistened">Marcar como não ouvidos</option></select></label>
      <button className="button button--red" disabled={!selectedIds.size} onClick={onSave}>Salvar alterações</button>
      <button className="text-button" onClick={() => setActive(false)}>Cancelar</button>
    </aside>
  )
}
