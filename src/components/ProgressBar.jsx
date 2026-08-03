export default function ProgressBar({ value, label, compact = false }) {
  return (
    <div className={compact ? 'progress progress--compact' : 'progress'}>
      {label && <div className="progress__label"><span>{label}</span><strong>{value}%</strong></div>}
      <div className="progress__track" role="progressbar" aria-label={label || 'Progresso'} aria-valuemin="0" aria-valuemax="100" aria-valuenow={value}>
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
