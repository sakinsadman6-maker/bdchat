require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const mongoose   = require('mongoose');
const cors       = require('cors');
const path       = require('path');
const Message    = require('./models/Message');
const Room       = require('./models/Room');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// Serve the frontend HTML
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── MongoDB connection ──
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ── REST: fetch message history ──
app.get('/api/messages/:roomId', async (req, res) => {
  try {
    const messages = await Message.find({ roomId: req.params.roomId })
      .sort({ time: 1 })
      .limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── REST: check if room exists ──
app.get('/api/room/:roomId', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    res.json({ exists: !!room, room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── In-memory online users: { roomId: { socketId: { name, color, userId } } } ──
const roomUsers = {};

// ── Socket.io ──
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // ── Join room ──
  socket.on('join', async ({ roomId, userId, name, color }) => {
    socket.join(roomId);
    socket.roomId  = roomId;
    socket.userId  = userId;
    socket.userName = name;
    socket.userColor = color;

    // Track user in memory
    if (!roomUsers[roomId]) roomUsers[roomId] = {};
    roomUsers[roomId][socket.id] = { name, color, userId };

    // Upsert room in MongoDB
    await Room.findOneAndUpdate(
      { roomId },
      { lastActive: new Date() },
      { upsert: true, new: true }
    );

    // Send last 100 messages to the joining user
    const history = await Message.find({ roomId })
      .sort({ time: 1 })
      .limit(100)
      .lean();
    socket.emit('history', history);

    // Notify others in the room
    socket.to(roomId).emit('user_joined', { name, color });

    // Send updated user list to everyone in room
    io.to(roomId).emit('users', Object.values(roomUsers[roomId]));

    console.log(`👤 ${name} joined room: ${roomId}`);
  });

  // ── Send message ──
  socket.on('message', async ({ roomId, userId, name, color, text }) => {
    try {
      // Save to MongoDB
      const msg = await Message.create({ roomId, userId, name, color, text });

      // Broadcast to all in room (including sender)
      io.to(roomId).emit('message', {
        id:    userId,
        name,
        color,
        text,
        time:  msg.time
      });

      // Update room lastActive
      await Room.findOneAndUpdate({ roomId }, { lastActive: new Date() });
    } catch (err) {
      console.error('Message save error:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // ── Typing indicator ──
  socket.on('typing', ({ roomId, name }) => {
    socket.to(roomId).emit('typing', { name });
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    const { roomId, userName } = socket;
    if (roomId && roomUsers[roomId]) {
      delete roomUsers[roomId][socket.id];
      if (Object.keys(roomUsers[roomId]).length === 0) {
        delete roomUsers[roomId];
      } else {
        io.to(roomId).emit('users', Object.values(roomUsers[roomId]));
      }
      socket.to(roomId).emit('user_left', { name: userName });
    }
    console.log(`🔌 Disconnected: ${userName || socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 আড্ডা server running on http://localhost:${PORT}`);
});
