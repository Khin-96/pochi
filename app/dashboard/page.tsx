"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Plus, PiggyBank, LineChart, CreditCard } from "lucide-react"
import { getCurrentUser } from "@/lib/auth" // Import from auth.ts instead of api.ts
import { fetchDashboardData } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import TransactionList from "@/components/transaction-list"
import ChamaCard from "@/components/chama-card"
import DashboardSkeleton from "@/components/dashboard-skeleton"

interface DashboardData {
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
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user from auth.ts
        const user = await getCurrentUser()
        setCurrentUser(user)
        
        // Fetch dashboard data
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

  if (!currentUser) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
        <p className="text-muted-foreground mb-6">Please log in to access your dashboard.</p>
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={currentUser?.avatar} />
            <AvatarFallback>
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {currentUser?.name ?? 'User'}</p>
          </div>
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
            <CardTitle className="text-sm font-medium">Main Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentUser?.balance ?? 0, 'KES')}
            </div>
            <div className="text-sm text-muted-foreground">
              Test balance: {formatCurrency(currentUser?.testingBalance ?? 1000, 'KES')}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Account Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Email:</span> {currentUser?.email}</p>
              <p><span className="font-medium">Phone:</span> {currentUser?.phone}</p>
              <p><span className="font-medium">Member since:</span> {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</p>
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
                  currency={'KES'} 
                />
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Account Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total Balance:</span>
                <span className="font-medium">{formatCurrency(currentUser?.balance ?? 0, 'KES')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Testing Funds:</span>
                <span className="font-medium">{formatCurrency(currentUser?.testingBalance ?? 1000, 'KES')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Active Chamas:</span>
                <span className="font-medium">{(data?.chamas ?? []).length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}