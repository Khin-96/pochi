"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Users, Lock, Globe, Search, Plus, ArrowRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchChamas, fetchPublicChamas, createChama, joinChama } from "@/lib/api"
import ChamaCard from "@/components/chama-card"

const createChamaSchema = z.object({
  name: z.string().min(3, {
    message: "Chama name must be at least 3 characters.",
  }),
  type: z.enum(["private", "public"]),
  contributionAmount: z.coerce.number().min(100, {
    message: "Minimum contribution is 100 KES.",
  }),
  contributionFrequency: z.enum(["weekly", "biweekly", "monthly"]),
  maxMembers: z.coerce.number().min(2).max(130),
  description: z.string().min(10, {
    message: "Please provide a brief description of your chama.",
  }),
  rules: z.string().optional(),
  allowWelfare: z.boolean().default(true),
})

interface Chama {
  id: string
  name: string
  type: "private" | "public"
  memberCount: number
  maxMembers: number
  balance: number
  description: string
  nextContribution?: {
    amount: number
    dueDate: string
  }
}

interface PublicChama {
  id: string
  name: string
  memberCount: number
  maxMembers: number
  description: string
  contributionAmount: number
  contributionFrequency: string
}

export default function ChamaHubPage() {
  const [activeTab, setActiveTab] = useState("my-chamas")
  const [myChamas, setMyChamas] = useState<Chama[]>([])
  const [publicChamas, setPublicChamas] = useState<PublicChama[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof createChamaSchema>>({
    resolver: zodResolver(createChamaSchema),
    defaultValues: {
      name: "",
      type: "private",
      contributionAmount: 500,
      contributionFrequency: "monthly",
      maxMembers: 20,
      description: "",
      rules: "",
      allowWelfare: true,
    },
  })

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        if (activeTab === "my-chamas") {
          const data = await fetchChamas()
          setMyChamas(data)
        } else if (activeTab === "explore") {
          const data = await fetchPublicChamas()
          setPublicChamas(data)
        }
      } catch (error) {
        console.error("Failed to fetch chamas:", error)
        toast({
          title: "Error",
          description: "Failed to load chamas. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [activeTab, toast])

  async function onSubmit(values: z.infer<typeof createChamaSchema>) {
    setIsCreating(true)
    try {
      const newChama = await createChama(values)
      toast({
        title: "Chama created!",
        description: `${values.name} has been created successfully.`,
      })
      router.push(`/chama/${newChama.id}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create chama. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  async function handleJoinChama(chamaId: string) {
    try {
      await joinChama(chamaId)
      toast({
        title: "Join request sent",
        description: "Your request to join this chama has been sent to the admins.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send join request. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredPublicChamas = publicChamas.filter((chama) =>
    chama.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Chama Hub</h1>
        <p className="text-muted-foreground">Manage your chamas, create new ones, or discover public chamas to join</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-chamas">
            <Users className="mr-2 h-4 w-4" /> My Chamas
          </TabsTrigger>
          <TabsTrigger value="create">
            <Plus className="mr-2 h-4 w-4" /> Create Chama
          </TabsTrigger>
          <TabsTrigger value="explore">
            <Globe className="mr-2 h-4 w-4" /> Explore
          </TabsTrigger>
        </TabsList>

        {/* My Chamas Tab */}
        <TabsContent value="my-chamas" className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
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
          ) : myChamas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Chamas Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You haven&apos;t joined any chamas yet. Create a new one or explore public chamas to join.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setActiveTab("explore")}>
                    Explore Chamas
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={() => setActiveTab("create")}>
                    Create Chama
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {myChamas.map((chama) => (
                <ChamaCard key={chama.id} chama={chama} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Create Chama Tab */}
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create a New Chama</CardTitle>
              <CardDescription>
                Set up your chama with the details below. You&apos;ll be the primary admin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chama Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Nairobi Entrepreneurs Chama" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chama Type</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="private" />
                              </FormControl>
                              <FormLabel className="font-normal flex items-center">
                                <Lock className="mr-2 h-4 w-4" /> Private (Invite only, max 80 members)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="public" />
                              </FormControl>
                              <FormLabel className="font-normal flex items-center">
                                <Globe className="mr-2 h-4 w-4" /> Public (Discoverable, max 130 members)
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="contributionAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contribution Amount (KES)</FormLabel>
                          <FormControl>
                            <Input type="number" min={100} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contributionFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contribution Frequency</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                            >
                              <option value="weekly">Weekly</option>
                              <option value="biweekly">Bi-weekly</option>
                              <option value="monthly">Monthly</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="maxMembers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Members</FormLabel>
                        <FormControl>
                          <Input type="number" min={2} max={form.watch("type") === "private" ? 80 : 130} {...field} />
                        </FormControl>
                        <FormDescription>
                          {form.watch("type") === "private"
                            ? "Private chamas can have up to 80 members"
                            : "Public chamas can have up to 130 members"}
                        </FormDescription>
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
                            placeholder="Describe the purpose of your chama and who it's for..."
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
                    name="rules"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chama Rules (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List any specific rules or policies for your chama..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          You can specify rules for contributions, penalties, and dispute resolution.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowWelfare"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Allow Welfare Requests</FormLabel>
                          <FormDescription>Members can request welfare support from the chama funds</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isCreating}>
                    {isCreating ? "Creating Chama..." : "Create Chama"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Explore Tab */}
        <TabsContent value="explore" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search public chamas..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
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
          ) : filteredPublicChamas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Public Chamas Found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery
                    ? `No chamas matching "${searchQuery}" were found.`
                    : "There are no public chamas available to join at the moment."}
                </p>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => setActiveTab("create")}>
                  Create Your Own Chama
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredPublicChamas.map((chama) => (
                <Card key={chama.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{chama.name}</CardTitle>
                        <CardDescription>
                          {chama.memberCount}/{chama.maxMembers} members
                        </CardDescription>
                      </div>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Public
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{chama.description}</p>
                    <div className="flex justify-between text-sm mb-4">
                      <span>Contribution: {chama.contributionAmount} KES</span>
                      <span>Frequency: {chama.contributionFrequency}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handleJoinChama(chama.id)}
                    >
                      Request to Join <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
