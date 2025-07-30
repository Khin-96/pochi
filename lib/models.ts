// MongoDB models and types for the application

export interface User {
  _id?: string
  name: string
  email: string
  phone: string
  password: string // This would be hashed in a real application
  createdAt: Date
  balance: number
  testingBalance: number
}

export interface Chama {
  _id?: string
  name: string
  type: "private" | "public"
  description: string
  rules?: string
  contributionAmount: number
  contributionFrequency: "weekly" | "biweekly" | "monthly"
  maxMembers: number
  memberCount: number
  balance: number
  testBalance: number
  createdAt: Date
  createdBy: string // User ID
  members: ChamaMember[]
  allowWelfare: boolean
}

export interface ChamaMember {
  userId: string
  name: string
  avatar?: string
  role: "admin" | "member" | "primary"
  joinDate: Date
}

export interface Transaction {
  _id?: string
  userId: string
  chamaId?: string
  type: "contribution" | "welfare" | "investment" | "payout" | "deposit" | "withdrawal" | "loan" | "loan_repayment"
  amount: number
  description: string
  date: Date
  isTest: boolean
  status: "pending" | "completed" | "failed"
}

export interface JoinRequest {
  _id?: string
  chamaId: string
  userId: string
  name: string
  avatar?: string
  reason: string
  requestDate: Date
  status: "pending" | "approved" | "rejected"
}

export interface Proposal {
  _id?: string
  chamaId: string
  title: string
  description: string
  createdBy: {
    userId: string
    name: string
  }
  createdAt: Date
  deadline: Date
  status: "active" | "completed" | "expired"
  options: string[]
  votes: {
    userId: string
    option: string
  }[]
}

export interface ChatMessage {
  _id?: string
  chamaId: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: Date
  isPesaBot?: boolean
}

export interface Loan {
  _id?: string
  userId: string
  amount: number
  interestRate: number
  term: number // in months
  purpose: string
  status: "pending" | "approved" | "rejected" | "active" | "paid"
  requestDate: Date
  approvalDate?: Date
  dueDate?: Date
  payments: {
    amount: number
    date: Date
  }[]
}

export interface SavingsGoal {
  _id?: string
  userId: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline?: Date
  category: string
  createdAt: Date
}

export interface Investment {
  _id?: string
  userId: string
  type: "stocks" | "bonds" | "mutual_funds" | "real_estate" | "other"
  amount: number
  description: string
  purchaseDate: Date
  currentValue: number
  lastUpdated: Date
}

export interface PesaBotChat {
  _id?: string
  userId: string
  messages: {
    id: string
    content: string
    sender: "user" | "bot"
    timestamp: Date
  }[]
  createdAt: Date
  updatedAt: Date
}
