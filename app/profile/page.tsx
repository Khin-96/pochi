"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  CreditCard, 
  LogOut, 
  Camera, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { fetchUserProfile, updateUserProfile, updateNotificationPreferences, updateSecuritySettings, logout } from "@/lib/api"

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    // Fetch user profile data
    const fetchProfile = async () => {
      setIsLoading(true)
      try {
        const profileData = await fetchUserProfile()
        setUserData(profileData)
        setFormData({
          name: profileData.profile.name,
          email: profileData.profile.email,
          phone: profileData.profile.phone,
          location: profileData.profile.location,
          bio: profileData.profile.bio,
        })
      } catch (error) {
        console.error("Failed to fetch profile:", error)
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try again.",
          variant: "destructive",
        })
        
        // Fallback to mock data if API fails
        const mockUserData = {
          profile: {
            id: "user-001",
            name: "John Kamau",
            email: "john.kamau@example.com",
            phone: "+254 712 345 678",
            avatar: "/placeholder.svg",
            location: "Nairobi, Kenya",
            joinDate: "2023-09-15",
            verificationStatus: "verified",
            bio: "Passionate about community savings and investments. Active member of multiple chamas.",
          },
          stats: {
            chamasJoined: 3,
            totalSavings: 45000,
            totalInvestments: 75000,
            activeLoans: 1,
            currency: "KES",
          },
          notifications: {
            email: true,
            push: true,
            sms: false,
            marketing: false,
            chamaUpdates: true,
            transactionAlerts: true,
            investmentUpdates: true,
            loanReminders: true,
          },
          security: {
            twoFactorEnabled: true,
            lastPasswordChange: "2024-03-10",
            loginAlerts: true,
            transactionPinEnabled: true,
            biometricEnabled: false,
          },
          paymentMethods: [
            {
              id: "pm-001",
              type: "M-Pesa",
              number: "******6789",
              isDefault: true,
            },
            {
              id: "pm-002",
              type: "Bank Account",
              number: "****5432",
              bank: "Equity Bank",
              isDefault: false,
            }
          ],
          verificationDocuments: [
            {
              type: "ID Card",
              status: "verified",
              dateSubmitted: "2023-09-15",
              dateVerified: "2023-09-17",
            },
            {
              type: "Proof of Address",
              status: "verified",
              dateSubmitted: "2023-09-15",
              dateVerified: "2023-09-18",
            }
          ]
        }
        setUserData(mockUserData)
        setFormData({
          name: mockUserData.profile.name,
          email: mockUserData.profile.email,
          phone: mockUserData.profile.phone,
          location: mockUserData.profile.location,
          bio: mockUserData.profile.bio,
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProfile()
  }, [toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async () => {
    try {
      // Update profile via API
      const updatedProfile = await updateUserProfile(formData)
      
      // Update local state
      setUserData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          ...formData
        }
      }))
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
      
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleToggleNotification = async (key: string) => {
    try {
      const updatedPreferences = {
        ...userData.notifications,
        [key]: !userData.notifications[key as keyof typeof userData.notifications]
      }
      
      // Update via API
      await updateNotificationPreferences(updatedPreferences)
      
      // Update local state
      setUserData(prev => ({
        ...prev,
        notifications: updatedPreferences
      }))
      
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been updated.",
      })
    } catch (error) {
      console.error("Failed to update notification preferences:", error)
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleToggleSecurity = async (key: string) => {
    try {
      const updatedSettings = {
        ...userData.security,
        [key]: !userData.security[key as keyof typeof userData.security]
      }
      
      // Update via API
      await updateSecuritySettings(updatedSettings)
      
      // Update local state
      setUserData(prev => ({
        ...prev,
        security: updatedSettings
      }))
      
      toast({
        title: "Security settings updated",
        description: "Your security settings have been updated.",
      })
    } catch (error) {
      console.error("Failed to update security settings:", error)
      toast({
        title: "Error",
        description: "Failed to update security settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      window.location.href = "/login"
    } catch (error) {
      console.error("Failed to logout:", error)
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getVerificationStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Verified</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Rejected</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="space-y-4">
          <div className="h-8 w-1/3 bg-muted rounded animate-pulse"></div>
          <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
          <div className="grid gap-6 md:grid-cols-3 mt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>
        <Button variant="destructive" className="flex items-center" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center">
            <User className="h-4 w-4 mr-2" /> Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Shield className="h-4 w-4 mr-2" /> Security
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center">
            <CreditCard className="h-4 w-4 mr-2" /> Payment Methods
          </TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={userData.profile.avatar} alt={userData.profile.name} />
                    <AvatarFallback>{userData.profile.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">{userData.profile.name}</CardTitle>
                    <div className="flex items-center mt-1">
                      {getVerificationStatusBadge(userData.profile.verificationStatus)}
                      <span className="text-sm text-muted-foreground ml-2">
                        Member since {new Date(userData.profile.joinDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button onClick={handleSaveProfile}>Save Changes</Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isEditing ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{userData.profile.email}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{userData.profile.phone}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Location</div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{userData.profile.location}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Bio</div>
                    <p>{userData.profile.bio}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        value={formData.email} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input 
                        id="phone" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input 
                        id="location" 
                        name="location" 
                        value={formData.location} 
                        onChange={handleInputChange} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <textarea 
                      id="bio" 
                      name="bio" 
                      className="w-full p-2 border rounded-md min-h-[100px]" 
                      value={formData.bio} 
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Profile Picture</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={userData.profile.avatar} alt={userData.profile.name} />
                        <AvatarFallback>{userData.profile.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <Button variant="outline" size="sm">
                        <Camera className="h-4 w-4 mr-2" /> Change Photo
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-4">Account Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{userData.stats.chamasJoined}</div>
                      <div className="text-sm text-muted-foreground">Chamas Joined</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">
                        {new Intl.NumberFormat('en-KE', { 
                          style: 'currency', 
                          currency: userData.stats.currency,
                          maximumFractionDigits: 0
                        }).format(userData.stats.totalSavings)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Savings</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">
                        {new Intl.NumberFormat('en-KE', { 
                          style: 'currency', 
                          currency: userData.stats.currency,
                          maximumFractionDigits: 0
                        }).format(userData.stats.totalInvestments)}
                      </div>
                      <div className="text-sm text-muted-foreground">Investments</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{userData.stats.activeLoans}</div>
                      <div className="text-sm text-muted-foreground">Active Loans</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-4">Verification Documents</h3>
                <div className="space-y-4">
                  {userData.verificationDocuments.map((doc: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{doc.type}</div>
                        <div className="text-sm text-muted-foreground">
                          Submitted: {new Date(doc.dateSubmitted).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center">
                        {getVerificationStatusBadge(doc.status)}
                        {doc.status === "verified" && (
                          <div className="text-sm text-muted-foreground ml-2">
                            Verified on {new Date(doc.dateVerified).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    <Camera className="h-4 w-4 mr-2" /> Upload New Document
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications and updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Notification Channels</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <div className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </div>
                    </div>
                    <Switch 
                      id="email-notifications" 
                      checked={userData.notifications.email}
                      onCheckedChange={() => handleToggleNotification('email')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <div className="text-sm text-muted-foreground">
                        Receive notifications on your device
                      </div>
                    </div>
                    <Switch 
                      id="push-notifications" 
                      checked={userData.notifications.push}
                      onCheckedChange={() => handleToggleNotification('push')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <div className="text-sm text-muted-foreground">
                        Receive notifications via SMS
                      </div>
                    </div>
                    <Switch 
                      id="sms-notifications" 
                      checked={userData.notifications.sms}
                      onCheckedChange={() => handleToggleNotification('sms')}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-4">Notification Types</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="chama-updates">Chama Updates</Label>
                      <div className="text-sm text-muted-foreground">
                        Updates about your chama activities and events
                      </div>
                    </div>
                    <Switch 
                      id="chama-updates" 
                      checked={userData.notifications.chamaUpdates}
                      onCheckedChange={() => handleToggleNotification('chamaUpdates')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="transaction-alerts">Transaction Alerts</Label>
                      <div className="text-sm text-muted-foreground">
                        Notifications about deposits, withdrawals, and transfers
                      </div>
                    </div>
                    <Switch 
                      id="transaction-alerts" 
                      checked={userData.notifications.transactionAlerts}
                      onCheckedChange={() => handleToggleNotification('transactionAlerts')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="investment-updates">Investment Updates</Label>
                      <div className="text-sm text-muted-foreground">
                        Updates about your investment performance and opportunities
                      </div>
                    </div>
                    <Switch 
                      id="investment-updates" 
                      checked={userData.notifications.investmentUpdates}
                      onCheckedChange={() => handleToggleNotification('investmentUpdates')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="loan-reminders">Loan Reminders</Label>
                      <div className="text-sm text-muted-foreground">
                        Reminders about loan payments and updates
                      </div>
                    </div>
                    <Switch 
                      id="loan-reminders" 
                      checked={userData.notifications.loanReminders}
                      onCheckedChange={() => handleToggleNotification('loanReminders')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="marketing">Marketing Communications</Label>
                      <div className="text-sm text-muted-foreground">
                        Promotional offers and new feature announcements
                      </div>
                    </div>
                    <Switch 
                      id="marketing" 
                      checked={userData.notifications.marketing}
                      onCheckedChange={() => handleToggleNotification('marketing')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Save Notification Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security and authentication options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                    <div className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </div>
                  </div>
                  <Switch 
                    id="two-factor" 
                    checked={userData.security.twoFactorEnabled}
                    onCheckedChange={() => handleToggleSecurity('twoFactorEnabled')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="login-alerts">Login Alerts</Label>
                    <div className="text-sm text-muted-foreground">
                      Receive notifications when your account is accessed
                    </div>
                  </div>
                  <Switch 
                    id="login-alerts" 
                    checked={userData.security.loginAlerts}
                    onCheckedChange={() => handleToggleSecurity('loginAlerts')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="transaction-pin">Transaction PIN</Label>
                    <div className="text-sm text-muted-foreground">
                      Require PIN for all financial transactions
                    </div>
                  </div>
                  <Switch 
                    id="transaction-pin" 
                    checked={userData.security.transactionPinEnabled}
                    onCheckedChange={() => handleToggleSecurity('transactionPinEnabled')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="biometric">Biometric Authentication</Label>
                    <div className="text-sm text-muted-foreground">
                      Use fingerprint or face recognition to access your account
                    </div>
                  </div>
                  <Switch 
                    id="biometric" 
                    checked={userData.security.biometricEnabled}
                    onCheckedChange={() => handleToggleSecurity('biometricEnabled')}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-4">Password Management</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Password</div>
                      <div className="text-sm text-muted-foreground">
                        Last changed: {new Date(userData.security.lastPasswordChange).toLocaleDateString()}
                      </div>
                    </div>
                    <Button variant="outline">Change Password</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Transaction PIN</div>
                      <div className="text-sm text-muted-foreground">
                        Used for authorizing financial transactions
                      </div>
                    </div>
                    <Button variant="outline">Change PIN</Button>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-4">Session Management</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Active Sessions</div>
                      <div className="text-sm text-muted-foreground">
                        Manage devices where you're currently logged in
                      </div>
                    </div>
                    <Button variant="outline">View Sessions</Button>
                  </div>
                  <Button variant="destructive" className="w-full" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Log Out of All Devices
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Payment Methods Tab */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your payment and withdrawal options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Saved Payment Methods</h3>
                <div className="space-y-4">
                  {userData.paymentMethods.map((method: any) => (
                    <div key={method.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div className="flex items-center">
                        {method.type === "M-Pesa" ? (
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                            <Phone className="h-5 w-5 text-green-600" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{method.type}</div>
                          <div className="text-sm text-muted-foreground">
                            {method.number}
                            {method.bank && ` • ${method.bank}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {method.isDefault && (
                          <Badge className="mr-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Default
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4">
                  <CreditCard className="mr-2 h-4 w-4" /> Add Payment Method
                </Button>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-4">Auto-Payment Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-chama">Automatic Chama Contributions</Label>
                      <div className="text-sm text-muted-foreground">
                        Automatically pay your chama contributions when due
                      </div>
                    </div>
                    <Switch id="auto-chama" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-loan">Automatic Loan Repayments</Label>
                      <div className="text-sm text-muted-foreground">
                        Automatically pay your loan installments when due
                      </div>
                    </div>
                    <Switch id="auto-loan" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Save Payment Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

