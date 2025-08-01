// app/api/chamas/[id]/ws/route.ts
import { WebSocketServer } from 'ws'
import { NextRequest } from 'next/server'

const wss = new WebSocketServer({ noServer: true })

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log('Received:', message.toString())
    ws.send(`Echo: ${message}`)
  })
})

export async function GET(req: NextRequest) {
  if (req.headers.get('upgrade') !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 })
  }

  // Create a custom response that allows upgrade
  const response = new Response(null, { status: 101 })

  // @ts-ignore - Access the underlying socket
  const { socket } = response

  wss.handleUpgrade(req, socket, Buffer.alloc(0), (ws) => {
    wss.emit('connection', ws, req)
  })

  return response
}

export const dynamic = 'force-dynamic'