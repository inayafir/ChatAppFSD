import Avatar from './Avatar'

export default function OnlineUsers({ users, currentUserId }) {
  return (
    <aside className="hidden w-60 flex-shrink-0 flex-col bg-[#2b2d31] lg:flex">
      <div className="flex h-12 items-center border-b border-black/30 px-4 shadow-sm">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-gray-400">
          Online — {users.length}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {users.length === 0 && (
          <p className="px-2 text-sm text-gray-500">No one is online right now.</p>
        )}
        <ul className="space-y-0.5">
          {users.map((member) => (
            <li
              key={member.id}
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-[#35373c]"
            >
              <div className="relative">
                <Avatar name={member.username} color={member.avatarColor} size="md" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-[#2b2d31] bg-[#3ba55c]" />
              </div>
              <span className="truncate text-sm font-medium text-gray-200">{member.username}</span>
              {member.id === currentUserId && (
                <span className="ml-auto rounded bg-[#5865F2]/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#949cf7]">
                  you
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
