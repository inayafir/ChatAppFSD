import Avatar from './Avatar'

export default function ChannelSidebar({
  channels,
  activeChannelId,
  onSelectChannel,
  onCreateClick,
  onDeleteChannel,
  loading,
  user,
  onLogout,
}) {
  return (
    <aside className="flex w-60 flex-shrink-0 flex-col bg-[#2b2d31]">
      <div className="flex h-12 items-center justify-between border-b border-black/30 px-4 shadow-sm">
        <span className="text-[15px] font-semibold tracking-tight text-gray-100">ChatApp</span>
        <button
          type="button"
          onClick={onCreateClick}
          title="Create channel"
          className="flex h-6 w-6 items-center justify-center rounded-md bg-[#5865F2] text-sm font-bold text-white shadow-sm transition-all hover:bg-[#4752c4] active:scale-95"
        >
          +
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p className="mb-1 px-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Channels
        </p>

        {loading && <p className="px-2 py-1 text-sm text-gray-500">Loading channels...</p>}

        {!loading && channels.length === 0 && (
          <p className="px-2 py-1 text-sm text-gray-500">No channels yet. Create one!</p>
        )}

        <ul className="space-y-0.5">
          {channels.map((channel) => {
            const active = channel.id === activeChannelId
            return (
              <li key={channel.id}>
                <button
                  type="button"
                  onClick={() => onSelectChannel(channel.id)}
                  className={`group flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                    active
                      ? 'bg-[#404249] text-white'
                      : 'text-[#949ba4] hover:bg-[#35373c] hover:text-gray-100'
                  }`}
                >
                  <span className="text-gray-500">#</span>
                  <span className="flex-1 truncate">{channel.name}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    title={`Delete #${channel.name}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onDeleteChannel(channel)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.stopPropagation()
                        onDeleteChannel(channel)
                      }
                    }}
                    className="hidden h-5 w-5 flex-shrink-0 items-center justify-center rounded text-[#f23f43] hover:bg-[#35373c] group-hover:flex"
                  >
                    ✕
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="flex items-center gap-2.5 border-t border-black/30 bg-[#232428] px-3 py-2.5">
        <Avatar name={user.username} color={user.avatarColor} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-100">{user.username}</p>
          <p className="text-[11px] text-[#3ba55c]">Online</p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          title="Log out"
          className="rounded-md px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-100"
        >
          Log out
        </button>
      </div>
    </aside>
  )
}
