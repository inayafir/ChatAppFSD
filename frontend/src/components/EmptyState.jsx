export default function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#4b4d54]/60 text-3xl text-gray-400">
        {icon}
      </div>
      <p className="text-base font-semibold text-gray-200">{title}</p>
      {subtitle && <p className="mt-1 max-w-xs text-sm text-gray-400">{subtitle}</p>}
    </div>
  )
}
