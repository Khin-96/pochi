"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"
import { sendMoney, fetchTransactions, getCurrentUser } from "@/lib/api"

const sendMoneySchema = z.object({
  recipientPhone: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
  amount: z.coerce.number().min(50, {
    message: "Amount must be at least 50 KES.",
  }),
  description: z.string().min(3, {
    message: "Please provide a brief description.",
  }),
})

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof sendMoneySchema>>({
    resolver: zodResolver(sendMoneySchema),
    defaultValues: {
      recipientPhone: "",
      amount: 0,
      description: "",
    },
  })

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [userData, transactionsData] = await Promise.all([
          getCurrentUser(),
          fetchTransactions(),
        ])
        
        setUser(userData)
        setTransactions(transactionsData)
      } catch (error) {
        console.error("Failed to fetch payments data:", error)
        toast({
          title: "Error",
          description: "Failed to load payments data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [toast])

  async function onSubmit(values: z.infer<typeof sendMoneySchema>) {
    setIsSending(true)
    try {
      await sendMoney(values.recipientPhone, values.amount, values.description)

//
