// app/support/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  Users, 
  HelpCircle, 
  FileText, 
  CheckCircle, 
  Landmark, 
  CreditCard,
  Info,
  ShieldCheck
} from "lucide-react";

export default function SupportPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("faq");
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "general",
    description: "",
    priority: "medium",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const faqCategories = [
    {
      title: "Account & Profile",
      questions: [
        {
          q: "How do I update my profile information?",
          a: "You can update your profile information by navigating to the Profile section from your dashboard. Click on the edit icon next to each field to make changes."
        },
        {
          q: "What should I do if I forget my password?",
          a: "Click on the 'Forgot Password' link on the login page. We'll send a password reset link to your registered email address."
        }
      ]
    },
    {
      title: "Chamas & Groups",
      questions: [
        {
          q: "How do I create a new chama?",
          a: "From your dashboard, click on 'Create Chama' and fill in the required details including chama name, type, contribution amount, and frequency."
        },
        {
          q: "What's the difference between public and private chamas?",
          a: "Public chamas are visible to all users and anyone can request to join. Private chamas are invitation-only and not visible in the public directory."
        },
        {
          q: "How do I invite members to my chama?",
          a: "As a chama admin, navigate to your chama's admin panel and use the 'Invite Members' feature to generate invitation links or send direct invites."
        }
      ]
    },
    {
      title: "Payments & Transactions",
      questions: [
        {
          q: "How do I add funds to my account?",
          a: "Currently, we support manual balance updates through our payment partners. More payment options will be available soon."
        },
        {
          q: "Are there any transaction fees?",
          a: "PochiYangu doesn't charge any transaction fees for contributions or money transfers between users. Standard network fees may apply for certain payment methods."
        },
        {
          q: "How long do transactions take to process?",
          a: "Most transactions are processed instantly. In rare cases of system verification, it may take up to 24 hours."
        }
      ]
    },
    {
      title: "Security & Privacy",
      questions: [
        {
          q: "Is my financial data secure?",
          a: "Yes, we use bank-level encryption and security protocols to protect all your data. We never store your full banking details on our servers."
        },
        {
          q: "Who can see my chama activities?",
          a: "Only members of your chama can see the activities within that group. Your personal financial information is never shared with other members."
        }
      ]
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTicketForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // In a real implementation, this would call your API
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      setSubmitMessage("Thank you! Your support ticket has been submitted. We'll respond within 24 hours.");
      setTicketForm({
        subject: "",
        category: "general",
        description: "",
        priority: "medium",
      });
    } catch (error) {
      setSubmitMessage("There was an error submitting your ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
        <p className="text-muted-foreground">Get help with your PochiYangu account and services</p>
      </div>

      {/* Quick Stats */}
      {session?.user && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(session.user.balance || 0, "KES")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Chamas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3 Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0 Open</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="faq" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="faq">FAQs</TabsTrigger>
          <TabsTrigger value="contact">Contact Options</TabsTrigger>
          <TabsTrigger value="ticket">Submit Ticket</TabsTrigger>
        </TabsList>
        
        {/* FAQ Section */}
        <TabsContent value="faq" className="space-y-4">
          {faqCategories.map((category, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{category.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {category.questions.map((item, qIndex) => (
                  <div key={qIndex} className="pb-4 last:pb-0">
                    <h3 className="font-medium mb-2">{item.q}</h3>
                    <p className="text-sm text-muted-foreground">{item.a}</p>
                    {qIndex < category.questions.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        {/* Contact Options */}
        <TabsContent value="contact" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Email Support</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">support@pochi-yangu.com</div>
                <p className="text-xs text-muted-foreground">
                  Send us an email and we'll respond within 24 hours
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Phone Support</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+254 700 123 456</div>
                <p className="text-xs text-muted-foreground">
                  Available Monday to Friday, 8AM - 5PM EAT
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Live Chat</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Online</div>
                <p className="text-xs text-muted-foreground">
                  Chat with our support agents in real-time
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Community Forum</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Active</div>
                <p className="text-xs text-muted-foreground">
                  Get help from other PochiYangu users
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Office Address</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                PochiYangu Limited<br />
                ABC Place, 3rd Floor<br />
                Waiyaki Way, Nairobi<br />
                Kenya
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Ticket Submission */}
        <TabsContent value="ticket" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Submit a Support Ticket</CardTitle>
              <CardDescription>
                Fill out the form below to submit a support ticket to our team
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitMessage && (
                <div className={`mb-6 p-4 rounded-lg ${
                  submitMessage.includes("Thank you") 
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                }`}>
                  {submitMessage}
                </div>
              )}
              
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={ticketForm.subject}
                    onChange={handleInputChange}
                    placeholder="Brief description of your issue"
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      name="category" 
                      value={ticketForm.category} 
                      onValueChange={(value) => setTicketForm({...ticketForm, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Inquiry</SelectItem>
                        <SelectItem value="account">Account Issues</SelectItem>
                        <SelectItem value="chama">Chama Management</SelectItem>
                        <SelectItem value="payment">Payment Issues</SelectItem>
                        <SelectItem value="technical">Technical Problem</SelectItem>
                        <SelectItem value="suggestion">Feature Suggestion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select 
                      name="priority" 
                      value={ticketForm.priority} 
                      onValueChange={(value) => setTicketForm({...ticketForm, priority: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High (Urgent)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={5}
                    required
                    value={ticketForm.description}
                    onChange={handleInputChange}
                    placeholder="Please provide detailed information about your issue..."
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Submitting..." : "Submit Ticket"}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>What happens next?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Confirmation</h3>
                    <p className="text-sm text-muted-foreground">
                      You'll receive a confirmation email with your ticket number
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Review</h3>
                    <p className="text-sm text-muted-foreground">
                      Our support team will review your request
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Landmark className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Response</h3>
                    <p className="text-sm text-muted-foreground">
                      We'll contact you within 24 hours with assistance
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}