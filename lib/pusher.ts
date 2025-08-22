// lib/pusher.ts
import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Validate environment variables
const appId = process.env.PUSHER_APP_ID;
const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

// Check if we're in a server environment and all required variables are present
const isServer = typeof window === 'undefined';
const hasServerVars = appId && key && secret && cluster;

export const pusherServer = isServer && hasServerVars
  ? new PusherServer({
      appId: appId!,
      key: key!,
      secret: secret!,
      cluster: cluster!,
      useTLS: true,
    })
  : {
      // Provide a mock implementation for build time
      authorizeChannel: () => {
        throw new Error('Pusher environment variables not configured');
      }
    };

export const pusherClient = key && cluster
  ? new PusherClient(key, {
      cluster,
      forceTLS: true,
    })
  : null;