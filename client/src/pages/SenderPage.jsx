import { useRef, useState } from 'react'
import { socket } from '../socket'
import { createPC, sendFile } from '../utils/peer'
import { useToast } from '../utils/toast'
import { getFileIcon } from '../utils/fileIcon'
import DropZone from '../components/DropZone'
import ProgressBar from '../components/ProgressBar'
import StatusBadge from '../components/StatusBadge'
import ToastContainer from '../components/Toast'

export default function SenderPage() {
  const [phase, setPhase] = useState('idle')
  const [roomId, setRoomId] = useState('')
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState('0')
  const [copied, setCopied] = useState(false)
  const pcRef = useRef(null)
  const { toasts, showToast } = useToast()

  const shareLink = roomId ? `${window.location.origin}/#${roomId}` : ''

  function handleFile(f) {
    setFile(f)
    setPhase('waiting')
    socket.disconnect()
    socket.connect()

    socket.once('connect', () => {
      socket.emit('create-room', { name: f.name, size: f.size, mime: f.type }, ({ roomId: id }) => {
        setRoomId(id)
        showToast('Room created — share the link!', 'success')

        socket.on('peer-joined', async () => {
          setPhase('transferring')
          showToast('Receiver connected — sending file...', 'info')
          const pc = createPC()
          pcRef.current = pc
          pc.onicecandidate = ({ candidate }) => {
            if (candidate) socket.emit('signal', { roomId: id, data: { type: 'candidate', candidate } })
          }
          await sendFile(pc, f, (pct, spd) => { setProgress(pct); setSpeed(spd) }, () => {
            setPhase('done')
            showToast('Transfer complete!', 'success')
          })
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          socket.emit('signal', { roomId: id, data: { type: 'offer', sdp: pc.localDescription } })
        })

        socket.on('signal', async ({ data }) => {
          const pc = pcRef.current; if (!pc) return
          if (data.type === 'answer') await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
          else if (data.type === 'candidate') await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
        })

        socket.on('peer-left', () => {
          setPhase('disconnected')
          showToast('Receiver disconnected', 'error')
        })
      })
    })
  }

  function copyLink() {
    navigator.clipboard.writeText(shareLink).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = shareLink; document.body.appendChild(ta); ta.select()
      document.execCommand('copy'); document.body.removeChild(ta)
    })
    setCopied(true)
    showToast('Link copied to clipboard', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen glow-bg text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">

      <div className="text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card text-xs font-semibold tracking-wide text-violet-300 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          DIRECT · ENCRYPTED · SERVERLESS
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
          P2P WebShare
        </h1>
        <p className="text-gray-400 mt-3 text-sm">
          Send files directly, browser-to-browser. Nothing is uploaded or stored.
        </p>
      </div>

        <DropZone onFile={handleFile} onError={(msg) => showToast(msg, 'error')} disabled={phase !== 'idle'} />

        {file && (
          <div className="glass-card rounded-xl p-4 flex items-center gap-3 animate-fade-in-up">
            <span className="text-2xl">{getFileIcon(file.name)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <StatusBadge phase={phase} />
          </div>
        )}

        {roomId && phase !== 'done' && (
          <div className="bg-gray-900 border border-violet-800/50 rounded-xl p-4 space-y-3 animate-fade-in-up">
            <p className="text-xs text-violet-400 uppercase tracking-wider font-medium">
              📎 Share this link with the receiver
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareLink}
                onClick={e => e.target.select()}
                className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-100 outline-none border border-gray-600 truncate font-mono"
              />
              <button
                onClick={copyLink}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 active:scale-95 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-gray-500 font-mono">Room: {roomId}</p>
          </div>
        )}

        {phase === 'waiting' && !roomId && (
          <p className="text-center text-sm text-gray-400 animate-pulse">Connecting to server...</p>
        )}
        {phase === 'waiting' && roomId && (
          <div className="text-center text-sm text-gray-400 flex items-center justify-center gap-2 animate-fade-in-up">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            Waiting for receiver to open the link
          </div>
        )}

        {(phase === 'transferring' || phase === 'done') && (
          <ProgressBar progress={progress} speed={speed} label={phase === 'done' ? 'Sent!' : 'Sending...'} />
        )}

        {phase === 'done' && (
          <div className="bg-green-950 border border-green-800 rounded-xl p-5 text-center animate-pop-in">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-green-400 font-medium">Transfer complete!</p>
            <p className="text-green-600 text-sm mt-1">Receiver's download started automatically.</p>
            <button onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-green-800 hover:bg-green-700 rounded-lg text-sm transition-colors">
              Send another file
            </button>
          </div>
        )}

        {phase === 'disconnected' && (
          <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-center animate-fade-in-up">
            <p className="text-red-400 font-medium">⚠️ Receiver disconnected</p>
            <button onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-sm transition-colors">
              Start over
            </button>
          </div>
        )}

      </div>
      <ToastContainer toasts={toasts} />
    </div>
  )
}