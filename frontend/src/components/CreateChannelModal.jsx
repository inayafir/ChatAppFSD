import { useState } from 'react'
import Modal from './Modal'
import { createChannel } from '../api/chatApi'
import { extractErrorMessage } from '../api/client'
import { useToast } from '../context/ToastContext'

const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/

export default function CreateChannelModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const showToast = useToast()

  const normalized = name.trim().toLowerCase()
  const invalid = normalized.length > 0 && !NAME_PATTERN.test(normalized)
  const canSubmit = normalized.length >= 2 && !invalid && !submitting

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const channel = await createChannel(normalized)
      onCreated(channel)
      onClose()
    } catch (error) {
      showToast(extractErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Create a channel" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="channel-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-300">
            Channel name
          </label>
          <div className="flex items-center rounded-lg bg-[#1e1f22] px-3 ring-1 ring-black/30 transition focus-within:ring-[#5865F2]/70">
            <span className="select-none text-gray-500">#</span>
            <input
              id="channel-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value.toLowerCase())}
              placeholder="new-channel"
              maxLength={30}
              className="w-full bg-transparent px-2 py-2.5 text-sm text-gray-100 placeholder-gray-500 outline-none"
            />
          </div>
          <p className={`mt-1.5 text-xs ${invalid ? 'text-[#f23f43]' : 'text-gray-500'}`}>
            {invalid
              ? 'Only lowercase letters, numbers and dashes.'
              : '2-30 characters: lowercase letters, numbers, dashes.'}
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-md bg-[#5865F2] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create channel'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
