export default function EmptyState({ onReset }) {
  return <div className="empty-state"><span>0</span><h2>Nenhum álbum por aqui</h2><p>Tente remover alguns filtros ou buscar por outro termo.</p><button className="button button--dark" onClick={onReset}>Limpar filtros</button></div>
}
