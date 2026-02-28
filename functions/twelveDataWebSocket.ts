import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TWELVE_DATA_WS_URL = 'wss://ws.twelvedata.com/v1/quotes/price';

// Store active WebSocket connections
const wsConnections = new Map();

Deno.serve(async (req) => {
  if (req.headers.get('upgrade') !== 'websocket') {
    return new Response('Expected WebSocket', { status: 400 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);
    const clientId = `${user.id}-${Date.now()}`;
    
    wsConnections.set(clientId, {
      socket,
      user,
      subscriptions: new Set(),
      twelveDataWs: null
    });

    socket.onopen = () => {
      console.log(`Client ${clientId} connected`);
    };

    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.action === 'subscribe') {
          const connection = wsConnections.get(clientId);
          connection.subscriptions.add(message.symbol);
          
          // Connect to Twelve Data if not already connected
          if (!connection.twelveDataWs) {
            await connectToTwelveData(clientId, connection);
          }
          
          socket.send(JSON.stringify({
            type: 'subscribed',
            symbol: message.symbol
          }));
        } else if (message.action === 'unsubscribe') {
          const connection = wsConnections.get(clientId);
          connection.subscriptions.delete(message.symbol);
        }
      } catch (error) {
        console.error('Message handling error:', error);
        socket.send(JSON.stringify({ error: error.message }));
      }
    };

    socket.onclose = () => {
      const connection = wsConnections.get(clientId);
      if (connection?.twelveDataWs) {
        connection.twelveDataWs.close();
      }
      wsConnections.delete(clientId);
      console.log(`Client ${clientId} disconnected`);
    };

    socket.onerror = (error) => {
      console.error(`WebSocket error for ${clientId}:`, error);
    };

    return response;
  } catch (error) {
    console.error('WebSocket upgrade error:', error);
    return new Response(`WebSocket error: ${error.message}`, { status: 500 });
  }
});

async function connectToTwelveData(clientId, connection) {
  try {
    const apiKey = Deno.env.get('TWELVE_DATA_API_KEY');
    if (!apiKey) {
      throw new Error('TWELVE_DATA_API_KEY not configured');
    }

    const ws = new WebSocket(TWELVE_DATA_WS_URL);
    connection.twelveDataWs = ws;

    ws.onopen = () => {
      // Auth with Twelve Data
      ws.send(JSON.stringify({
        action: 'auth',
        params: { apikey: apiKey }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.event === 'price') {
          const clientConnection = wsConnections.get(clientId);
          if (clientConnection && clientConnection.subscriptions.has(data.symbol)) {
            // Forward price update to client
            clientConnection.socket.send(JSON.stringify({
              type: 'priceUpdate',
              symbol: data.symbol,
              price: data.price,
              bid: data.bid,
              ask: data.ask,
              timestamp: data.timestamp
            }));
          }
        }
      } catch (error) {
        console.error('Twelve Data message error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Twelve Data WS error:', error);
    };

    ws.onclose = () => {
      console.log('Twelve Data connection closed');
      connection.twelveDataWs = null;
    };
  } catch (error) {
    console.error('Twelve Data connection error:', error);
    connection.socket.send(JSON.stringify({
      error: 'Failed to connect to market data provider'
    }));
  }
}