import { useEffect, useState } from 'react'
import SenderPage from './pages/SenderPage'
import ReceiverPage from './pages/ReceiverPage'

function getRoomIdFromHash() {
  const hash = window.location.hash.replace('#', '').trim()
  return hash.length > 0 ? hash : null
}

export default function App() {
  const [roomId, setRoomId] = useState(getRoomIdFromHash)

  useEffect(() => {
    const onHashChange = () => setRoomId(getRoomIdFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return roomId ? <ReceiverPage roomId={roomId} /> : <SenderPage />
}