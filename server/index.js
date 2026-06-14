const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'] },
});

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const rooms = {};

io.on('connection', (socket) => {
  console.log('[+] Connected:', socket.id);

  socket.on('create-room', (meta, callback) => {
    const roomId = uuidv4().slice(0, 8);
    rooms[roomId] = { sender: socket.id, receiver: null, meta };
    socket.join(roomId);
    console.log('[Room] Created:', roomId, 'by', socket.id);
    callback({ roomId });
  });

  socket.on('join-room', (roomId, callback) => {
    const room = rooms[roomId];
    if (!room) return callback({ error: 'Room not found' });
    if (room.receiver && room.reciever !== socket.id) {
      return callback({ error: 'Room is full' });
    }
    room.receiver = socket.id;
    socket.join(roomId);
    console.log('[Room] Joined:', roomId, 'by', socket.id);
    io.to(room.sender).emit('peer-joined');
    callback({ ok: true, meta: room.meta });
  });

  socket.on('signal', ({ roomId, data }) => {
    const room = rooms[roomId];
    if (!room) return;
    const target = socket.id === room.sender ? room.receiver : room.sender;
    if (target) io.to(target).emit('signal', { data });
  });

  socket.on('disconnect', () => {
    console.log('[-] Disconnected:', socket.id);
    for (const [roomId, room] of Object.entries(rooms)) {
      if (room.sender === socket.id || room.receiver === socket.id) {
        io.to(roomId).emit('peer-left');
        delete rooms[roomId];
        console.log('[Room] Cleaned up:', roomId);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log('Server running on :' + PORT));