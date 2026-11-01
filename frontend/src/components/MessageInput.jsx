import { useEffect, useRef, useState } from 'react'

export default function MessageInput({ channel, disabled, onSend, onTyping }) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    setText('')
    const textarea = textareaRef.current
    if (textarea) textarea.style.height = 'auto'
  }, [channel?.id])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [text])

  function submit() {
    const content = text.trim()
    if (!content || disabled) return
    onSend(content)
    setText('')
    const textarea = textareaRef.current
    if (textarea) textarea.style.height = 'auto'
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  function handleChange(event) {
    setText(event.target.value)
    if (event.target.value.trim()) onTyping()
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-5">
      <div className="flex items-end gap-2 rounded-xl bg-[#383a40] px-4 py-2.5 shadow-sm ring-1 ring-black/20 transition focus-within:ring-[#5865F2]/60">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          maxLength={2000}
          placeholder={disabled ? 'Reconnecting to chat...' : `Message #${channel?.name || ''}`}
          className="max-h-40 flex-1 resize-none bg-transparent text-[15px] leading-6 text-gray-100 placeholder-gray-500 outline-none disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !text.trim()}
          title="Send message"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#5865F2] text-sm text-white transition-all hover:bg-[#4752c4] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ➤
        </button>
      </div>
      <p className="mt-1.5 px-1 text-[11px] text-gray-500">
        <kbd className="rounded bg-white/5 px-1 py-0.5">Enter</kbd> to send ·{' '}
        <kbd className="rounded bg-white/5 px-1 py-0.5">Shift + Enter</kbd> for a new line
      </p>
    </div>
  )
}
