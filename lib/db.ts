import clientPromise from "./mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import type { User, Chama, Transaction, JoinRequest, Loan, SavingsGoal, Investment } from "./models"

// Database collections
const DB_NAME = "pochiyangu"
const COLLECTIONS = {
  USERS: "users",
  CHAMAS: "chamas",
  TRANSACTIONS: "transactions",
  JOIN_REQUESTS: "join_requests",
  PROPOSALS: "proposals",
  CHAT_MESSAGES: "chat_messages",
  LOANS: "loans",
  SAVINGS_GOALS: "savings_goals",
  INVESTMENTS: "investments",
  PESABOT_CHATS: "pesabot_chats", // Added new collection for PesaBot chats
}

// User functions
export async function createUser(userData: Omit<User, "_id" | "createdAt" | "balance" | "testingBalance">) {
  const client = await clientPromise
  const db = client.db(DB_NAME)

  // Check if user already exists
  const existingUser = await db.collection(COLLECTIONS.USERS).findOne({ email: userData.email })
  if (existingUser) {
    throw new Error("User with this email already exists")
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(userData.password, 10)

  const newUser: User = {
    ...userData,
    password: hashedPassword,
    createdAt: new Date(),
    balance: 0,
    testingBalance: 1000, // New users get 1000 KES testing balance
  }

  const result = await db.collection(COLLECTIONS.USERS).insertOne(newUser)
  return { ...newUser, _id: result.insertedId }
}

export async function findUserByEmail(email: string) {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  return db.collection(COLLECTIONS.USERS).findOne({ email }) as Promise<User | null>
}

export async function findUserById(id: string) {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  return db.collection(COLLECTIONS.USERS).findOne({ _id: new ObjectId(id) }) as Promise<User | null>
}

export async function verifyUserCredentials(email: string, password: string) {
  const user = await findUserByEmail(email)
  if (!user) return null

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) return null

  // Don't return the password
  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword
}

export async function updateUserBalance(userId: string, amount: number, isTestBalance = false) {
  const client = await clientPromise
  const db = client.db(DB_NAME)

  const updateField = isTestBalance ? "testingBalance" : "balance"

  const result = await db
    .collection(COLLECTIONS.USERS)
    .updateOne({ _id: new ObjectId(userId) }, { $inc: { [updateField]: amount } })

  return result.modifiedCount > 0
}

// Chama functions
export async function createChama(
  chamaData: Omit<Chama, "_id" | "createdAt" | "memberCount" | "balance" | "testBalance" | "members">,
  userId: string,
  userName: string,
) {
  const client = await clientPromise
  const db = client.db(DB_NAME)

  const newChama: Chama = {
    ...chamaData,
    createdAt: new Date(),
    memberCount: 1,
    balance: 0,
    testBalance: 0,
    createdBy: userId,
    members: [
      {
        userId,
        name: userName,
        role: "primary",
        joinDate: new Date(),
      },
    ],
  }

  const result = await db.collection(COLLECTIONS.CHAMAS).insertOne(newChama)
  return { ...newChama, _id: result.insertedId }
}

export async function findChamaById(id: string) {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  return db.collection(COLLECTIONS.CHAMAS).findOne({ _id: new ObjectId(id) }) as Promise<Chama | null>
}

export async function findChamasByUserId(userId: string) {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  return db.collection(COLLECTIONS.CHAMAS).find({ "members.userId": userId }).toArray() as Promise<Chama[]>
}

export async function findPublicChamas() {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  return db.collection(COLLECTIONS.CHAMAS).find({ type: "public" }).toArray() as Promise<Chama[]>
}

// Transaction functions
export async function createTransaction(transactionData: Omit<Transaction, "_id">) {
  const client = await clientPromise
  const db = client.db(DB_NAME)

  const result = await db.collection(COLLECTIONS.TRANSACTIONS).insertOne(transactionData)
  return { ...transactionData, _id: result.insertedId }
}

export async function findTransactionsByUserId(userId: string) {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  return db.collection(COLLECTIONS.TRANSACTIONS).find({ userId }).sort({ date: -1 }).toArray() as Promise<Transaction[]>
}

export async function findTransactionsByChamaId(chamaId: string) {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  return db.collection(COLLECTIONS.TRANSACTIONS).find({ chamaId }).sort({ date: -1 }).toArray() as Promise<
    Transaction[]
  >
}

// Join Request functions
export async function createJoinRequest(joinRequestData: Omit<JoinRequest, "_id">) {
  const client = await clientPromise
  const db = client.db(DB_NAME)

  // Check if user already has a pending request for this chama
  const existingRequest = await db.collection(COLLECTIONS.JOIN_REQUESTS).findOne({
    chamaId: joinRequestData.chamaId,
    userId: joinRequestData.userId,
    status: "pending",
  })

  if (existingRequest) {
    throw new Error("You already have a pending request for this chama")
  }

  const result = await db.collection(COLLECTIONS.JOIN_REQUESTS).insertOne(joinRequestData)
  return { ...joinRequestData, _id: result.insertedId }
}

