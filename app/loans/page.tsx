"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { AlertCircle, CheckCircle, Clock, CreditCard, FileText, HelpCircle, Info, Landmark, ShieldCheck } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

// Mock data - would be replaced with actual API calls
const mockLoans = {
  currency: "KES",
  eligibility: {
    score: 85,
    maxAmount: 100000,
    interestRate: 12.5,
    term: 12,
  },
  activeLoans: [
    {
      id: "loan-001",
      amount: 25000,
      remainingAmount: 15000,
      interestRate: 12.5,
      term: 12,
      monthsRemaining: 7,
      nextPayment: {
        amount: 2344,
        dueDate: "2025-06-15",
      },
      status: "active",
      purpose: "Business Expansion",
      dateIssued: "2024-11-15",
    },
  ],
  loanHistory: [
    {
      id: "loan-h001",
      amount: 15000,
      interestRate: 12.5,
      term: 6,
      status: "completed",
      purpose: "Emergency Funds",
      dateIssued: "2024-05-10",
      dateCompleted: "2024-11-10",
    },
    {
      id: "loan-h002",
      amount: 5000,
      interestRate: 10.0,
      term: 3,
      status: "completed",
      purpose: "Education",
      dateIssued: "2024-02-15",
      dateCompleted: "2024-05-15",
    },
  ],
  loanTypes: [
    {
      id: "type-001",
      name: "Personal Loan",
      description: "Quick access to funds for personal needs with flexible repayment options.",
      minAmount: 5000,
      maxAmount: 100000,
      interestRange: "12.5% - 15%",
      termRange: "3 - 24 months",
      requirements: ["Active Pochi account for at least 3 months", "Regular income or active chama membership"],
      processingTime: "24-48 hours",
    },
    {
      id: "type-002",
      name: "Chama Group Loan",
      description: "Collective loans for chama groups with lower interest rates and shared responsibility.",
      minAmount: 50000,
      maxAmount: 500000,
      interestRange: "10% - 12%",
      termRange: "6 - 36 months",
      requirements: ["Active chama with at least 5 members", "Regular contributions for at least 6 months"],
      processingTime: "3-5 business days",
    },
    {
      id: "type-003",
      name: "Business Boost",
      description: "Financing for small businesses and entrepreneurs to fuel growth and expansion.",
      minAmount: 20000,
      maxAmount: 250000,
      interestRange: "13% - 16%",
      termRange: "6 - 36 months",
      requirements: ["Business documentation", "6+ months of business transaction history"],
      processingTime: "3-5 business days",
    },
    {
      id: "type-004",
      name: "Emergency Loan",
      description: "Rapid access to funds for urgent needs with expedited processing.",
      minAmount: 1000,
      maxAmount: 30000,
      interestRange: "15% - 18%",
      termRange: "1 - 12 months",
      requirements: ["Active Pochi account", "Good repayment history"],
      processingTime: "Same day - 24 hours",
    },
  ],
}

