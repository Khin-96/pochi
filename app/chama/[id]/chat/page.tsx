"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, PaperclipIcon, Bot } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getToken } from "@/lib/auth"
import ChatSkeleton from "@/components/chat-skeleton"
import { pusherClient } from "@/lib/pusher"

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: string
  isPesaBot?: boolean
}

interface ChamaBasicInfo {
  id: string
  name: string
  memberCount: number
  maxMembers: number
}

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_BASE = 1000; // 1 second base delay

export default function ChamaChatPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chamaInfo, setChamaInfo] = useState<ChamaBasicInfo | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected")
  const reconnectAttemptsRef = useRef(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chamaId = params.id as string

  if (!chamaId || typeof chamaId !== "string") {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Invalid Chama ID</h1>
        <Button asChild>
          <Link href="/chama-hub">Return to Chama Hub</Link>
        </Button>
      </div>
    )
  }

  // Fetch initial chat history
 const fetchChatHistory = useCallback(async () => {
  try {
    setIsLoading(true);
    const res = await fetch(`/api/chamas/${chamaId}/chat`, {
      credentials: 'include'
    });
    
    if (res.status === 401) {
      router.push('/login');
      return;
    }

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    setMessages(data.messages || []);
  } catch (error) {
    console.error("Chat history error:", error);
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to load chat",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
}, [chamaId, router, toast]);

  const fetchChamaInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/chamas/${chamaId}/basic`, {
        credentials: 'include'
      })
      
      if (res.status === 401) {
        router.push('/login')
        return
      }

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to fetch chama info")
      }

      const data = await res.json()
      setChamaInfo(data)
    } catch (error) {
      console.error("Chama info error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load chama info",
        variant: "destructive",
      })
      
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        router.push('/login')
      }
    } finally {
      setIsLoading(false)
    }
  }, [chamaId, router, toast])

  // Setup Pusher connection
const setupPusher = useCallback(async () => {
  try {
    setConnectionStatus("connecting");
    
    const token = await getToken();
    if (!token) {
      toast({
        title: "Session expired",
        description: "Please login again",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

      // Initialize Pusher connection
       pusherClient.signin({
      authEndpoint: '/api/pusher/auth',
      auth: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

      // Subscribe to the channel
      const channel = pusherClient.subscribe(`chama-${chamaId}`);

      // Bind to new message event
      channel.bind('new-message', (message: ChatMessage) => {
        setMessages(prev => {
          // Remove temporary message if exists and add new message
          const filtered = prev.filter(msg => !msg.id.startsWith('temp-'));
          return [...filtered, message];
        });
      });

      pusherClient.connection.bind('connected', () => {
        console.log("Pusher connected successfully");
        setConnectionStatus("connected");
        reconnectAttemptsRef.current = 0;
      });

      pusherClient.connection.bind('error', (error: any) => {
        console.error("Pusher error:", error);
        setConnectionStatus("error");
        toast({
          title: "Connection error",
          description: "Failed to connect to chat server",
          variant: "destructive",
        });
      });

      pusherClient.connection.bind('disconnected', () => {
        console.log("Pusher disconnected");
        setConnectionStatus("disconnected");
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(
            RECONNECT_DELAY_BASE * Math.pow(2, reconnectAttemptsRef.current),
            30000 // Max 30 seconds delay
          );
          
          setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            setupPusher();
          }, delay);
        }
      });

      return () => {
        channel.unbind_all();
        channel.unsubscribe();
      };

    } catch (error) {
      console.error("Pusher setup failed:", error);
      setConnectionStatus("error");
      toast({
        title: "Connection error",
        description: error instanceof Error ? error.message : "Failed to setup chat connection",
        variant: "destructive",
      });
    }
  }, [chamaId, toast, router]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Initialize chat and Pusher
  useEffect(() => {
    fetchChatHistory()
    fetchChamaInfo()
    const cleanupPromise = setupPusher()

    return () => {
      cleanupPromise.then(cleanup => cleanup?.())
    }
  }, [fetchChatHistory, fetchChamaInfo, setupPusher])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setIsSending(true)
    const tempId = `temp-${Date.now()}`
    const tempMessage: ChatMessage = {
      id: tempId,
      senderId: "current-user",
      senderName: "You",
      content: newMessage,
      timestamp: new Date().toISOString()
    }

    try {
      // Optimistic update
      setMessages(prev => [...prev, tempMessage])
      setNewMessage("")

      // Send message via API
      const res = await fetch(`/api/chamas/${chamaId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      // If the message hasn't been replaced by a server message after 5 seconds,
      // consider it failed and remove the optimistic update
      setTimeout(() => {
        setMessages(prev => {
          return prev.some(msg => msg.id === tempId) 
            ? prev.filter(msg => msg.id !== tempId)
            : prev
        })
      }, 5000)

    } catch (error) {
      console.error("Failed to send message:", error)
      toast({
        title: "Failed to send message",
        description: "Please try again later",
        variant: "destructive",
      })
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return <ChatSkeleton />
  }

  if (!chamaInfo) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Chat not available</h1>
        <p className="text-muted-foreground mb-6">
          Unable to load chat. You may not have access or the chama doesn't exist.
        </p>
        <Button asChild>
          <Link href="/chama-hub">Return to Chama Hub</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-6 h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/chama/${chamaId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">{chamaInfo.name}</h1>
            <p className="text-sm text-muted-foreground">{chamaInfo.memberCount} members</p>
          </div>
        </div>
        <Badge variant="outline" className={
          connectionStatus === "connected" ? "bg-green-100 text-green-800" : 
          connectionStatus === "error" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
        }>
          {connectionStatus === "connected" ? "Connected" : 
           connectionStatus === "error" ? "Connection Error" : "Connecting..."}
        </Badge>
      </div>

      {/* Chat Container */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="py-3 px-4 border-b">
          <CardTitle className="text-base font-medium">Group Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="bg-muted rounded-full p-3 mb-4">
                <Send className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No messages yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Be the first to send a message to this chama group chat!
              </p>
            </div>
          ) : (
            <>
              {messages.map((message, index) => {
                const showDateSeparator =
                  index === 0 ||
                  new Date(message.timestamp).toDateString() !== new Date(messages[index - 1].timestamp).toDateString()

                return (
                  <div key={message.id}>
                    {showDateSeparator && (
                      <div className="flex justify-center my-4">
                        <Badge variant="outline" className="text-xs">
                          {new Date(message.timestamp).toLocaleDateString()}
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={message.senderAvatar || "/placeholder.svg?height=32&width=32"}
                          alt={message.senderName}
                        />
                        <AvatarFallback>{message.isPesaBot ? "PB" : message.senderName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{message.senderName}</span>
                          {message.isPesaBot && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              <Bot className="mr-1 h-3 w-3" /> PesaBot
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-sm bg-muted p-3 rounded-lg max-w-[80%] md:max-w-[70%]">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Button type="button" variant="ghost" size="icon" className="shrink-0">
              <PaperclipIcon className="h-5 w-5" />
            </Button>
            <Input
  placeholder="Type a message..."
  value={newMessage}
  onChange={(e) => setNewMessage(e.target.value)}
  className="flex-1"
  disabled={isSending}
/>
            <Button
              type="submit"
              size="icon"
              className="shrink-0 bg-green-600 hover:bg-green-700"
              disabled={isSending || !newMessage.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}