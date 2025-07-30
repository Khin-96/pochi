"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Vote, Plus, Check, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchVotingProposals, createProposal, submitVote, fetchChamaBasicInfo } from "@/lib/api"
import { formatDate, formatTimeRemaining } from "@/lib/utils"
import VotingSkeleton from "@/components/voting-skeleton"

const createProposalSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  description: z.string().min(10, {
    message: "Please provide a detailed description.",
  }),
  deadline: z.string().refine(
    (value) => {
      const date = new Date(value)
      const now = new Date()
      return date > now
    },
    {
      message: "Deadline must be in the future.",
    },
  ),
  options: z
    .array(z.string())
    .min(2, {
      message: "At least two options are required.",
    })
    .default(["Yes", "No"]),
})

interface Proposal {
  id: string
  title: string
  description: string
  createdBy: {
    id: string
    name: string
  }
  createdAt: string
  deadline: string
  status: "active" | "completed" | "expired"
  options: string[]
  results: {
    [key: string]: number
  }
  totalVotes: number
  userVote?: string
}

interface ChamaBasicInfo {
  id: string
  name: string
  isAdmin: boolean
}

export default function VotingPage() {
  const params = useParams()
  const { toast } = useToast()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [chamaInfo, setChamaInfo] = useState<ChamaBasicInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const chamaId = params.id as string

  const form = useForm<z.infer<typeof createProposalSchema>>({
    resolver: zodResolver(createProposalSchema),
    defaultValues: {
      title: "",
      description: "",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 days from now
      options: ["Yes", "No"],
    },
  })

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [votingData, basicInfo] = await Promise.all([fetchVotingProposals(chamaId), fetchChamaBasicInfo(chamaId)])
        setProposals(votingData)
        setChamaInfo(basicInfo)
      } catch (error) {
        console.error("Failed to fetch voting data:", error)
        toast({
          title: "Error",
          description: "Failed to load voting proposals. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [chamaId, toast])

  async function onSubmit(values: z.infer<typeof createProposalSchema>) {
    setIsCreating(true)
    try {
      const newProposal = await createProposal(chamaId, values)
      setProposals((prev) => [newProposal, ...prev])
      toast({
        title: "Proposal created!",
        description: "Your proposal has been created successfully.",
      })
      setShowCreateDialog(false)
      form.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create proposal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  async function handleVote(proposalId: string, option: string) {
    setIsVoting(true)
    try {
      await submitVote(chamaId, proposalId, option)

      // Update the local state to reflect the vote
      setProposals((prev) =>
        prev.map((proposal) => {
          if (proposal.id === proposalId) {
            const updatedResults = { ...proposal.results }
            // If user already voted, decrement the previous vote
            if (proposal.userVote) {
              updatedResults[proposal.userVote] -= 1
            } else {
              // If this is a new vote, increment total votes
              proposal.totalVotes += 1
            }
            // Increment the new vote
            updatedResults[option] = (updatedResults[option] || 0) + 1

            return {
              ...proposal,
              results: updatedResults,
              userVote: option,
            }
          }
          return proposal
        }),
      )

      toast({
        title: "Vote submitted!",
        description: `You voted "${option}" on this proposal.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit vote. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsVoting(false)
    }
  }

  if (isLoading) {
    return <VotingSkeleton />
  }

  if (!chamaInfo) {
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

  const activeProposals = proposals.filter((p) => p.status === "active")
  const pastProposals = proposals.filter((p) => p.status !== "active")

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/chama/${chamaId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{chamaInfo.name}</h1>
            <p className="text-muted-foreground">Voting & Proposals</p>
          </div>
        </div>
        {chamaInfo.isAdmin && (
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Proposal
          </Button>
        )}
      </div>

      {/* Active Proposals */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Proposals</h2>

        {activeProposals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Vote className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Active Proposals</h3>
              <p className="text-sm text-muted-foreground mb-4">
                There are no active proposals to vote on at the moment.
              </p>
              {chamaInfo.isAdmin && (
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowCreateDialog(true)}>
                  Create a Proposal
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeProposals.map((proposal) => (
              <Card key={proposal.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{proposal.title}</CardTitle>
                      <CardDescription>
                        Created by {proposal.createdBy.name} on {formatDate(proposal.createdAt)}
                      </CardDescription>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 flex items-center">
                      <Clock className="mr-1 h-3 w-3" /> {formatTimeRemaining(proposal.deadline)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{proposal.description}</p>

                  <div className="space-y-3">
                    {proposal.options.map((option) => {
                      const voteCount = proposal.results[option] || 0
                      const percentage =
                        proposal.totalVotes > 0 ? Math.round((voteCount / proposal.totalVotes) * 100) : 0

                      return (
                        <div key={option} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{option}</span>
                            <span className="text-sm text-muted-foreground">
                              {voteCount} votes ({percentage}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-3">
                  <Separator />
                  {proposal.userVote ? (
                    <div className="text-sm text-center w-full">
                      You voted <span className="font-medium">{proposal.userVote}</span>
                    </div>
                  ) : (
                    <div className="flex justify-center gap-2 w-full">
                      {proposal.options.map((option) => (
                        <Button
                          key={option}
                          variant="outline"
                          onClick={() => handleVote(proposal.id, option)}
                          disabled={isVoting}
                        >
                          Vote {option}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past Proposals */}
      {pastProposals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Past Proposals</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pastProposals.map((proposal) => (
              <Card key={proposal.id} className="opacity-80">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{proposal.title}</CardTitle>
                      <CardDescription>
                        Created by {proposal.createdBy.name} on {formatDate(proposal.createdAt)}
                      </CardDescription>
                    </div>
                    <Badge
                      className={
                        proposal.status === "completed"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                          : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                      }
                    >
                      {proposal.status === "completed" ? "Completed" : "Expired"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{proposal.description}</p>

                  <div className="space-y-3">
                    {proposal.options.map((option) => {
                      const voteCount = proposal.results[option] || 0
                      const percentage =
                        proposal.totalVotes > 0 ? Math.round((voteCount / proposal.totalVotes) * 100) : 0
                      const isWinner =
                        proposal.status === "completed" && voteCount === Math.max(...Object.values(proposal.results))

                      return (
                        <div key={option} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className={`text-sm ${isWinner ? "font-bold" : "font-medium"}`}>
                              {option} {isWinner && <Check className="inline h-4 w-4 text-green-600" />}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {voteCount} votes ({percentage}%)
                            </span>
                          </div>
                          <Progress
                            value={percentage}
                            className={`h-2 ${isWinner ? "bg-green-100 dark:bg-green-900" : ""}`}
                          />
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
                {proposal.userVote && (
                  <CardFooter>
                    <div className="text-sm text-center w-full">
                      You voted <span className="font-medium">{proposal.userVote}</span>
                    </div>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create Proposal Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create a New Proposal</DialogTitle>
            <DialogDescription>
              Create a proposal for chama members to vote on. Set a clear title, description, and deadline.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposal Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Increase monthly contribution" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide details about your proposal..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voting Deadline</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>The proposal will close for voting on this date.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Proposal"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
