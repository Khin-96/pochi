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
  const [messages, setMessages] = useState<Message[]>([])
  const [user, setUser] = useState<any>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [language, setLanguage] = useState<"en" | "sw">("en")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Groq API configuration
  const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY
  const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        id: "welcome",
        content: language === "en" 
          ? `Hello${user ? ` ${user.name}` : ''}! I'm PesaBot, your intelligent financial assistant. I can help with:
• Any financial questions or calculations
• Savings, investments, loans, and budgeting
• Chama management and insights
• Financial planning for goals
• Analyzing your spending patterns
• Comparing financial options

Just ask naturally like you would a financial expert!
Say 'Swahili' to switch languages`
          : `Habari${user ? ` ${user.name}` : ''}! Mimi ni PesaBot, msaidizi wako wa kifedha. Naweza kusaidia kwa:
• Maswali yoyote ya kifedha au mahesabu
• Akiba, uwekezaji, mikopo na bajeti
• Usimamizi wa chama na ushauri
• Mipango ya kifedha kwa malengo
• Kuchambua matumizi yako
• Kulinganisha chaguzi za kifedha

Uliza kwa lugha yoyote unayoelewa!
Sema 'English' kubadilisha lugha`,
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, language, user])

  // Load user when widget opens
  useEffect(() => {
    if (isOpen) {
      const loadUserData = async () => {
        try {
          const currentUser = await getCurrentUser()
          setUser(currentUser)
        } catch (error) {
          console.error("Failed to fetch user:", error)
        }
      }
      loadUserData()
    }
  }, [isOpen])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Enhanced financial data fetcher
  const fetchFinancialContext = async () => {
    try {
      const [balanceRes, transactionsRes, savingsRes, loansRes, investmentsRes, chamasRes, profileRes] = await Promise.all([
        fetch('/api/user/balance').catch(() => ({ ok: false })),
        fetch('/api/transactions?limit=6').catch(() => ({ ok: false })),
        fetch('/api/savings').catch(() => ({ ok: false })),
        fetch('/api/loans').catch(() => ({ ok: false })),
        fetch('/api/investments').catch(() => ({ ok: false })),
        fetch('/api/chamas').catch(() => ({ ok: false })),
        fetch('/api/user/profile').catch(() => ({ ok: false }))
      ])

      return {
        balance: balanceRes.ok ? (await balanceRes.json()).balance : 0,
        transactions: transactionsRes.ok ? (await transactionsRes.json()).transactions : [],
        savings: savingsRes.ok ? (await savingsRes.json()).goals : [],
        loans: loansRes.ok ? (await loansRes.json()).loans : [],
        investments: investmentsRes.ok ? (await investmentsRes.json()).investments : [],
        chamas: chamasRes.ok ? (await chamasRes.json()).chamas : [],
        profile: profileRes.ok ? (await profileRes.json()).profile : null,
        monthlyIncome: profileRes.ok ? (await profileRes.json()).profile?.monthlyIncome : 0
      }
    } catch (error) {
      console.error("Financial data error:", error)
      return {
        balance: 0,
        transactions: [],
        savings: [],
        loans: [],
        investments: [],
        chamas: [],
        profile: null,
        monthlyIncome: 0
      }
    }
  }

  const handleLanguageSwitch = (msg: string) => {
    if (msg.toLowerCase().includes("swahili")) {
      setLanguage("sw")
      return language === "en" 
        ? "Sawa! Nimebadilisha lugha kwa Kiswahili. Unaweza kuuliza sasa." 
        : "Tayari ninatumia Kiswahili."
    } else if (msg.toLowerCase().includes("english")) {
      setLanguage("en")
      return language === "sw" 
        ? "Got it! I've switched to English. You can ask now." 
        : "I'm already using English."
    }
    return null
  }

  // Enhanced AI response handler
  const getAIResponse = async (message: string) => {
    const langResponse = handleLanguageSwitch(message)
    if (langResponse) return langResponse

    try {
      const financialData = await fetchFinancialContext()
      const { balance, monthlyIncome, loans, savings, chamas, profile } = financialData

      // Construct context-aware prompt
      const contextPrompt = `User Financial Context:
- Balance: ${formatCurrency(balance)}
- Monthly Income: ${formatCurrency(monthlyIncome)}
- Active Loans: ${loans.length} (Total: ${formatCurrency(loans.reduce((sum, loan) => sum + loan.balance, 0))})
- Savings Goals: ${savings.length}
- Chama Memberships: ${chamas.length}
- Family Size: ${profile?.familySize || 1}
- Location: ${profile?.location || 'Nairobi'}

Current Question: "${message}"`

      const systemPrompt = language === "sw" 
        ? `You are PesaBot, msaidizi wa kifedha wa Kenya. Kanuni:
1. Jibu kwa mazungumzo ya kirafiki kama rafiki mwenye ujuzi wa fedha
2. Tumia muktadha wa kifedha uliopewa
3. Fanya mahesabu inapohitajika
4. Toa chaguzi nyingi
5. Zingatia mambo ya uchumi wa Kenya
6. Kamwe usitoe maelezo ya akaunti yoyote au nenosiri
7. Toa maelezo ya kina na mifano halisi
8. Thibitisha uwezo wa mteja kabla ya kupendekeza
9. Sema ukweli kuhusu hatari na changamoto`
        : `You are PesaBot, Kenya's smartest financial assistant. Rules:
1. Answer naturally like a knowledgeable financial friend
2. Use the provided financial context
3. Make calculations when needed
4. Offer multiple options/paths
5. Consider Kenyan economic factors
6. Never reveal any account details or passwords
7. Provide detailed explanations with real examples
8. Verify affordability before recommending
9. Be honest about risks and challenges`

      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: contextPrompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)
      
      const data = await response.json()
      return data.choices[0]?.message?.content || 
        (language === "sw" 
          ? "Samahani, sikuweza kujibu. Tafadhali jaribu kuuliza kwa njia nyingine." 
          : "Sorry, I couldn't respond. Please try rephrasing your question.")
    } catch (error) {
      console.error("AI response error:", error)
      return language === "sw" 
        ? "Nimekua na shida kiufundi. Tafadhali jaribu tena baadaye." 
        : "I'm having technical issues. Please try again later."
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
    setMessages(prev => [...prev, userMessage])
    setMessage("")
    setIsTyping(true)

    try {
      // Check for exit commands
      if (["bye", "kwaheri", "exit"].some(word => message.toLowerCase().includes(word))) {
        addBotMessage(language === "sw" ? "Kwaheri! Karibu tena muda wowote." : "Goodbye! Come back anytime.")
        return
      }

      // Get AI response
      const aiResponse = await getAIResponse(message)
      addBotMessage(aiResponse)

    } catch (error) {
      console.error("Chat error:", error)
      addBotMessage(language === "sw" 
        ? "Samahani, nimekua na shida. Tafadhali jaribu tena." 
        : "Sorry, I encountered an error. Please try again."
      )
    } finally {
      setIsTyping(false)
    }
  }

  const addBotMessage = (content: string) => {
    const botMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "bot",
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, botMessage])
  }

  // Hide on auth pages
  const pathname = usePathname()
  if (["/", "/login", "/signup", "/forgot-password"].includes(pathname)) {
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
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => setLanguage(lang => lang === "en" ? "sw" : "en")}
                title={language === "en" ? "Switch to Swahili" : "Badili kwa Kiingereza"}
              >
                {language === "en" ? "SW" : "EN"}
              </Button>
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
                    placeholder={language === "sw" ? "Uliza PesaBot kuhusu fedha..." : "Ask PesaBot about finance..."}
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