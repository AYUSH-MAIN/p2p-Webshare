import { sha256 } from './hash'

const CHUNK_SIZE = 64 * 1024
const BUFFER_THRESHOLD = 256 * 1024

const ICE = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export function createPC() {
  return new RTCPeerConnection(ICE)
}

export async function sendFile(pc, file, onProgress, onDone) {
  const buf = await file.arrayBuffer()
  const hash = await sha256(buf)

  const dc = pc.createDataChannel('ft', { ordered: true })

  dc.onopen = () => {
    console.log('[DC] open')
    dc.send(JSON.stringify({ type: 'meta', name: file.name, size: file.size, mime: file.type, hash }))
    let offset = 0, lastT = Date.now(), lastOff = 0

    function next() {
      if (dc.readyState !== 'open') return
      if (dc.bufferedAmount > BUFFER_THRESHOLD) { setTimeout(next, 30); return }
      if (offset >= buf.byteLength) { dc.send(JSON.stringify({ type: 'done' })); onDone(); return }
      const chunk = buf.slice(offset, offset + CHUNK_SIZE)
      dc.send(chunk)
      offset += chunk.byteLength
      const now = Date.now(), elapsed = (now - lastT) / 1000
      if (elapsed >= 0.5) {
        onProgress(Math.round(offset / buf.byteLength * 100), ((offset - lastOff) / elapsed / 1024 / 1024).toFixed(2))
        lastT = now; lastOff = offset
      }
      setTimeout(next, 0)
    }
    next()
  }
  dc.onerror = e => console.error('[DC sender]', e)
}

export function receiveFile(pc, onProgress, onDone) {
  pc.ondatachannel = ({ channel: dc }) => {
    let meta = null, chunks = [], received = 0, lastT = Date.now(), lastR = 0

    dc.onmessage = async ({ data }) => {
      if (typeof data === 'string') {
        const msg = JSON.parse(data)
        if (msg.type === 'meta') { meta = msg; return }
        if (msg.type === 'done') {
          const all = await new Blob(chunks).arrayBuffer()
          const h = await sha256(all)
          console.log(h === meta.hash ? '[RX] hash OK ✓' : '[RX] HASH MISMATCH ✗')
          const blob = new Blob(chunks, { type: meta.mime })
          const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: meta.name })
          document.body.appendChild(a); a.click(); document.body.removeChild(a)
          setTimeout(() => URL.revokeObjectURL(a.href), 5000)
          onDone(meta.name)
        }
      } else {
        chunks.push(data); received += data.byteLength
        const now = Date.now(), elapsed = (now - lastT) / 1000
        if (elapsed >= 0.5 && meta) {
          onProgress(Math.round(received / meta.size * 100), ((received - lastR) / elapsed / 1024 / 1024).toFixed(2))
          lastT = now; lastR = received
        }
      }
    }
  }
}