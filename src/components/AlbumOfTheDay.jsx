import FeaturedAlbum from './FeaturedAlbum'

export default function AlbumOfTheDay({ album, state, onUpdate, onView, saving }) {
  if (!album) return null
  return (
    <section className="album-of-day" aria-labelledby="album-day-title">
      <div className="album-of-day__heading"><span className="section-kicker">Descoberta diária</span><h2 id="album-day-title">Álbum do dia</h2><p>A escolha muda à meia-noite, no seu horário local.</p></div>
      <FeaturedAlbum {...{ album, state, onUpdate, onView, saving }} />
    </section>
  )
}
