export default function ChannelHeader({ channel, messageCount, connected }) {
  return (
    <header className="flex h-12 flex-shrink-0 items-center gap-2 border-b border-black/30 px-4 shadow-sm">
      <span className="text-xl text-gray-500">#</span>
      <h1 className="text-[15px] font-semibold text-gray-100">
        {channel ? channel.name : 'no-channel'}
      </h1>
      {channel && (
        <span className="ml-2 hidden border-l border-white/10 pl-3 text-xs text-gray-400 md:block">
          {messageCount === 1 ? '1 message' : `${messageCount} messages`}
        </span>
      )}
      <div className="ml-auto flex items-center gap-1.5 text-xs">
        <span
          className={`h-2 w-2 rounded-full ${connected ? 'bg-[#3ba55c]' : 'animate-pulse bg-[#faa61a]'}`}
        />
        <span className={connected ? 'text-[#3ba55c]' : 'text-[#faa61a]'}>
          {connected ? 'Connected' : 'Connecting...'}
        </span>
      </div>
    </header>
  )
}
