// app/api/chamas/[id]/ws/route.ts
import { WebSocketServer } from 'ws'
import { NextRequest } from 'next/server'
import { verify } from "jsonwebtoken"

declare global {
  var wss: WebSocketServer
}

export const dynamic = 'force-dynamic'

if (!global.wss) {
  global.wss = new WebSocketServer({ noServer: true })

  global.wss.on('connection', (ws, req) => {
    try {
      const url = new URL(req.url || '', `http://${req.headers.host}`)
      const chamaId = url.pathname.split('/').pop()
      const token = url.searchParams.get('token')

      if (!token) {
        ws.close(1008, 'Authentication required')
        return
      }

      const decoded = verify(token, process.env.JWT_SECRET!) as { userId: string }
      ws.userId = decoded.userId
      ws.chamaId = chamaId

      console.log(`User ${ws.userId} connected to chama ${ws.chamaId}`)

      ws.on('message', (message) => {
        try {
          const parsedMessage = JSON.parse(message.toString())
          
          if (!parsedMessage.content || !parsedMessage.senderId) {
            throw new Error('Invalid message format')
          }

          global.wss.clients.forEach(client => {
            if (client.chamaId === chamaId && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                ...parsedMessage,
                timestamp: new Date().toISOString(),
                id: Date.now().toString()
              }))
            }
          })
        } catch (err) {
          console.error('Error handling message:', err)
        }
      })

      ws.on('close', () => {
        console.log(`User ${ws.userId} disconnected from chama ${ws.chamaId}`)
      })

    } catch (err) {
      console.error('WebSocket connection error:', err)
      ws.close(1008, 'Connection error')
    }
  })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return new Response(null, { status: 101 })
}