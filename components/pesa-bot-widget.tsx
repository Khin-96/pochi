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
          ? `Hello${user ? ` ${user.name}` : ''}! I'm PesaBot, your financial assistant. You can ask me about:\n` +
            "• Account balances\n• Recent transactions\n• Savings goals\n" +
            "• Chama contributions\n• Loans\n• Frequent recipients\n" +
            "• Basic financial advice\n\n" +
            "Try: \"What's my balance?\" or \"Show my recent transactions\"\n" +
            "Say 'Swahili' to switch to Swahili"
          : `Habari${user ? ` ${user.name}` : ''}! Mimi ni PesaBot, msaidizi wako wa kifedha. Unaweza kuniuliza kuhusu:\n` +
            "• Salio lako\n• Manunuzi ya hivi karibuni\n• Malengo ya akiba\n" +
            "• Michango ya chama\n• Mikopo\n• Watu unaotuma pesa mara kwa mara\n\n" +
            "Jaribu: \"Nina salio gani?\" au \"Nionyeshe manunuzi yangu ya hivi karibuni\"\n" +
            "Sema 'English' kubadili kwa Kiingereza",
        sender: "bot",
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, language, user])

  // Load user when widget opens
  useEffect(() => {
    if (isOpen) {
      const fetchUser = async () => {
        try {
          const currentUser = await getCurrentUser()
          setUser(currentUser)
        } catch (error) {
          console.error("Failed to fetch user:", error)
        }
      }
      fetchUser()
    }
  }, [isOpen])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
