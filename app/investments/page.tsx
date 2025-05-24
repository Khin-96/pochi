"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { LineChart, BarChart, PieChart, TrendingUp, AlertCircle, Info, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

// Mock data - would be replaced with actual API calls
const mockInvestments = {
  portfolio: {
    totalValue: 125000,
    totalReturn: 12.5,
    currency: "KES",
    allocation: [
      { category: "Stocks", percentage: 40, value: 50000, return: 15.2 },
      { category: "Bonds", percentage: 25, value: 31250, return: 8.5 },
      { category: "Chama Funds", percentage: 20, value: 25000, return: 18.7 },
      { category: "Real Estate", percentage: 10, value: 12500, return: 9.2 },
      { category: "Cash", percentage: 5, value: 6250, return: 4.0 }
    ]
  },
  opportunities: [
    {
      id: "inv-001",
      name: "Chama Growth Fund",
      type: "Chama Investment",
      risk: "Medium",
      minAmount: 5000,
      expectedReturn: "15-18%",
      term: "1-3 years",
      description: "A diversified fund investing in high-performing chamas across Kenya with proven track records.",
      members: 342,
      trending: true
    },
    {
      id: "inv-002",
      name: "African Tech Ventures",
      type: "Equity",
      risk: "High",
      minAmount: 10000,
      expectedReturn: "20-25%",
      term: "3-5 years",
      description: "Investment in promising African tech startups with high growth potential.",
      members: 156,
      trending: true
    },
    {
      id: "inv-003",
      name: "Community Housing Project",
      type: "Real Estate",
      risk: "Low-Medium",
      minAmount: 25000,
      expectedReturn: "12-15%",
      term: "5-7 years",
      description: "Investment in affordable housing developments across major urban centers.",
      members: 89,
      trending: false
    },
    {
      id: "inv-004",
      name: "Government Infrastructure Bond",
      type: "Fixed Income",
      risk: "Low",
      minAmount: 3000,
      expectedReturn: "8-10%",
      term: "2-4 years",
      description: "Government-backed bonds funding critical infrastructure projects.",
      members: 521,
      trending: false
    }
  ],
  performance: [
    { month: "Jan", return: 2.1 },
    { month: "Feb", return: 1.8 },
    { month: "Mar", return: -0.5 },
    { month: "Apr", return: 1.2 },
    { month: "May", return: 2.4 },
    { month: "Jun", return: 1.9 },
    { month: "Jul", return: 0.8 },
    { month: "Aug", return: 1.5 },
    { month: "Sep", return: 2.2 },
    { month: "Oct", return: -0.3 },
    { month: "Nov", return: 1.7 },
    { month: "Dec", return: 2.3 }
  ]
}

