"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot, X, Send, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { formatCurrency } from "@/lib/utils"

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
        "Hello! I'm PesaBot, your financial assistant. You can ask me about:\n" +
        "• Your account balance\n" +
        "• Recent transactions\n" +
        "• Savings goals progress\n" +
        "• Chama contributions\n" +
        "• Financial advice\n\n" +
        "Try: \"What's my balance?\" or \"How are my savings doing?\"",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error("Failed to fetch user:", error)
      }
    }
    
    if (isOpen) {
      fetchUser()
      loadChatHistory()
    }
  }, [isOpen])

  const loadChatHistory = async () => {
    try {
      const response = await fetch("/api/pesabot/history")
      if (response.ok) {
        const data = await response.json()
        if (data.messages?.length > 0) {
          const formattedMessages = data.messages.map((msg: any) => ({
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchFinancialData = async () => {
    try {
      const [balanceRes, transactionsRes, savingsRes, chamasRes] = await Promise.all([
        fetch('/api/user/balance'),
        fetch('/api/transactions?limit=5'),
        fetch('/api/savings/goals'),
        fetch('/api/chamas')
      ])
      
      return {
        balance: (await balanceRes.json()).balance,
        transactions: (await transactionsRes.json()).transactions,
        savingsGoals: (await savingsRes.json()).goals,
        chamas: (await chamasRes.json()).chamas
      }
    } catch (error) {
      console.error("Failed to fetch financial data", error)
      throw error
    }
  }

  const saveChatHistory = async (messages: Message[]) => {
    try {
      await fetch('/api/pesabot/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      })
    } catch (error) {
      console.error("Failed to save chat history", error)
    }
  }

  const handleFinancialQuery = async (message: string) => {
    const lowerMsg = message.toLowerCase()
    
    try {
      // Balance inquiry
      if (lowerMsg.includes('balance') || lowerMsg.includes('how much')) {
        if (!user) return "Please log in to check your balance"
        const { balance } = await fetchFinancialData()
        return `Your current balance is ${formatCurrency(balance)}.`
      }

      // Savings goals
      if (lowerMsg.includes('savings') || lowerMsg.includes('goal')) {
        if (!user) return "Please log in to view your savings goals"
        const { savingsGoals } = await fetchFinancialData()
        if (!savingsGoals?.length) {
          return "You don't have any active savings goals. Would you like to create one?"
        }
        return `Your savings goals:\n${savingsGoals.map((g: any) => 
          `• ${g.name}: ${formatCurrency(g.currentAmount)} of ${formatCurrency(g.targetAmount)}`
        ).join('\n')}`
      }

      // Transaction history
      if (lowerMsg.includes('transaction') || lowerMsg.includes('history')) {
        if (!user) return "Please log in to view transactions"
        const { transactions } = await fetchFinancialData()
        if (!transactions?.length) {
          return "No recent transactions found."
        }
        return `Recent transactions:\n${transactions.slice(0, 5).map((t: any) => 
          `• ${t.description}: ${formatCurrency(t.amount)}`
        ).join('\n')}`
      }

      // Chama contributions
      if (lowerMsg.includes('chama') || lowerMsg.includes('group')) {
        if (!user) return "Please log in to view your chamas"
        const { chamas } = await fetchFinancialData()
        if (!chamas?.length) {
          return "You're not currently in any chamas. Would you like to join one?"
        }
        return `Your chamas:\n${chamas.map((c: any) => 
          `• ${c.name}: Next contribution ${formatCurrency(c.contributionAmount)} due soon`
        ).join('\n')}`
      }

      // Help command
      if (lowerMsg === 'help') {
        return `I can help with:\n\n` +
               `• Account balance inquiries\n` +
               `• Transaction history\n` +
               `• Savings goals tracking\n` +
               `• Chama information\n` +
               `• Financial advice\n\n` +
               `Try asking:\n"What's my balance?" or "Show my recent transactions"`
      }

      return null
    } catch (error) {
      console.error("Financial query error:", error)
      return "Sorry, I couldn't fetch your financial data. Please try again later."
    }
  }

  const getZephyrResponse = async (prompt: string, chatHistory: Message[]): Promise<string> => {
    try {
      const response = await fetch(
        "https://router.huggingface.co/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "HuggingFaceH4/zephyr-7b-beta:featherless-ai",
            messages: [
              {
                role: "system",
                content: `You are PesaBot, a friendly financial assistant for PochiYangu app users. Follow these rules:
1. Provide clear, practical financial advice
2. For investments, explain concepts but never recommend specific assets
3. Keep responses concise (1-2 paragraphs max)
4. If user asks about their finances, suggest they check specific sections in the app
5. If unsure, say "I recommend consulting a financial advisor for this specific question"`,
              },
              ...chatHistory.map(msg => ({
                role: msg.sender === "user" ? "user" : "assistant",
                content: msg.content,
              })),
              { role: "user", content: prompt },
            ],
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || "I couldn't generate a response. Please try again."
    } catch (error) {
      console.error("Chat error:", error)
      return "I'm having trouble connecting to my services. Please try again later."
    }
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
    setIsTyping(true)

    try {
      // Check for financial queries first
      const financialResponse = await handleFinancialQuery(message)
      if (financialResponse) {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: financialResponse,
          sender: "bot",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, botResponse])
        await saveChatHistory([...updatedMessages, botResponse])
        return
      }

      // Default AI response for non-financial queries
      const botResponseContent = await getZephyrResponse(message, updatedMessages)
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponseContent,
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botResponse])
      await saveChatHistory([...updatedMessages, botResponse])

    } catch (error) {
      console.error("PesaBot error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error. Please try again.",
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      await saveChatHistory([...updatedMessages, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  // Don't show on auth pages
  if (pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password") {
    return null
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
                <AvatarImage src="/pesabot-avatar.png" alt="PesaBot" />
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
                          "max-w-[80%] rounded-lg p-3 whitespace-pre-wrap",
                          msg.sender === "user" 
                            ? "bg-green-600 text-white" 
                            : "bg-muted border border-gray-200 dark:border-gray-700"
                        )}
                      >
                        {msg.content}
                        <div className="text-xs text-muted-foreground mt-1">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-muted max-w-[80%] rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <div className="flex space-x-2">
                          <div className="h-2 w-2 rounded-full bg-green-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="h-2 w-2 rounded-full bg-green-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="h-2 w-2 rounded-full bg-green-600 animate-bounce" style={{ animationDelay: "300ms" }} />
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
                    placeholder="Ask PesaBot about finance..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1"
                    disabled={isTyping}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isTyping}
                  >
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