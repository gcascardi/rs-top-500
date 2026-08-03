export default function Pagination({ page, totalPages, totalItems, pageSize, onChange }) {
  if (totalPages <= 1) return null
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)
  return (
    <nav className="pagination" aria-label="Paginação dos álbuns">
      <p>Exibindo <strong>{start}–{end}</strong> de <strong>{totalItems}</strong></p>
      <div className="pagination__controls">
        <button type="button" className="button button--outline" disabled={page === 1} onClick={() => onChange(page - 1)}>← Anterior</button>
        <span>Página <strong>{page}</strong> de {totalPages}</span>
        <button type="button" className="button button--outline" disabled={page === totalPages} onClick={() => onChange(page + 1)}>Próxima →</button>
      </div>
    </nav>
  )
}