const fetchFinancialData = async () => {
  try {
    // Fetch all data with individual error handling
    const [balanceRes, transactionsRes, savingsRes, loansRes, chamasRes, frequentRecipientsRes] = await Promise.all([
      fetch('/api/user/balance').catch(() => ({ ok: false })),
      fetch('/api/transactions?limit=5').catch(() => ({ ok: false })),
      fetch('/api/savings/goals').catch(() => ({ ok: false })),
      fetch('/api/loans').catch(() => ({ ok: false })),
      fetch('/api/chamas').catch(() => ({ ok: false })),
      fetch('/api/payments/frequent-recipients').catch(() => ({ ok: false }))
    ]);

    // Process responses with fallbacks
    return {
      balance: balanceRes.ok ? (await balanceRes.json()).balance : 0,
      transactions: transactionsRes.ok ? (await transactionsRes.json()).transactions : [],
      savingsGoals: savingsRes.ok ? (await savingsRes.json()).goals : [],
      loans: loansRes.ok ? (await loansRes.json()).loans : [],
      chamas: chamasRes.ok ? (await chamasRes.json()).chamas : [],
      frequentRecipients: frequentRecipientsRes.ok ? (await frequentRecipientsRes.json()).recipients : []
    };
  } catch (error) {
    console.error("Financial data error:", error);
    // Return empty/default data if there's an error
    return {
      balance: 0,
      transactions: [],
      savingsGoals: [],
      loans: [],
      chamas: [],
      frequentRecipients: []
    };
  }
};

  const handleLanguageSwitch = (lang: string) => {
    if (lang.toLowerCase().includes("swahili")) {
      setLanguage("sw")
      return language === "en" 
        ? "Sawa! Nimebadilisha lugha kwa Kiswahili. Unaweza kuuliza sasa." 
        : "Tayari ninatumia Kiswahili."
    } else if (lang.toLowerCase().includes("english")) {
      setLanguage("en")
      return language === "sw" 
        ? "Got it! I've switched to English. You can ask now." 
        : "I'm already using English."
    }
    return null
  }

  const handleFinancialQuery = async (message: string) => {
    const lowerMsg = message.toLowerCase()
    
    // Check for language switch first
    const langResponse = handleLanguageSwitch(message)
    if (langResponse) return langResponse

    try {
      const { balance, transactions, savingsGoals, loans, chamas, frequentRecipients } = await fetchFinancialData()

      if (language === "sw") {
        // Swahili responses
        if (lowerMsg.includes("salio") || lowerMsg.includes("pesa")) {
          if (!user) return "Tafadhali ingia kwanza kuangalia salio lako"
          return `Salio lako ni ${formatCurrency(balance)}`
        }

        if (lowerMsg.includes("manunuzi") || lowerMsg.includes("transactions")) {
          if (!user) return "Tafadhali ingia kwanza kuona manunuzi yako"
          if (!transactions?.length) return "Hakuna manunuzi ya hivi karibuni"
          return `Manunuzi 5 ya hivi karibuni:\n${transactions.slice(0, 5).map(txn => 
            `• ${txn.description}: ${formatCurrency(txn.amount)} (${new Date(txn.date).toLocaleDateString()})`
          ).join('\n')}`
        }

        if (lowerMsg.includes("akiba") || lowerMsg.includes("akiba")) {
          if (!user) return "Tafadhali ingia kwanza kuona malengo yako ya akiba"
          if (!savingsGoals?.length) return "Huna malengo ya akiba kwa sasa"
          return `Malengo yako ya akiba:\n${savingsGoals.map(goal => 
            `• ${goal.name}: ${formatCurrency(goal.currentAmount)} ya ${formatCurrency(goal.targetAmount)}`
          ).join('\n')}`
        }

        if (lowerMsg.includes("mkopo") || lowerMsg.includes("mikopo")) {
          if (!user) return "Tafadhali ingia kwanza kuona mikopo yako"
          if (!loans?.length) return "Huna mikopo kwa sasa"
          return `Mikopo yako:\n${loans.map(loan => 
            `• ${loan.purpose}: ${formatCurrency(loan.amount)} (${loan.status})`
          ).join('\n')}`
        }

        if (lowerMsg.includes("chama") || lowerMsg.includes("vyama")) {
          if (!user) return "Tafadhali ingia kwanza kuona vyama vyako"
          if (!chamas?.length) return "Hujajiunga na chama chochote"
          return `Vyama ulivyojiunga:\n${chamas.map(chama => 
            `• ${chama.name}: ${formatCurrency(chama.balance)} (${chama.memberCount} wanachama)`
          ).join('\n')}`
        }

        if (lowerMsg.includes("marakwa") || lowerMsg.includes("marakwa")) {
          if (!user) return "Tafadhali ingia kwanza kuona watu unaotuma pesa mara kwa mara"
          if (!frequentRecipients?.length) return "Huna watu unaotuma pesa mara kwa mara"
          return `Watu unaotuma pesa mara kwa mara:\n${frequentRecipients.slice(0, 5).map(recipient => 
            `• ${recipient.name}: ${formatCurrency(recipient.totalAmount)} (${recipient.count} mara)`
          ).join('\n')}`
        }

      } else {
        // English responses
        if (lowerMsg.includes("balance") || lowerMsg.includes("how much")) {
          if (!user) return "Please log in to check your balance"
          return `Your current balance is ${formatCurrency(balance)}`
        }

        if (lowerMsg.includes("transaction") || lowerMsg.includes("history")) {
          if (!user) return "Please log in to view transactions"
          if (!transactions?.length) return "No recent transactions found"
          return `Recent 5 transactions:\n${transactions.slice(0, 5).map(txn => 
            `• ${txn.description}: ${formatCurrency(txn.amount)} (${new Date(txn.date).toLocaleDateString()})`
          ).join('\n')}`
        }

        if (lowerMsg.includes("savings") || lowerMsg.includes("goal")) {
          if (!user) return "Please log in to view savings goals"
          if (!savingsGoals?.length) return "You don't have any savings goals"
          return `Your savings goals:\n${savingsGoals.map(goal => 
            `• ${goal.name}: ${formatCurrency(goal.currentAmount)} of ${formatCurrency(goal.targetAmount)}`
          ).join('\n')}`
        }

        if (lowerMsg.includes("loan") || lowerMsg.includes("debt")) {
          if (!user) return "Please log in to view your loans"
          if (!loans?.length) return "You don't have any active loans"
          return `Your loans:\n${loans.map(loan => 
            `• ${loan.purpose}: ${formatCurrency(loan.amount)} (${loan.status})`
          ).join('\n')}`
        }

        if (lowerMsg.includes("chama") || lowerMsg.includes("group")) {
          if (!user) return "Please log in to view your chamas"
          if (!chamas?.length) return "You haven't joined any chamas"
          return `Your chamas:\n${chamas.map(chama => 
            `• ${chama.name}: ${formatCurrency(chama.balance)} (${chama.memberCount} members)`
          ).join('\n')}`
        }

        if (lowerMsg.includes("frequent") || lowerMsg.includes("recipients")) {
          if (!user) return "Please log in to view frequent recipients"
          if (!frequentRecipients?.length) return "You don't have frequent recipients"
          return `People you send money to frequently:\n${frequentRecipients.slice(0, 5).map(recipient => 
            `• ${recipient.name}: ${formatCurrency(recipient.totalAmount)} (${recipient.count} times)`
          ).join('\n')}`
        }
      }

      return null
    } catch (error) {
      console.error("Financial query error:", error)
      return language === "sw" 
        ? "Samahani, sikuweza kupata taarifa zako za kifedha. Tafadhali jaribu tena baadaye." 
        : "Sorry, I couldn't fetch your financial data. Please try again later."
    }
  }

  const getGroqResponse = async (prompt: string): Promise<string> => {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [
            {
              role: "system",
              content: language === "sw" 
                ? `You are PesaBot, msaidizi wa kifedha wa Kenya. Kanuni:
1. Toa msaada wa kifedha kwa Kiswahili rahisi
2. Usishauri bei za hisa moja kwa moja
3. Toa majibu mafupi (vifungu 1-2)
4. Kwa data ya akaunti, sema "Angalia kwenye programu yako"
5. Usitoae taarifa za watu wengine`
                : `You are PesaBot, a Kenyan financial assistant. Rules:
1. Provide financial advice in simple ${language === "sw" ? "Swahili" : "English"}
2. Never recommend specific investments
3. Keep responses concise (1-2 sentences)
4. For account data, say "Check your app"
5. Never share other users' information`,
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)
      const data = await response.json()
      return data.choices[0]?.message?.content || 
        (language === "sw" ? "Sijaelewa, tafadhali uliza kwa njia nyingine" : "I didn't understand, please rephrase")
    } catch (error) {
      console.error("Groq API error:", error)
      return language === "sw" 
        ? "Nimekua na shida kiufundi. Jaribu tena baadaye." 
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
      // 1. Check for exit commands
      if (["bye", "kwaheri", "exit"].some(word => message.toLowerCase().includes(word))) {
        addBotMessage(language === "sw" ? "Kwaheri! Karibu tena muda wowote." : "Goodbye! Come back anytime.")
        return
      }

      // 2. Handle financial queries
      const financialResponse = await handleFinancialQuery(message)
      if (financialResponse) {
        addBotMessage(financialResponse)
        return
      }

      // 3. Get AI response for general questions
      const aiResponse = await getGroqResponse(message)
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