export default function LoansPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [data, setData] = useState(mockLoans)
  
  // Loan calculator state
  const [loanAmount, setLoanAmount] = useState(10000)
  const [loanTerm, setLoanTerm] = useState(6)
  const [monthlyPayment, setMonthlyPayment] = useState(0)
  const [totalPayment, setTotalPayment] = useState(0)
  
  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Calculate loan payments when amount or term changes
  useEffect(() => {
    const rate = data.eligibility.interestRate / 100 / 12
    const payment = (loanAmount * rate * Math.pow(1 + rate, loanTerm)) / (Math.pow(1 + rate, loanTerm) - 1)
    setMonthlyPayment(payment)
    setTotalPayment(payment * loanTerm)
  }, [loanAmount, loanTerm, data.eligibility.interestRate])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "overdue": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="space-y-4">
          <div className="h-8 w-1/3 bg-muted rounded animate-pulse"></div>
          <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
          <div className="grid gap-6 md:grid-cols-2 mt-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Loans</h1>
        <p className="text-muted-foreground">Access flexible financing options tailored to your needs</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="apply">Apply for Loan</TabsTrigger>
          <TabsTrigger value="active">Active Loans</TabsTrigger>
          <TabsTrigger value="history">Loan History</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Loan Eligibility</CardTitle>
                <CardDescription>Your current borrowing capacity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Credit Score</span>
                    <span className="text-sm font-medium">{data.eligibility.score}/100</span>
                  </div>
                  <Progress value={data.eligibility.score} className="h-2" />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-muted-foreground">Poor</span>
                    <span className="text-xs text-muted-foreground">Excellent</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Maximum Amount</div>
                    <div className="text-lg font-bold">
                      {formatCurrency(data.eligibility.maxAmount, data.currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Interest Rate</div>
                    <div className="text-lg font-bold">{data.eligibility.interestRate}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Maximum Term</div>
                    <div className="text-lg font-bold">{data.eligibility.term} months</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="#apply" onClick={() => setActiveTab("apply")}>
                    Apply for a Loan
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Loan Calculator</CardTitle>
                <CardDescription>Estimate your monthly payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loan-amount">Loan Amount ({formatCurrency(loanAmount, data.currency)})</Label>
                  <Slider
                    id="loan-amount"
                    min={5000}
                    max={data.eligibility.maxAmount}
                    step={1000}
                    value={[loanAmount]}
                    onValueChange={(value) => setLoanAmount(value[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(5000, data.currency)}</span>
                    <span>{formatCurrency(data.eligibility.maxAmount, data.currency)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="loan-term">Loan Term ({loanTerm} months)</Label>
                  <Slider
                    id="loan-term"
                    min={3}
                    max={24}
                    step={1}
                    value={[loanTerm]}
                    onValueChange={(value) => setLoanTerm(value[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>3 months</span>
                    <span>24 months</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Monthly Payment</div>
                    <div className="text-lg font-bold">
                      {formatCurrency(monthlyPayment, data.currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Payment</div>
                    <div className="text-lg font-bold">
                      {formatCurrency(totalPayment, data.currency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Interest Rate</div>
                    <div className="text-lg font-bold">{data.eligibility.interestRate}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Interest</div>
                    <div className="text-lg font-bold">
                      {formatCurrency(totalPayment - loanAmount, data.currency)}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="text-sm text-muted-foreground flex items-center w-full">
                  <Info className="h-4 w-4 mr-2" />
                  This is an estimate. Actual terms may vary based on eligibility.
                </div>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Available Loan Types</CardTitle>
              <CardDescription>Explore our range of loan options designed for different needs</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid gap-4 p-6 sm:grid-cols-2">
                {data.loanTypes.map((loanType) => (
                  <Card key={loanType.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{loanType.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm">{loanType.description}</p>
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div>
                          <div className="text-muted-foreground">Amount Range</div>
                          <div className="font-medium">
                            {formatCurrency(loanType.minAmount, data.currency)} - {formatCurrency(loanType.maxAmount, data.currency)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Interest Rate</div>
                          <div className="font-medium">{loanType.interestRange}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Term</div>
                          <div className="font-medium">{loanType.termRange}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Processing</div>
                          <div className="font-medium">{loanType.processingTime}</div>
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-muted-foreground mb-1">Requirements</div>
                        <ul className="list-disc pl-5 space-y-1">
                          {loanType.requirements.map((req, index) => (
                            <li key={index}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" asChild>
                        <Link href="#apply" onClick={() => setActiveTab("apply")}>
                          Apply Now
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Apply Tab */}
        <TabsContent value="apply" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loan Application</CardTitle>
              <CardDescription>Complete the form below to apply for a loan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="loan-type">Loan Type</Label>
                  <select className="w-full p-2 border rounded-md" id="loan-type">
                    <option value="">Select a loan type</option>
                    {data.loanTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loan-purpose">Loan Purpose</Label>
                  <select className="w-full p-2 border rounded-md" id="loan-purpose">
                    <option value="">Select purpose</option>
                    <option value="business">Business</option>
                    <option value="education">Education</option>
                    <option value="emergency">Emergency</option>
                    <option value="medical">Medical</option>
                    <option value="personal">Personal</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-amount">Amount ({data.currency})</Label>
                  <Input type="number" id="app-amount" placeholder="Enter amount" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-term">Term (months)</Label>
                  <Input type="number" id="app-term" placeholder="Enter term" />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="app-details">Additional Details</Label>
                <textarea 
                  id="app-details" 
                  className="w-full p-2 border rounded-md min-h-[100px]" 
                  placeholder="Provide any additional information to support your application"
                ></textarea>
              </div>
              
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="terms" className="rounded" />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the loan terms and conditions, and consent to credit checks
                </Label>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button className="w-full">Submit Application</Button>
              <div className="text-sm text-muted-foreground flex items-center">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Your information is secure and will only be used for loan processing
              </div>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Application Process</CardTitle>
              <CardDescription>What to expect after you apply</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex">
                  <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">1. Application Review</h3>
                    <p className="text-sm text-muted-foreground">
                      We'll review your application and verify the information provided.
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">2. Approval Decision</h3>
                    <p className="text-sm text-muted-foreground">
                      You'll receive a notification about your loan approval status.
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Landmark className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">3. Disbursement</h3>
                    <p className="text-sm text-muted-foreground">
                      Approved funds will be disbursed directly to your Pochi wallet.
                    </p>
                  </div>
                </div>
                <div className="flex">
                  <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">4. Repayment</h3>
                    <p className="text-sm text-muted-foreground">
                      Make monthly payments according to your agreed schedule.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Active Loans Tab */}
        <TabsContent value="active" className="space-y-4">
          {data.activeLoans.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Loans</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You don't have any active loans at the moment.
                </p>
                <Button asChild>
                  <Link href="#apply" onClick={() => setActiveTab("apply")}>Apply for a Loan</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {data.activeLoans.map((loan) => (
                <Card key={loan.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>
                          {formatCurrency(loan.amount, data.currency)} Loan
                        </CardTitle>
                        <CardDescription>{loan.purpose}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(loan.status)}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Remaining Balance</div>
                        <div className="text-lg font-bold">
                          {formatCurrency(loan.remainingAmount, data.currency)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Next Payment</div>
                        <div className="text-lg font-bold">
                          {formatCurrency(loan.nextPayment.amount, data.currency)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Due on {new Date(loan.nextPayment.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Interest Rate</div>
                        <div className="text-lg font-bold">{loan.interestRate}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Remaining Term</div>
                        <div className="text-lg font-bold">{loan.monthsRemaining} months</div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Repayment Progress</span>
                        <span className="text-sm font-medium">
                          {Math.round(((loan.term - loan.monthsRemaining) / loan.term) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={((loan.term - loan.monthsRemaining) / loan.term) * 100} 
                        className="h-2" 
                      />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          Issue Date: {new Date(loan.dateIssued).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {loan.term} months term
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">View Details</Button>
                    <Button>Make Payment</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Loan History Tab */}
        <TabsContent value="history" className="space-y-4">
          {data.loanHistory.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Loan History</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You haven't taken any loans with us yet.
                </p>
                <Button asChild>
                  <Link href="#apply" onClick={() => setActiveTab("apply")}>Apply for Your First Loan</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Loan History</CardTitle>
                <CardDescription>Record of your previous loans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.loanHistory.map((loan) => (
                    <div key={loan.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg">
                      <div className="mb-2 sm:mb-0">
                        <div className="font-medium">{formatCurrency(loan.amount, data.currency)} Loan</div>
                        <div className="text-sm text-muted-foreground">{loan.purpose}</div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Interest Rate</div>
                          <div>{loan.interestRate}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Term</div>
                          <div>{loan.term} months</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Issued</div>
                          <div>{new Date(loan.dateIssued).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Completed</div>
                          <div>{new Date(loan.dateCompleted).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(loan.status)} className="mt-2 sm:mt-0 sm:ml-4">
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <div className="text-sm text-muted-foreground flex items-center w-full">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Need help understanding your loan history? Chat with PesaBot for assistance.
                </div>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
