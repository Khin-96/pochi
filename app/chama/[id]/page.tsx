"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Lock,
  Globe,
  Calendar,
  Download,
  Send,
  MessageSquare,
  Vote,
  Settings,
  PiggyBank,
  ArrowRight,
  Plus,
  AlertCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchChamaDetails, contributeToChama, requestWelfare, leaveChama } from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/utils"
import MembersList from "@/components/members-list"
import TransactionList from "@/components/transaction-list"
import ChamaSkeleton from "@/components/chama-skeleton"

interface ChamaDetails {
  id: string
  name: string
  type: "private" | "public"
  description: string
  rules: string
  memberCount: number
  maxMembers: number
  balance: number
  testBalance: number
  currency: string
  isAdmin: boolean
  isPrimaryAdmin: boolean
  contributionAmount: number
  contributionFrequency: string
  nextContribution: {
    amount: number
    dueDate: string
  }
  members: Array<{
    id: string
    name: string
    avatar?: string
    role: "admin" | "member"
    joinDate: string
  }>
  transactions: Array<{
    id: string
    type: "contribution" | "welfare" | "investment" | "payout"
    amount: number
    description: string
    date: string
    memberId: string
    memberName: string
    isTest: boolean
  }>
  pendingRequests?: number
}

export default function ChamaPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [chamaDetails, setChamaDetails] = useState<ChamaDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [contributionAmount, setContributionAmount] = useState("")
  const [welfareAmount, setWelfareAmount] = useState("")
  const [welfareReason, setWelfareReason] = useState("")
  const [isContributing, setIsContributing] = useState(false)
  const [isRequestingWelfare, setIsRequestingWelfare] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)

  const chamaId = params.id as string

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const data = await fetchChamaDetails(chamaId)
        setChamaDetails(data)
        setContributionAmount(data.contributionAmount.toString())
      } catch (error) {
        console.error("Failed to fetch chama details:", error)
        toast({
          title: "Error",
          description: "Failed to load chama details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [chamaId, toast])

  async function handleContribute() {
    setIsContributing(true)
    try {
      const amount = Number.parseFloat(contributionAmount)
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount")
      }

      await contributeToChama(chamaId, amount)
      toast({
        title: "Contribution successful!",
        description: `You've contributed ${amount} KES to the chama.`,
      })

      // Refresh chama details
      const updatedData = await fetchChamaDetails(chamaId)
      setChamaDetails(updatedData)
    } catch (error) {
      toast({
        title: "Contribution failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsContributing(false)
    }
  }

  async function handleWelfareRequest() {
    setIsRequestingWelfare(true)
    try {
      const amount = Number.parseFloat(welfareAmount)
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid amount")
      }

      if (!welfareReason.trim()) {
        throw new Error("Please provide a reason for your request")
      }

      await requestWelfare(chamaId, amount, welfareReason)
      toast({
        title: "Welfare request submitted",
        description: "Your request has been sent to the chama admins for approval.",
      })

      setWelfareAmount("")
      setWelfareReason("")

      // Refresh chama details
      const updatedData = await fetchChamaDetails(chamaId)
      setChamaDetails(updatedData)
    } catch (error) {
      toast({
        title: "Request failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsRequestingWelfare(false)
    }
  }

  async function handleLeaveChama() {
    setIsLeaving(true)
    try {
      await leaveChama(chamaId)
      toast({
        title: "Left chama",
        description: "You have successfully left the chama.",
      })
      router.push("/chama-hub")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to leave chama. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLeaving(false)
      setShowLeaveDialog(false)
    }
  }

  if (isLoading) {
    return <ChamaSkeleton />
  }

  if (!chamaDetails) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Chama not found</h1>
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
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{chamaDetails.name}</h1>
            <Badge
              className={
                chamaDetails.type === "private"
                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
              }
            >
              {chamaDetails.type === "private" ? (
                <>
                  <Lock className="mr-1 h-3 w-3" /> Private
                </>
              ) : (
                <>
                  <Globe className="mr-1 h-3 w-3" /> Public
                </>
              )}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {chamaDetails.memberCount}/{chamaDetails.maxMembers} members
          </p>
        </div>
        <div className="flex items-center gap-2">
          {chamaDetails.isAdmin && (
            <Button asChild variant="outline">
              <Link href={`/chama/${chamaId}/admin`}>
                <Settings className="mr-2 h-4 w-4" /> Admin Settings
              </Link>
            </Button>
          )}
          {!chamaDetails.isPrimaryAdmin && (
            <Button
              variant="outline"
              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={() => setShowLeaveDialog(true)}
            >
              Leave Chama
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Chama Info */}
        <div className="space-y-6">
          {/* Balance Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Chama Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(chamaDetails.balance, chamaDetails.currency)}</div>
              {chamaDetails.testBalance > 0 && (
                <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                  + {formatCurrency(chamaDetails.testBalance, chamaDetails.currency)} (Test)
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Contribution Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Calendar className="mr-2 h-4 w-4" /> Next Contribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xl font-bold">
                  {formatCurrency(chamaDetails.nextContribution.amount, chamaDetails.currency)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Due by {formatDate(chamaDetails.nextContribution.dueDate)}
                </p>
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => document.getElementById("contribute-dialog")?.click()}
              >
                <PiggyBank className="mr-2 h-4 w-4" /> Contribute Now
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/chama/${chamaId}/chat`}>
                  <MessageSquare className="mr-2 h-4 w-4" /> Group Chat
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/chama/${chamaId}/voting`}>
                  <Vote className="mr-2 h-4 w-4" /> Voting & Proposals
                </Link>
              </Button>
              {chamaDetails.isAdmin && (
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="#" onClick={() => document.getElementById("download-receipt")?.click()}>
                    <Download className="mr-2 h-4 w-4" /> Download Receipt
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => document.getElementById("welfare-dialog")?.click()}
              >
                <Send className="mr-2 h-4 w-4" /> Request Welfare
              </Button>
            </CardContent>
          </Card>

          {/* Admin Alerts */}
          {chamaDetails.isAdmin && chamaDetails.pendingRequests && chamaDetails.pendingRequests > 0 && (
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center text-orange-600 dark:text-orange-400">
                  <AlertCircle className="mr-2 h-4 w-4" /> Admin Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm p-2 rounded-lg bg-orange-50 dark:bg-orange-950 text-orange-800 dark:text-orange-300">
                  {chamaDetails.pendingRequests} pending join request{chamaDetails.pendingRequests > 1 ? "s" : ""}
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/chama/${chamaId}/admin`}>
                    Review Requests <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Middle and Right Columns */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>About this Chama</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground">{chamaDetails.description}</p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium mb-2">Contribution Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Amount:</p>
                        <p>{formatCurrency(chamaDetails.contributionAmount, chamaDetails.currency)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Frequency:</p>
                        <p className="capitalize">{chamaDetails.contributionFrequency}</p>
                      </div>
                    </div>
                  </div>

                  {chamaDetails.rules && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-medium mb-2">Chama Rules</h3>
                        <p className="text-sm text-muted-foreground">{chamaDetails.rules}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <TransactionList
                    transactions={chamaDetails.transactions.slice(0, 5).map((t) => ({
                      id: t.id,
                      type: t.type === "contribution" ? "credit" : "debit",
                      amount: t.amount,
                      description: t.description,
                      date: t.date,
                      isTest: t.isTest,
                    }))}
                    currency={chamaDetails.currency}
                  />
                </CardContent>
                <CardFooter className="pt-2 pb-4">
                  <Button variant="ghost" size="sm" className="w-full" asChild>
                    <Link href="#" onClick={() => document.querySelector('[data-value="transactions"]')?.click()}>
                      View All Transactions
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Members</CardTitle>
                    <CardDescription>
                      {chamaDetails.memberCount} out of {chamaDetails.maxMembers} members
                    </CardDescription>
                  </div>
                  {chamaDetails.isAdmin && (
                    <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
                      <Link href={`/chama/${chamaId}/admin`}>
                        <Plus className="mr-2 h-4 w-4" /> Add Member
                      </Link>
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <MembersList members={chamaDetails.members} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>All contributions, welfare payments, and investments</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {chamaDetails.transactions.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-muted-foreground">No transactions yet</p>
                    </div>
                  ) : (
                    <TransactionList
                      transactions={chamaDetails.transactions.map((t) => ({
                        id: t.id,
                        type: t.type === "contribution" ? "credit" : "debit",
                        amount: t.amount,
                        description: t.description,
                        date: t.date,
                        isTest: t.isTest,
                      }))}
                      currency={chamaDetails.currency}
                      showAll
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Contribute Dialog */}
      <Dialog>
        <DialogTrigger id="contribute-dialog" className="hidden">
          Open
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contribute to Chama</DialogTitle>
            <DialogDescription>
              Make a contribution to your chama. The suggested amount is{" "}
              {formatCurrency(chamaDetails.contributionAmount, chamaDetails.currency)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({chamaDetails.currency})</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
              />
            </div>
            <div className="rounded-md bg-muted p-4">
              <div className="text-sm font-medium">Note:</div>
              <div className="text-sm text-muted-foreground mt-1">
                This will use your testing balance of {formatCurrency(1000, chamaDetails.currency)} for demonstration
                purposes.
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => document.getElementById("contribute-dialog-close")?.click()}>
              Cancel
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleContribute} disabled={isContributing}>
              {isContributing ? "Processing..." : "Contribute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Welfare Request Dialog */}
      <Dialog>
        <DialogTrigger id="welfare-dialog" className="hidden">
          Open
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Welfare</DialogTitle>
            <DialogDescription>
              Request financial support from the chama. Your request will be reviewed by the admins.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="welfare-amount">Amount ({chamaDetails.currency})</Label>
              <Input
                id="welfare-amount"
                type="number"
                min="1"
                value={welfareAmount}
                onChange={(e) => setWelfareAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="welfare-reason">Reason for Request</Label>
              <Input
                id="welfare-reason"
                value={welfareReason}
                onChange={(e) => setWelfareReason(e.target.value)}
                placeholder="Briefly explain why you need this support"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => document.getElementById("welfare-dialog-close")?.click()}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleWelfareRequest}
              disabled={isRequestingWelfare}
            >
              {isRequestingWelfare ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Chama Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Chama</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this chama? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-md bg-red-50 dark:bg-red-950 p-4 text-red-800 dark:text-red-300">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <div className="text-sm font-medium">Warning:</div>
              </div>
              <div className="text-sm mt-1">
                Leaving the chama may affect your ability to access funds you've contributed. Please check the chama
                rules regarding departures.
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLeaveChama} disabled={isLeaving}>
              {isLeaving ? "Leaving..." : "Leave Chama"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
