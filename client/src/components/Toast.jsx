const STYLES = {
  info: 'bg-gray-800 border-gray-700 text-gray-200',
  success: 'bg-green-950 border-green-800 text-green-300',
  error: 'bg-red-950 border-red-800 text-red-300',
}

export default function ToastContainer({ toasts }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`animate-fade-in-up border rounded-lg px-4 py-3 text-sm shadow-lg ${STYLES[t.type] || STYLES.info}`}>
          {t.message}
        </div>
      ))}
    </div>
  )
}