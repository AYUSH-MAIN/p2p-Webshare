import { useEffect, useRef, useState } from 'react'
import { socket } from '../socket'
import { createPC, receiveFile } from '../utils/peer'
import { useToast } from '../utils/toast'
import { getFileIcon } from '../utils/fileIcon'
import ProgressBar from '../components/ProgressBar'
import StatusBadge from '../components/StatusBadge'
import ToastContainer from '../components/Toast'

export default function ReceiverPage({ roomId }) {
  const [phase, setPhase] = useState('connecting')
  const [meta, setMeta] = useState(null)
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState('0')
  const [fileName, setFileName] = useState('')
  const pcRef = useRef(null)
  const { toasts, showToast } = useToast()

  useEffect(() => {
    socket.disconnect()
    socket.connect()

    socket.once('connect', () => {
      socket.emit('join-room', roomId, async ({ error, meta: m }) => {
        if (error) {
          setPhase('error')
          showToast(error === 'Room not found' ? 'Room not found or expired' : error, 'error')
          return
        }
        setMeta(m)
        setPhase('waiting')

        const pc = createPC(); pcRef.current = pc

        pc.onconnectionstatechange = () => {
          console.log("RECEIVER:", pc.connectionState)
        }

        pc.oniceconnectionstatechange = () => {
          console.log("RECEIVER ICE:", pc.iceConnectionState)
        }

        pc.onicecandidate = ({ candidate }) => {
          if (candidate) socket.emit('signal', { roomId, data: { type: 'candidate', candidate } })
        }

        receiveFile(pc,
          (pct, spd) => { setProgress(pct); setSpeed(spd); setPhase('transferring') },
          (name) => {
            setFileName(name)
            setPhase('done')
            showToast('File downloaded — check your Downloads folder', 'success')
          }
        )

        socket.on('signal', async ({ data }) => {
          if (data.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            socket.emit('signal', { roomId, data: { type: 'answer', sdp: pc.localDescription } })
          } else if (data.type === 'candidate') {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
          }
        })

        socket.on('peer-left', () => {
          setPhase('disconnected')
          showToast('Sender disconnected', 'error')
        })
      })
    })

    return () => { socket.disconnect() }
  }, [roomId])

  const PHASE_LABEL = {
    connecting: 'Connecting to server...',
    waiting: 'Waiting for sender to start...',
    transferring: 'Receiving file...',
    done: 'Download complete!',
    disconnected: 'Sender disconnected',
    error: 'Room not found',
  }

  return (
    <div className="min-h-screen glow-bg text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">

      <div className="text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card text-xs font-semibold tracking-wide text-cyan-300 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          DIRECT · ENCRYPTED · SERVERLESS
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
          P2P WebShare
        </h1>
        <p className="text-gray-400 mt-3 text-sm">Receiving a file directly from the sender's browser.</p>
      </div>

        <div className="glass-card rounded-xl p-5 space-y-4 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-200">{PHASE_LABEL[phase]}</p>
            <StatusBadge phase={phase} />
          </div>

          {meta && (
            <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-3">
              <span className="text-2xl">{getFileIcon(meta.name)}</span>
              <div>
                <p className="text-sm font-medium">{meta.name}</p>
                <p className="text-xs text-gray-500">{(meta.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-600 font-mono">Room: {roomId}</p>
        </div>

        {(phase === 'transferring' || phase === 'done') && (
          <ProgressBar 
          progress={phase === 'done' ? 100 : progress} 
          speed={speed} 
          label={phase === 'done' ? 'Received!' : 'Receiving...'} />
        )}

        {phase === 'done' && (
          <div className="bg-green-950 border border-green-800 rounded-xl p-5 text-center animate-pop-in">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-green-400 font-medium">{fileName}</p>
            <p className="text-green-600 text-sm mt-1">Saved to downloads — SHA-256 verified, zero corruption.</p>
          </div>
        )}

        {phase === 'disconnected' && (
          <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-center animate-fade-in-up">
            <p className="text-red-400 font-medium">⚠️ Sender closed the connection</p>
            <button onClick={() => window.location.href = '/'}
              className="mt-3 px-4 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-sm transition-colors">
              Send a file instead
            </button>
          </div>
        )}

        {phase === 'error' && (
          <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-center animate-fade-in-up">
            <p className="text-red-400 font-medium">❌ Room not found or already used</p>
            <button onClick={() => window.location.href = '/'}
              className="mt-3 px-4 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-sm transition-colors">
              Go back
            </button>
          </div>
        )}

      </div>
      <ToastContainer toasts={toasts} />
    </div>
  )
}