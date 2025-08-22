// lib/pusher.ts
import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Validate environment variables
const appId = process.env.PUSHER_APP_ID;
const key = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

// Check if all required environment variables are present
if (!appId || !key || !secret || !cluster) {
  throw new Error('Missing Pusher environment variables');
}

export const pusherServer = new PusherServer({
  appId,
  key,
  secret,
  cluster,
  useTLS: true,
});

export const pusherClient = new PusherClient(key, {
  cluster,
  forceTLS: true, // Added for better security
});