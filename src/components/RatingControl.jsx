import StarRating from './StarRating'

export default function RatingControl({ album, state, onUpdate, disabled = false, size = 'small' }) {
  return (
    <StarRating
      value={state.rating}
      disabled={disabled}
      size={size}
      label={`Avaliação de ${album.title}`}
      onChange={(rating) => onUpdate(album.id, { rating })}
    />
  )
}
