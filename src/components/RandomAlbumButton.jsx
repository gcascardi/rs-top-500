export default function RandomAlbumButton({ onDraw, onlyUnlistened, onPreferenceChange, disabled }) {
  return (
    <div className="random-control">
      <button type="button" className="button button--red" onClick={onDraw} disabled={disabled}>✦ Sortear álbum</button>
      <label>
        <input type="checkbox" checked={onlyUnlistened} onChange={(event) => onPreferenceChange(event.target.checked)} />
        Somente não ouvidos
      </label>
    </div>
  )
}
