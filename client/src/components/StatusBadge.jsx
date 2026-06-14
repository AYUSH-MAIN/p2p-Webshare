const CONFIG = {
  idle:         { label: 'Idle',         dot: 'bg-gray-500',                 text: 'text-gray-400',   bg: 'bg-gray-800' },
  waiting:      { label: 'Waiting',      dot: 'bg-amber-400 animate-pulse',  text: 'text-amber-300',  bg: 'bg-amber-950' },
  connecting:   { label: 'Connecting',   dot: 'bg-amber-400 animate-pulse',  text: 'text-amber-300',  bg: 'bg-amber-950' },
  transferring: { label: 'Transferring', dot: 'bg-violet-400 animate-pulse', text: 'text-violet-300', bg: 'bg-violet-950' },
  done:         { label: 'Done',         dot: 'bg-green-400',                text: 'text-green-300',  bg: 'bg-green-950' },
  disconnected: { label: 'Disconnected', dot: 'bg-red-400',                  text: 'text-red-300',    bg: 'bg-red-950' },
  error:        { label: 'Error',        dot: 'bg-red-400',                  text: 'text-red-300',    bg: 'bg-red-950' },
}

export default function StatusBadge({ phase }) {
  const c = CONFIG[phase] || CONFIG.idle
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}