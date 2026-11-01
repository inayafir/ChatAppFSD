export default function Avatar({ name, color, size = 'md' }) {
  const sizes = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-12 w-12 text-lg',
  }
  const initial = (name || '?').trim().charAt(0).toUpperCase()

  return (
    <span
      className={`inline-flex flex-shrink-0 select-none items-center justify-center rounded-full font-semibold text-white shadow-sm ${sizes[size]}`}
      style={{ backgroundColor: color || '#5865F2' }}
      aria-hidden="true"
    >
      {initial}
    </span>
  )
}
