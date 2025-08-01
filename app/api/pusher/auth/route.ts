// app/api/pusher/auth/route.ts
import { pusherServer } from '@/lib/pusher'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user?._id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const data = await request.text()
    const [socketId, channelName] = data
      .split('&')
      .map((str) => str.split('=')[1])

    const presenceData = {
      user_id: user._id,
      user_info: {
        name: user.name,
        avatar: user.avatar,
      },
    }

    const auth = pusherServer.authorizeChannel(
      socketId,
      channelName,
      presenceData
    )

    return NextResponse.json(auth)
  } catch (error) {
    console.error('Pusher auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}