import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

// Configure CORS properly
const corsOptions = {
  origin: ["http://localhost:19006", "http://localhost:19000", "http://localhost:8081"],
  methods: ["GET", "POST"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Configure Socket.IO with CORS
const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  path: '/socket.io'
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join', (userId) => {
    console.log(`User ${userId} joined their room`);
    socket.join(userId);
    socket.emit('joined', { userId, socketId: socket.id });
  });

  socket.on('private message', (data) => {
    console.log('Message received:', data);
    const { senderId, receiverId, content } = data;
    io.to(senderId).to(receiverId).emit('private message', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const port = 8081;
httpServer.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Socket.IO server ready`);
});
