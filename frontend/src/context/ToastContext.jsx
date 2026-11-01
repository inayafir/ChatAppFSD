import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)
let nextId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  const dismissToast = useCallback((id) => {
    delete timersRef.current[id]
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (message, type = 'error') => {
      const id = nextId++
      setToasts((current) => [...current, { id, message, type }])
      timersRef.current[id] = setTimeout(() => dismissToast(id), 4000)
    },
    [dismissToast],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-lg px-4 py-3 text-sm shadow-lg ring-1 backdrop-blur transition-all animate-[toast-in_0.2s_ease-out] ${
              toast.type === 'error'
                ? 'bg-[#3a1f22]/95 text-[#ffb4b4] ring-red-500/40'
                : 'bg-[#1e3a2f]/95 text-[#a9e5c2] ring-emerald-500/40'
            }`}
          >
            <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-current opacity-80" />
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-current opacity-50 transition-opacity hover:opacity-100"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used inside a ToastProvider')
  }
  return context.showToast
}
