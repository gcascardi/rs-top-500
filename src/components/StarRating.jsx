export default function StarRating({ value = null, onChange, disabled = false, size = 'medium', showLabel = true, label = 'Avaliação' }) {
  const rating = value == null ? null : Number(value)
  return (
    <div className={`star-rating star-rating--${size}`} aria-label={`${label}: ${rating ? `${rating} de 5 estrelas` : 'não avaliado'}`}>
      <div className="star-rating__buttons" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={rating >= star ? 'is-filled' : ''}
            disabled={disabled}
            aria-label={`Avaliar com ${star} de 5 estrelas`}
            aria-pressed={rating === star}
            title={rating === star ? `Remover avaliação de ${star} estrelas` : `${star} de 5 estrelas`}
            onClick={() => onChange(rating === star ? null : star)}
          >★</button>
        ))}
      </div>
      {showLabel && <span className="star-rating__label">{rating ? `${rating} de 5` : 'Não avaliado'}</span>}
      {rating && showLabel && <button type="button" className="star-rating__remove" disabled={disabled} onClick={() => onChange(null)}>Remover avaliação</button>}
    </div>
  )
}
