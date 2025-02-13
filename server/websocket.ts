import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { parse } from 'url';

const connectedClients = new Map<string, WebSocket>();

export function initializeWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    noServer: true
  });

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url || '');
    
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        console.log('WebSocket connection established');
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws, request) => {
    console.log('New client connected');
    let userId: string | null = null;

    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on('pong', () => {
      // Client is alive
      console.log('Client responded to ping');
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('Received message:', message);

        if (message.type === 'identify') {
          userId = message.userId;
          if (userId) {
            connectedClients.set(userId, ws);
            console.log(`Client identified: ${userId}`);
          }
          ws.send(JSON.stringify({ 
            type: 'connected',
            userId,
            timestamp: new Date().toISOString()
          }));
        } else if (message.type === 'message') {
          handleMessage(message);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    ws.on('close', () => {
      if (userId) {
        console.log(`Client disconnected: ${userId}`);
        connectedClients.delete(userId);
      }
      clearInterval(heartbeat);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  function handleMessage(message: any) {
    const { senderId, receiverId } = message;
    const messageStr = JSON.stringify(message);

    [senderId, receiverId].forEach(id => {
      const client = connectedClients.get(id);
      if (client?.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  return wss;
}
