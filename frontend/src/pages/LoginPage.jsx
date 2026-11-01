import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { login } from '../api/chatApi'
import { extractErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const COLORS = ['#5865F2', '#3ba55c', '#faa61a', '#ed4245', '#eb459e', '#9b59b6', '#1abc9c', '#e67e22']

export default function LoginPage() {
  const { user, setUser } = useAuth()
  const showToast = useToast()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    document.title = 'ChatApp — Login'
  }, [])

  if (user) {
    return <Navigate to="/chat" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const name = username.trim()
    if (name.length < 3 || submitting) return

    setSubmitting(true)
    try {
      const loggedUser = await login(name, color)
      setUser(loggedUser)
      navigate('/chat', { replace: true })
    } catch (error) {
      showToast(extractErrorMessage(error))
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-full items-center justify-center bg-[#313338] p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#2b2d31] p-7 shadow-2xl ring-1 ring-black/30">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5865F2] text-2xl shadow-lg shadow-[#5865F2]/30">
            💬
          </div>
          <h1 className="text-xl font-bold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-400">Sign in to start chatting</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-300">
              Username
            </label>
            <input
              id="username"
              autoFocus
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="e.g. alex"
              maxLength={20}
              className="w-full rounded-lg bg-[#1e1f22] px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-500 outline-none ring-1 ring-black/30 transition focus:ring-[#5865F2]/70"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              No password needed. 3-20 characters; existing names log back in.
            </p>
          </div>

          <div>
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-300">
              Avatar color
            </span>
            <div className="flex flex-wrap gap-2.5">
              {COLORS.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => setColor(swatch)}
                  aria-label={`Color ${swatch}`}
                  className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                    color === swatch
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-[#2b2d31]'
                      : 'ring-1 ring-black/30'
                  }`}
                  style={{ backgroundColor: swatch }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={username.trim().length < 3 || submitting}
            className="w-full rounded-lg bg-[#5865F2] py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#5865F2]/25 transition-all hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-gray-500">
          Mini project demo — usernames are not verified.
        </p>
      </div>
    </div>
  )
}
