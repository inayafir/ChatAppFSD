export default function TypingIndicator({ usernames }) {
  if (usernames.length === 0) {
    return <div className="h-6" />
  }

  let text
  if (usernames.length === 1) {
    text = `${usernames[0]} is typing...`
  } else if (usernames.length === 2) {
    text = `${usernames[0]} and ${usernames[1]} are typing...`
  } else {
    text = 'Several people are typing...'
  }

  return (
    <div className="mx-auto flex h-6 w-full max-w-3xl items-center gap-1.5 px-5 text-xs text-gray-400">
      <span className="flex gap-0.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
      </span>
      <span className="italic">{text}</span>
    </div>
  )
}
