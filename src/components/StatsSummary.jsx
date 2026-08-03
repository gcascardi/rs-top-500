import ProgressBar from './ProgressBar'

export default function StatsSummary({ stats }) {
  return (
    <section className="stats" aria-labelledby="stats-title">
      <div className="section-kicker" id="stats-title">Seu panorama</div>
      <div className="stats__grid">
        <div><strong>{stats.listened}</strong><span>ouvidos</span></div>
        <div><strong>{stats.remaining}</strong><span>restantes</span></div>
        <div><strong>{stats.average === '—' ? '—' : `${stats.average} de 5`}</strong><span>média das estrelas</span></div>
        <div><strong>{stats.rated}</strong><span>avaliados</span></div>
      </div>
      <div className="rating-breakdown" aria-label="Distribuição das avaliações">
        {[5, 4, 3, 2, 1].map((star) => <span key={star}><b>{star}★</b> {stats.distribution[star]}</span>)}
        <span className="top-rated"><b>Mais bem avaliado</b> {stats.topRated ? `#${stats.topRated.position} ${stats.topRated.title} · ${stats.topRating}★` : 'Nenhum ainda'}</span>
      </div>
      <div className="decades">
        <h3>Progresso por década</h3>
        <div className="decades__items">
          {stats.decades.map(({ decade, listened, total }) => (
            <div key={decade} className="decade-row">
              <span>{decade}s</span>
              <ProgressBar value={Math.round((listened / total) * 100)} compact />
              <b>{listened}/{total}</b>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
