export default function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-gray-400">
      <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-gray-600 border-t-[#5865F2]" />
      <span className="text-xs tracking-wide">{label}</span>
    </div>
  )
}
