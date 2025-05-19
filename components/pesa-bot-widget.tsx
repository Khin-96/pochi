"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot, X, Send, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

interface Message {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
}

export default function PesaBotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "Hello! I'm PesaBot, your AI-powered financial assistant. I can help with budgeting, saving strategies, chama management, and more. How can I assist you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const pathname = usePathname()
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only load chat history when the widget is opened
    if (isOpen) {
      const loadChatHistory = async () => {
        try {
          const response = await fetch("/api/pesabot/history")
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.chat && data.chat.messages && data.chat.messages.length > 0) {
              // Convert string dates to Date objects
              const formattedMessages = data.chat.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
              }))
              setMessages(formattedMessages)
            }
          }
        } catch (error) {
          console.error("Failed to load chat history:", error)
        }
      }

      loadChatHistory()
    }
  }, [isOpen])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Don't show on auth pages
  if (pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password") {
    return null
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: "user",
      timestamp: new Date(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setMessage("")

    // Show typing indicator
    setIsTyping(true)

    try {
      // Call the PesaBot API
      const response = await fetch("/api/pesabot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          chatHistory: messages,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response from PesaBot")
      }

      const data = await response.json()

      // Add bot response
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: "bot",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botResponse])
      try {
        // Save chat history
        await fetch("/api/pesabot/history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...updatedMessages, botResponse],
          }),
        })
      } catch (error) {
        console.error("Failed to save chat history:", error)
      }
    } catch (error) {
      console.error("PesaBot error:", error)

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble connecting right now. Please try again later.",
        sender: "bot",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <>
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 rounded-full p-3 bg-green-600 hover:bg-green-700 shadow-lg"
        >
          <Bot className="h-6 w-6" />
        </Button>
      ) : (
        <Card
          className={cn(
            "fixed right-4 transition-all duration-300 shadow-lg border-green-200 dark:border-green-800",
            isMinimized ? "bottom-4 w-72 h-14" : "bottom-4 w-80 sm:w-96 h-[450px] max-h-[80vh]",
          )}
        >
          <CardHeader className="p-3 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="PesaBot" />
                <AvatarFallback className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  PB
                </AvatarFallback>
              </Avatar>
              PesaBot
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMinimized(!isMinimized)}>
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              <CardContent className="p-3 overflow-y-auto flex-1 h-[330px]">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.sender === "user" ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg p-3",
                          msg.sender === "user" ? "bg-green-600 text-white" : "bg-muted",
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-muted max-w-[80%] rounded-lg p-3">
                        <div className="flex space-x-2">
                          <div
                            className="h-2 w-2 rounded-full bg-green-600 animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="h-2 w-2 rounded-full bg-green-600 animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="h-2 w-2 rounded-full bg-green-600 animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              <CardFooter className="p-3 pt-0">
                <form onSubmit={handleSendMessage} className="flex w-full gap-2">
                  <Input
                    placeholder="Ask PesaBot a question..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" className="bg-green-600 hover:bg-green-700">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardFooter>
            </>
          )}
        </Card>
      )}
    </>
  )
}
