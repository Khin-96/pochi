"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, PaperclipIcon, Bot } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchChatHistory, sendChatMessage, fetchChamaBasicInfo } from "@/lib/api"
import { formatTime } from "@/lib/utils"
import ChatSkeleton from "@/components/chat-skeleton"

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

export default function ChamaChatPage() {
  const params = useParams()
  const { toast } = useToast()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chamaInfo, setChamaInfo] = useState<ChamaBasicInfo | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chamaId = params.id as string

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [chatHistory, basicInfo] = await Promise.all([fetchChatHistory(chamaId), fetchChamaBasicInfo(chamaId)])
        setMessages(chatHistory)
        setChamaInfo(basicInfo)
      } catch (error) {
        console.error("Failed to fetch chat data:", error)
        toast({
          title: "Error",
          description: "Failed to load chat history. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()

    // Set up WebSocket connection for real-time chat
    const socket = new WebSocket(`wss://api.example.com/chat/${chamaId}`)

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      setMessages((prev) => [...prev, message])
    }

    socket.onerror = (error) => {
      console.error("WebSocket error:", error)
    }

    return () => {
      socket.close()
    }
  }, [chamaId, toast])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim()) return

    setIsSending(true)
    try {
      const message = await sendChatMessage(chamaId, newMessage)
      setMessages((prev) => [...prev, message])
      setNewMessage("")
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again later.",
        variant: "destructive",
      })
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
        <h1 className="text-2xl font-bold mb-4">Chat not found</h1>
        <p className="text-muted-foreground mb-6">
          The chama you're looking for doesn't exist or you don't have access to it.
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
                // Check if this is the first message of the day or a new day
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
                          <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
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