export async function findPendingJoinRequestsByChamaId(chamaId: string) {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  return db.collection(COLLECTIONS.JOIN_REQUESTS).find({ chamaId, status: "pending" }).toArray() as Promise<
    JoinRequest[]
  >
}

export async function updateJoinRequestStatus(requestId: string, status: "approved" | "rejected") {
  const client = await clientPromise
  const db = client.db(DB_NAME)

  const result = await db
    .collection(COLLECTIONS.JOIN_REQUESTS)
    .updateOne({ _id: new ObjectId(requestId) }, { $set: { status } })

  if (status === "approved") {
    const request = await db.collection(COLLECTIONS.JOIN_REQUESTS).findOne({ _id: new ObjectId(requestId) })
    if (request) {
      // Add user to chama members
      await db.collection(COLLECTIONS.CHAMAS).updateOne(
        { _id: new ObjectId(request.chamaId) },
        {
          $push: {
            members: {
              userId: request.userId,
              name: request.name,
              avatar: request.avatar,
              role: "member",
              joinDate: new Date(),
            },
          },
          $inc: { memberCount: 1 },
        },
      )
    }
  }

  return result.modifiedCount > 0
}

// Loan functions
export async function createLoanRequest(
  loanData: Omit<Loan, "_id" | "status" | "requestDate" | "payments">,
  userId: string,
) {
  const client = await clientPromise
  const db = client.db(DB_NAME)

  const newLoan: Omit<Loan, "_id"> = {
    ...loanData,
    userId,
    status: "pending",
    requestDate: new Date(),
    payments: [],
  }

  const result = await db.collection(COLLECTIONS.LOANS).insertOne(newLoan)
  return { ...newLoan, _id: result.insertedId }
}

export async function findLoansByUserId(userId: string) {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  return db.collection(COLLECTIONS.LOANS).find({ userId }).sort({ requestDate: -1 }).toArray() as Promise<Loan[]>
}

// Savings Goal functions
export async function createSavingsGoal(
  goalData: Omit<SavingsGoal, "_id" | "createdAt" | "currentAmount">,
  userId: string,
) {
  const client = await clientPromise
  const db = client.db(DB_NAME)

  const newGoal: Omit<SavingsGoal, "_id"> = {
    ...goalData,
    userId,
    currentAmount: 0,
    createdAt: new Date(),
  }

  const result = await db.collection(COLLECTIONS.SAVINGS_GOALS).insertOne(newGoal)
  return { ...newGoal, _id: result.insertedId }
}

export async function findSavingsGoalsByUserId(userId: string) {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  return db.collection(COLLECTIONS.SAVINGS_GOALS).find({ userId }).sort({ createdAt: -1 }).toArray() as Promise<
    SavingsGoal[]
  >
}

export async function updateSavingsGoal(goalId: string, amount: number) {
  const client = await clientPromise
  const db = client.db(DB_NAME)

  const result = await db
    .collection(COLLECTIONS.SAVINGS_GOALS)
    .updateOne({ _id: new ObjectId(goalId) }, { $inc: { currentAmount: amount } })

  return result.modifiedCount > 0
}

// Investment functions
export async function createInvestment(
  investmentData: Omit<Investment, "_id" | "purchaseDate" | "lastUpdated" | "currentValue">,
  userId: string,
) {
  const client = await clientPromise
  const db = client.db(DB_NAME)

  const now = new Date()
  const newInvestment: Omit<Investment, "_id"> = {
    ...investmentData,
    userId,
    purchaseDate: now,
    lastUpdated: now,
    currentValue: investmentData.amount, // Initially, current value equals the invested amount
  }

  const result = await db.collection(COLLECTIONS.INVESTMENTS).insertOne(newInvestment)
  return { ...newInvestment, _id: result.insertedId }
}

export async function findInvestmentsByUserId(userId: string) {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  return db.collection(COLLECTIONS.INVESTMENTS).find({ userId }).sort({ purchaseDate: -1 }).toArray() as Promise<
    Investment[]
  >
}

// PesaBot Chat functions
export async function savePesaBotChat(userId: string, messages: any[]) {
  const client = await clientPromise
  const db = client.db(DB_NAME)

  // Check if a chat already exists for this user
  const existingChat = await db.collection(COLLECTIONS.PESABOT_CHATS).findOne({ userId })

  if (existingChat) {
    // Update existing chat
    await db.collection(COLLECTIONS.PESABOT_CHATS).updateOne(
      { userId },
      {
        $set: {
          messages,
          updatedAt: new Date(),
        },
      },
    )
    return { success: true }
  } else {
    // Create new chat
    const newChat = {
      userId,
      messages,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection(COLLECTIONS.PESABOT_CHATS).insertOne(newChat)
    return { success: true }
  }
}

export async function getPesaBotChat(userId: string) {
  const client = await clientPromise
  const db = client.db(DB_NAME)

  const chat = await db.collection(COLLECTIONS.PESABOT_CHATS).findOne({ userId })
  return chat
}
