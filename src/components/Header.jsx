import ProgressBar from './ProgressBar'

export default function Header({ stats, configured }) {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="RS Top 500 — início"><span>RS</span> TOP 500</a>
      <div className="header-edition">500 álbuns essenciais <i>•</i> edição experimental</div>
      <div className="header-progress" aria-label={`${stats.percentage}% concluído`}>
        <span>{stats.listened} de {stats.total || 10} nesta amostra</span>
        <ProgressBar value={stats.percentage} compact />
      </div>
      <div className="button button--dark database-status" aria-label={configured ? 'Progresso conectado ao banco' : 'Progresso em modo local'}>
        {configured ? 'Banco conectado' : 'Modo local'}
      </div>
    </header>
  )
}