export default function InvestmentsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("portfolio")
  const [data, setData] = useState(mockInvestments)

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "low-medium": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Investments</h1>
        <p className="text-muted-foreground">Grow your wealth with our curated investment opportunities</p>
      </div>

      <Tabs defaultValue="portfolio" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="portfolio">My Portfolio</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.portfolio.totalValue, data.portfolio.currency)}
                </div>
                <div className="flex items-center pt-1 text-xs">
                  <span className={`flex items-center ${data.portfolio.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {data.portfolio.totalReturn >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                    {Math.abs(data.portfolio.totalReturn)}%
                  </span>
                  <span className="text-muted-foreground ml-2">All time</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Portfolio Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.portfolio.allocation.map((item) => (
                    <div key={item.category} className="grid grid-cols-6 gap-2 items-center">
                      <div className="col-span-2 text-sm font-medium">{item.category}</div>
                      <div className="col-span-2">
                        <Progress value={item.percentage} className="h-2" />
                      </div>
                      <div className="text-sm text-right">{item.percentage}%</div>
                      <div className={`text-xs text-right ${item.return >= 10 ? 'text-green-500' : item.return >= 5 ? 'text-blue-500' : 'text-muted-foreground'}`}>
                        +{item.return}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  <PieChart className="h-4 w-4 mr-2" /> Rebalance Portfolio
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Investment Recommendations</CardTitle>
              <CardDescription>Personalized recommendations based on your goals and risk profile</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid gap-4 p-6 sm:grid-cols-2 md:grid-cols-3">
                {data.opportunities.slice(0, 3).map((opportunity) => (
                  <Card key={opportunity.id} className="border-dashed">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{opportunity.name}</CardTitle>
                        {opportunity.trending && (
                          <Badge variant="secondary" className="ml-2">
                            <TrendingUp className="h-3 w-3 mr-1" /> Trending
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{opportunity.type}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-muted-foreground">Expected Return</div>
                          <div className="font-medium text-green-600">{opportunity.expectedReturn}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Min. Investment</div>
                          <div className="font-medium">{formatCurrency(opportunity.minAmount, data.portfolio.currency)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Risk Level</div>
                          <Badge variant="outline" className={getRiskColor(opportunity.risk)}>
                            {opportunity.risk}
                          </Badge>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Term</div>
                          <div className="font-medium">{opportunity.term}</div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button size="sm" className="w-full">Invest Now</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 px-6">
              <div className="flex justify-between items-center w-full">
                <div className="text-sm text-muted-foreground">
                  <Info className="h-4 w-4 inline mr-1" /> 
                  Investments carry risks. Review terms before investing.
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="#opportunities">View All</Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Investment Opportunities</CardTitle>
              <CardDescription>Discover curated investment options aligned with your financial goals</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid gap-4 p-6 sm:grid-cols-2">
                {data.opportunities.map((opportunity) => (
                  <Card key={opportunity.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{opportunity.name}</CardTitle>
                        {opportunity.trending && (
                          <Badge variant="secondary">
                            <TrendingUp className="h-3 w-3 mr-1" /> Trending
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{opportunity.type}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">{opportunity.description}</p>
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div>
                          <div className="text-muted-foreground">Expected Return</div>
                          <div className="font-medium text-green-600">{opportunity.expectedReturn}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Min. Investment</div>
                          <div className="font-medium">{formatCurrency(opportunity.minAmount, data.portfolio.currency)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Risk Level</div>
                          <Badge variant="outline" className={getRiskColor(opportunity.risk)}>
                            {opportunity.risk}
                          </Badge>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Term</div>
                          <div className="font-medium">{opportunity.term}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Members</div>
                          <div className="font-medium">{opportunity.members.toLocaleString()}</div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline">Learn More</Button>
                      <Button>Invest Now</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 px-6">
              <div className="flex items-center w-full text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 mr-2" />
                <p>
                  All investments involve risk and may lose value. Past performance is not indicative of future results.
                  Please review the investment terms and risk disclosures before investing.
                </p>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Track your investment performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border-b pb-4">
                <div className="text-center">
                  <LineChart className="h-16 w-16 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Performance chart visualization would appear here
                  </p>
                </div>
              </div>
              <div className="pt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">1 Month Return</div>
                  <div className="text-2xl font-bold text-green-600">+2.3%</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">6 Month Return</div>
                  <div className="text-2xl font-bold text-green-600">+8.7%</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">1 Year Return</div>
                  <div className="text-2xl font-bold text-green-600">+12.5%</div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex gap-2 w-full">
                <Button variant="outline" className="flex-1">
                  <BarChart className="h-4 w-4 mr-2" /> Compare to Market
                </Button>
                <Button variant="outline" className="flex-1">
                  <LineChart className="h-4 w-4 mr-2" /> Export Report
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
              <CardDescription>Detailed breakdown of your returns by month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {data.performance.map((month) => (
                  <div key={month.month} className="text-center p-2 rounded-lg border">
                    <div className="text-sm font-medium">{month.month}</div>
                    <div className={`text-lg font-bold ${month.return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {month.return > 0 ? '+' : ''}{month.return}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
