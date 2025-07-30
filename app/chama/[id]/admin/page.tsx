"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Settings,
  Users,
  UserPlus,
  UserMinus,
  Copy,
  Check,
  X,
  Shield,
  AlertCircle,
  Download,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  fetchChamaAdminData,
  addCoAdmin,
  removeCoAdmin,
  approveJoinRequest,
  rejectJoinRequest,
  toggleChamaVisibility,
  generateInviteLink,
  downloadReceipt,
} from "@/lib/api"
import { formatDate } from "@/lib/utils"
import AdminSkeleton from "@/components/admin-skeleton"

const addAdminSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
})

interface AdminData {
  chamaId: string
  chamaName: string
  type: "private" | "public"
  isPrimaryAdmin: boolean
  admins: Array<{
    id: string
    name: string
    email: string
    avatar?: string
    role: "primary" | "co-admin"
  }>
  pendingRequests: Array<{
    id: string
    userId: string
    name: string
    avatar?: string
    reason: string
    requestDate: string
  }>
  inviteLink?: string
}

export default function AdminPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("members")
  const [showAddAdminDialog, setShowAddAdminDialog] = useState(false)
  const [showRemoveAdminDialog, setShowRemoveAdminDialog] = useState(false)
  const [adminToRemove, setAdminToRemove] = useState<string | null>(null)
  const [isAddingAdmin, setIsAddingAdmin] = useState(false)
  const [isRemovingAdmin, setIsRemovingAdmin] = useState(false)
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const chamaId = params.id as string

  const form = useForm<z.infer<typeof addAdminSchema>>({
    resolver: zodResolver(addAdminSchema),
    defaultValues: {
      email: "",
    },
  })

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const data = await fetchChamaAdminData(chamaId)
        setAdminData(data)
      } catch (error) {
        console.error("Failed to fetch admin data:", error)
        toast({
          title: "Error",
          description: "Failed to load admin data. Please try again.",
          variant: "destructive",
        })
        router.push(`/chama/${chamaId}`)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [chamaId, toast, router])

  async function onSubmitAddAdmin(values: z.infer<typeof addAdminSchema>) {
    setIsAddingAdmin(true)
    try {
      const newAdmin = await addCoAdmin(chamaId, values.email)
      setAdminData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          admins: [...prev.admins, newAdmin],
        }
      })
      toast({
        title: "Co-admin added",
        description: `${newAdmin.name} has been added as a co-admin.`,
      })
      setShowAddAdminDialog(false)
      form.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add co-admin. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingAdmin(false)
    }
  }

  async function handleRemoveAdmin() {
    if (!adminToRemove) return

    setIsRemovingAdmin(true)
    try {
      await removeCoAdmin(chamaId, adminToRemove)
      setAdminData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          admins: prev.admins.filter((admin) => admin.id !== adminToRemove),
        }
      })
      toast({
        title: "Co-admin removed",
        description: "The co-admin has been removed successfully.",
      })
      setShowRemoveAdminDialog(false)
      setAdminToRemove(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove co-admin. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRemovingAdmin(false)
    }
  }

  async function handleApproveRequest(requestId: string) {
    try {
      await approveJoinRequest(chamaId, requestId)
      setAdminData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          pendingRequests: prev.pendingRequests.filter((req) => req.id !== requestId),
        }
      })
      toast({
        title: "Request approved",
        description: "The user has been added to the chama.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve request. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function handleRejectRequest(requestId: string) {
    try {
      await rejectJoinRequest(chamaId, requestId)
      setAdminData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          pendingRequests: prev.pendingRequests.filter((req) => req.id !== requestId),
        }
      })
      toast({
        title: "Request rejected",
        description: "The join request has been rejected.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject request. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function handleToggleVisibility() {
    if (!adminData) return

    setIsTogglingVisibility(true)
    try {
      const newType = adminData.type === "private" ? "public" : "private"
      await toggleChamaVisibility(chamaId, newType)
      setAdminData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          type: newType,
        }
      })
      toast({
        title: "Visibility updated",
        description: `Chama is now ${newType}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update visibility. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsTogglingVisibility(false)
    }
  }

  async function handleGenerateInviteLink() {
    setIsGeneratingLink(true)
    try {
      const link = await generateInviteLink(chamaId)
      setAdminData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          inviteLink: link,
        }
      })
      toast({
        title: "Invite link generated",
        description: "The link has been copied to your clipboard.",
      })
      navigator.clipboard.writeText(link)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate invite link. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingLink(false)
    }
  }

  async function handleDownloadReceipt() {
    setIsDownloading(true)
    try {
      await downloadReceipt(chamaId)
      toast({
        title: "Receipt downloaded",
        description: "The receipt has been downloaded successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download receipt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading) {
    return <AdminSkeleton />
  }

  if (!adminData) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Admin access required</h1>
        <p className="text-muted-foreground mb-6">You don't have admin access to this chama.</p>
        <Button asChild>
          <Link href={`/chama/${chamaId}`}>Return to Chama</Link>
        </Button>
      </div>
    )
  }

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
            <h1 className="text-2xl font-bold">{adminData.chamaName}</h1>
            <p className="text-muted-foreground">Admin Settings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownloadReceipt} disabled={isDownloading}>
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? "Downloading..." : "Download Receipt"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" /> Member Management
          </TabsTrigger>
          <TabsTrigger value="admins">
            <Shield className="mr-2 h-4 w-4" /> Admin Roles
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" /> Chama Settings
          </TabsTrigger>
        </TabsList>

        {/* Member Management Tab */}
        <TabsContent value="members" className="space-y-4">
          {/* Pending Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                Pending Join Requests
                {adminData.pendingRequests.length > 0 && (
                  <Badge className="ml-2 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                    {adminData.pendingRequests.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Review and manage requests to join the chama</CardDescription>
            </CardHeader>
            <CardContent>
              {adminData.pendingRequests.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No pending requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {adminData.pendingRequests.map((request) => (
                    <div key={request.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={request.avatar || "/placeholder.svg?height=40&width=40"}
                            alt={request.name}
                          />
                          <AvatarFallback>{request.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{request.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Requested on {formatDate(request.requestDate)}
                          </p>
                          <p className="text-sm mt-1">
                            <span className="font-medium">Reason:</span> {request.reason}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApproveRequest(request.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invite Members */}
          <Card>
            <CardHeader>
              <CardTitle>Invite Members</CardTitle>
              <CardDescription>Generate an invite link to share with potential members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {adminData.inviteLink ? (
                <div className="flex items-center gap-2">
                  <Input value={adminData.inviteLink} readOnly className="flex-1" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(adminData.inviteLink || "")
                      toast({
                        title: "Copied to clipboard",
                        description: "The invite link has been copied.",
                      })
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleGenerateInviteLink}
                  disabled={isGeneratingLink}
                >
                  {isGeneratingLink ? "Generating..." : "Generate Invite Link"}
                </Button>
              )}
              <p className="text-sm text-muted-foreground">
                This link will allow users to join the chama directly without approval.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Roles Tab */}
        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Management</CardTitle>
              <CardDescription>Manage admin roles for your chama</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {adminData.admins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={admin.avatar || "/placeholder.svg?height=40&width=40"} alt={admin.name} />
                        <AvatarFallback>{admin.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{admin.name}</h4>
                        <div className="flex items-center">
                          <Badge
                            className={
                              admin.role === "primary"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            }
                          >
                            {admin.role === "primary" ? "Primary Admin" : "Co-Admin"}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-2">{admin.email}</span>
                        </div>
                      </div>
                    </div>
                    {adminData.isPrimaryAdmin && admin.role !== "primary" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => {
                          setAdminToRemove(admin.id)
                          setShowRemoveAdminDialog(true)
                        }}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {adminData.isPrimaryAdmin && adminData.admins.length < 3 && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 mt-4"
                  onClick={() => setShowAddAdminDialog(true)}
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Add Co-Admin
                </Button>
              )}

              {adminData.isPrimaryAdmin && adminData.admins.length >= 3 && (
                <div className="rounded-md bg-muted p-4 text-sm">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Maximum of 2 co-admins reached.</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chama Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chama Settings</CardTitle>
              <CardDescription>Adjust settings for your chama</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <div className="text-base font-medium">Chama Visibility</div>
                  <div className="text-sm text-muted-foreground">
                    {adminData.type === "private"
                      ? "Your chama is private (invite only)"
                      : "Your chama is public (discoverable)"}
                  </div>
                </div>
                <Button variant="outline" onClick={handleToggleVisibility} disabled={isTogglingVisibility}>
                  {isTogglingVisibility ? "Updating..." : adminData.type === "private" ? "Make Public" : "Make Private"}
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <div className="text-base font-medium">Download Chama Records</div>
                  <div className="text-sm text-muted-foreground">
                    Download a receipt of all transactions and member contributions
                  </div>
                </div>
                <Button variant="outline" onClick={handleDownloadReceipt} disabled={isDownloading}>
                  {isDownloading ? "Downloading..." : "Download Receipt"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Co-Admin Dialog */}
      <Dialog open={showAddAdminDialog} onOpenChange={setShowAddAdminDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Co-Admin</DialogTitle>
            <DialogDescription>Enter the email address of the user you want to add as a co-admin.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitAddAdmin)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email" {...field} />
                    </FormControl>
                    <FormDescription>This is the email address of the co-admin you want to add.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddAdminDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isAddingAdmin}>
                  {isAddingAdmin ? "Adding..." : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Remove Co-Admin Dialog */}
      <Dialog open={showRemoveAdminDialog} onOpenChange={setShowRemoveAdminDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Co-Admin</DialogTitle>
            <DialogDescription>Are you sure you want to remove this co-admin?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveAdminDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleRemoveAdmin} disabled={isRemovingAdmin}>
              {isRemovingAdmin ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
