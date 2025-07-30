"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Plus, PiggyBank, LineChart, CreditCard, Bot } from "lucide-react"
import { fetchDashboardData } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import TransactionList from "@/components/transaction-list"
import ChamaCard from "@/components/chama-card"
import DashboardSkeleton from "@/components/dashboard-skeleton"

interface DashboardData {
  user: {
    name: string
    avatar?: string
  }
  wallet: {
    balance: number
    currency: string
  }
  chamas: Array<{
    id: string
    name: string
    type: "private" | "public"
    memberCount: number
    maxMembers: number
    balance: number
    nextContribution?: {
      amount: number
      dueDate: string
    }
  }>
  transactions: Array<{
    id: string
    type: "credit" | "debit"
    amount: number
    description: string
    date: string
    isTest: boolean
  }>
  insights: Array<{
    message: string
    type: "tip" | "alert" | "achievement"
  }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const dashboardData = await fetchDashboardData()
        setData(dashboardData)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (!data) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Error loading dashboard</h1>
        <p className="text-muted-foreground mb-6">Unable to load your dashboard data. Please try again later.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {data?.user?.name ?? 'User'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/payments">
              <CreditCard className="mr-2 h-4 w-4" /> Send Money
            </Link>
          </Button>
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/chama-hub">
              <Users className="mr-2 h-4 w-4" /> Manage Chamas
            </Link>
          </Button>
        </div>
      </div>

      {/* Wallet Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data?.wallet?.balance ?? 0, data?.wallet?.currency ?? 'KES')}
            </div>
            <div className="text-sm text-muted-foreground">
              Test balance: {formatCurrency(data?.wallet?.testingBalance ?? 0, data?.wallet?.currency ?? 'KES')}
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button variant="outline" asChild className="justify-start">
              <Link href="/chama-hub">
                <Users className="mr-2 h-4 w-4" /> Join Chama
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/chama-hub">
                <Plus className="mr-2 h-4 w-4" /> Create Chama
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/savings">
                <PiggyBank className="mr-2 h-4 w-4" /> Savings
              </Link>
            </Button>
            <Button variant="outline" asChild className="justify-start">
              <Link href="/investments">
                <LineChart className="mr-2 h-4 w-4" /> Investments
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Chamas Section */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Chamas</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/chama-hub">View All</Link>
            </Button>
          </div>

          {(data?.chamas ?? []).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Chamas Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You haven&apos;t joined any chamas yet. Create or join one to get started.
                </p>
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <Link href="/chama-hub">Explore Chamas</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {(data?.chamas ?? []).slice(0, 4).map((chama) => (
                <ChamaCard key={chama.id} chama={chama} />
              ))}
            </div>
          )}
        </div>

        {/* Transactions & Insights */}
        <div className="space-y-6">
          {/* Transactions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Transactions</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/payments">View All</Link>
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <TransactionList 
                  transactions={(data?.transactions ?? []).slice(0, 5)} 
                  currency={data?.wallet?.currency ?? 'KES'} 
                />
              </CardContent>
            </Card>
          </div>

          {/* PesaBot Insights - Removed */}
        </div>
      </div>
    </div>
  )
}