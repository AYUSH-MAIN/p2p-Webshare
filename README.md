# P2P WebShare

Direct browser-to-browser file sharing using WebRTC DataChannels. No file ever touches a server — only a lightweight signaling server coordinates the initial handshake.

## Live Demo
- DEPLOYED LINK :  https://p2p-webshare-chi.vercel.app

## Features
- Drag-and-drop file upload (max 50MB)
- Auto-generated shareable room link
- WebRTC signaling handshake via Socket.io
- Direct P2P file transfer over DataChannels
- SHA-256 hash verification (zero data corruption guarantee)
- Real-time progress %, transfer speed (MB/s), and connection status
- Graceful disconnect handling with UI notifications
- Auto-download on receiver side once transfer completes

## Tech Stack
**Frontend:** React, Vite, TailwindCSS
**Backend:** Node.js, Express, Socket.io
**P2P Layer:** WebRTC DataChannels (STUN + TURN via Open Relay Project)
**Deployment:** Vercel (frontend), Render (backend)

## How It Works
1. Sender drops a file → client computes SHA-256 hash → emits `create-room` to signaling server
2. Server generates a unique room ID and returns it
3. Sender shares the link (`/#roomId`) with the receiver
4. Receiver opens the link → joins the room → both peers exchange WebRTC offer/answer/ICE candidates via the signaling server
5. Once the P2P connection is established, the signaling server is no longer involved
6. File is chunked (64KB) and streamed directly over the DataChannel
7. Receiver reassembles chunks, verifies SHA-256 hash, and triggers an automatic download

## Local Setup

### Backend
```bash
cd server
npm install
npm run dev
```
**Backend (`server`)**
Runs on `http://localhost:3001`

### Frontend
```bash
cd client
npm install
npm run dev
```
**Frontend (`client`)**
Runs on `http://localhost:5173`


## Deployment

- **Backend (Render):** Root directory `server`, build `npm install`, start `npm start`
- **Frontend (Vercel):** Root directory `client`, framework Vite, set `VITE_SERVER_URL` to the Render URL
- Set `CLIENT_URL` on Render to the Vercel production URL after frontend deploy

## Known Limitations
- File size capped at 50MB (browser memory constraint for this MVP)
- Render free tier sleeps after inactivity — first connection may take 30-60s to wake up
- Single sender-to-single receiver per room (no multi-peer mesh)

## Future Improvements
- End-to-end AES-GCM encryption with key passed via URL fragment
- Multi-peer mesh support for swarm-style downloads
- Resume support for interrupted transfers using IndexedDB/OPFS
