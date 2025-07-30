"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PiggyBank, Plus, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchSavingsGoals, createSavingsGoal, contributeToSavingsGoal, getCurrentUser } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

const createGoalSchema = z.object({
  name: z.string().min(3, {
    message: "Goal name must be at least 3 characters.",
  }),
  targetAmount: z.coerce.number().min(100, {
    message: "Target amount must be at least 100 KES.",
  }),
  deadline: z.string().optional(),
  category: z.string().min(1, {
    message: "Please select a category.",
  }),
})

const contributeSchema = z.object({
  amount: z.coerce.number().min(50, {
    message: "Contribution must be at least 50 KES.",
  }),
})

interface SavingsGoal {
  _id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  category: string
  createdAt: string
}

interface UserData {
  _id: string
  balance: number
  // Add other user properties as needed
}

export default function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showContributeDialog, setShowContributeDialog] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isContributing, setIsContributing] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const createForm = useForm<z.infer<typeof createGoalSchema>>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      name: "",
      targetAmount: 0,
      deadline: "",
      category: "",
    },
  })

  const contributeForm = useForm<z.infer<typeof contributeSchema>>({
    resolver: zodResolver(contributeSchema),
    defaultValues: {
      amount: 0,
    },
  })

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [userData, savingsData] = await Promise.all([
          getCurrentUser(),
          fetchSavingsGoals()
        ])

        if (!userData) {
          throw new Error("User not authenticated")
        }

        setUser(userData)
        setGoals(savingsData?.goals || [])
      } catch (error) {
        console.error("Failed to fetch savings data:", error)
        toast({
          title: "Error",
          description: "Failed to load savings data. Please try again.",
          variant: "destructive",
        })
        router.push("/login") // Redirect if not authenticated
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [toast, router])

  async function onCreateGoal(values: z.infer<typeof createGoalSchema>) {
    setIsCreating(true)
    try {
      const newGoal = await createSavingsGoal(values)
      setGoals(prev => [...prev, {
        ...newGoal,
        currentAmount: 0 // Ensure new goal starts at 0
      }])
      toast({
        title: "Goal created!",
        description: "Your savings goal has been created successfully.",
      })
      setShowCreateDialog(false)
      createForm.reset()
    } catch (error) {
      console.error("Error creating goal:", error)
      toast({
        title: "Error",
        description: "Failed to create savings goal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  async function onContributeToGoal(values: z.infer<typeof contributeSchema>) {
    if (!selectedGoal || !user) return

    setIsContributing(true)
    try {
      if (values.amount > (user.balance || 0)) {
        throw new Error("Insufficient balance")
      }

      await contributeToSavingsGoal(selectedGoal._id, values.amount)

      // Update local state
      setGoals(prev =>
        prev.map(goal => 
          goal._id === selectedGoal._id 
            ? { ...goal, currentAmount: goal.currentAmount + values.amount }
            : goal
        )
      )

      // Update user balance
      setUser(prev => prev ? { ...prev, balance: prev.balance - values.amount } : null)

      toast({
        title: "Contribution successful!",
        description: `You've contributed ${formatCurrency(values.amount, "KES")} to your ${selectedGoal.name} goal.`,
      })

      setShowContributeDialog(false)
      contributeForm.reset()
    } catch (error) {
      console.error("Error contributing:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to contribute to savings goal",
        variant: "destructive",
      })
    } finally {
      setIsContributing(false)
    }
  }

  const categories = [
    { value: "emergency", label: "Emergency Fund" },
    { value: "education", label: "Education" },
    { value: "home", label: "Home Purchase" },
    { value: "car", label: "Vehicle" },
    { value: "vacation", label: "Vacation" },
    { value: "wedding", label: "Wedding" },
    { value: "retirement", label: "Retirement" },
    { value: "other", label: "Other" },
  ]

  const getCategoryLabel = (value: string) => {
    return categories.find(cat => cat.value === value)?.label || value
  }

  const totalSavings = goals.reduce((total, goal) => total + (goal.currentAmount || 0), 0)
  const balance = user?.balance || 0

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
          <p className="text-muted-foreground">Track your progress towards financial goals</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create New Goal
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance, "KES")}</div>
            <p className="text-xs text-muted-foreground">Your actual balance</p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalSavings, "KES")}
            </div>
            <p className="text-xs text-muted-foreground">Across all your savings goals</p>
          </CardContent>
        </Card>
      </div>

      {/* Savings Goals */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Savings Goals</h2>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-48 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 w-3/4 bg-muted rounded mb-4"></div>
                  <div className="h-4 w-1/2 bg-muted rounded mb-2"></div>
                  <div className="h-4 w-2/3 bg-muted rounded mb-4"></div>
                  <div className="h-8 w-full bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : goals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <PiggyBank className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Savings Goals Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first savings goal to start tracking your progress.
              </p>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowCreateDialog(true)}>
                Create Your First Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            
{goals.map((goal) => {
  const progress = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);

  return (
    <Card key={goal._id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{goal.name}</CardTitle>
                        <CardDescription>{getCategoryLabel(goal.category)}</CardDescription>
                      </div>
                      {goal.deadline && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(goal.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {formatCurrency(goal.currentAmount, "KES")}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(goal.targetAmount, "KES")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setSelectedGoal(goal)
                        setShowContributeDialog(true)
                      }}
                    >
                      <PiggyBank className="mr-2 h-4 w-4" /> Add to Savings
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Goal Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create a New Savings Goal</DialogTitle>
            <DialogDescription>
              Set up a new savings goal to help you track your progress towards financial targets.
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateGoal)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Emergency Fund, New Car" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Amount (KES)</FormLabel>
                    <FormControl>
                      <Input type="number" min={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>When do you want to reach this goal?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Goal"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Contribute Dialog */}
      <Dialog open={showContributeDialog} onOpenChange={setShowContributeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add to Your Savings</DialogTitle>
            <DialogDescription>
              {selectedGoal && `Contribute to your ${selectedGoal.name} savings goal.`}
            </DialogDescription>
          </DialogHeader>
          <Form {...contributeForm}>
            <form onSubmit={contributeForm.handleSubmit(onContributeToGoal)} className="space-y-4">
              <FormField
                control={contributeForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (KES)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={50} 
                        max={user?.balance || 0}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Available balance: {formatCurrency(user?.balance || 0, "KES")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setShowContributeDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isContributing}>
                  {isContributing ? "Processing..." : "Add to Savings"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}