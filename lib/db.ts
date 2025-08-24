// [file name]: db.ts
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
  PESABOT_CHATS: "pesabot_chats",
}

// Add this new function at the top of the file
export async function connectToDatabase() {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    return { client, db }
  } catch (error) {
    console.error("Database connection error:", error)
    throw new Error("Failed to connect to database")
  }
}

// User functions
export async function createUser(userData: Omit<User, "_id" | "createdAt" | "balance">) {
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
  }

  const result = await db.collection(COLLECTIONS.USERS).insertOne(newUser)
  return { ...newUser, _id: result.insertedId }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return db.collection(COLLECTIONS.USERS).findOne({ 
    email: email.toLowerCase().trim() 
  });
}

export async function findUserById(id: string): Promise<User | null> {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  return db.collection(COLLECTIONS.USERS).findOne({ _id: new ObjectId(id) })
}

export async function verifyUserCredentials(email: string, password: string): Promise<Omit<User, "password"> | null> {
  const user = await findUserByEmail(email)
  if (!user) return null

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) return null

  // Don't return the password
  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword
}

export async function updateUserBalance(userId: string, amount: number): Promise<boolean> {
  const client = await clientPromise
  const db = client.db(DB_NAME)

  const result = await db
    .collection(COLLECTIONS.USERS)
    .updateOne({ _id: new ObjectId(userId) }, { $inc: { balance: amount } })

  return result.modifiedCount > 0
}

// Chama functions
export async function createChama(
  chamaData: Omit<Chama, "_id" | "createdAt" | "memberCount" | "balance" | "members">,
  userId: string,
  userName: string,
): Promise<Chama & { _id: ObjectId }> {
  const client = await clientPromise
  const db = client.db(DB_NAME)

  const newChama: Chama = {
    ...chamaData,
    createdAt: new Date(),
    memberCount: 1,
    balance: 0,
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

export async function findChamaById(id: string): Promise<Chama | null> {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  return db.collection(COLLECTIONS.CHAMAS).findOne({ _id: new ObjectId(id) })
}

export async function findChamasByUserId(userId: string): Promise<Chama[]> {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  return db.collection(COLLECTIONS.CHAMAS).find({ "members.userId": userId }).toArray()
}

export async function findPublicChamas(): Promise<Chama[]> {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  return db.collection(COLLECTIONS.CHAMAS).find({ type: "public" }).toArray()
}

export async function addMemberToChama(chamaId: string, userId: string, userName: string, userAvatar?: string) {
  const { db } = await connectToDatabase();
  if (!db) throw new Error("Database connection failed");

  const result = await db.collection("chamas").updateOne(
    { _id: new ObjectId(chamaId) },
    {
      $push: {
        members: {
          userId: new ObjectId(userId),
          name: userName,
          avatar: userAvatar,
          role: "member",
          joinDate: new Date()
        }
      },
      $inc: { memberCount: 1 }
    }
  );

  return result;
}

export async function getJoinRequestById(requestId: string) {
  const { db } = await connectToDatabase();
  if (!db) throw new Error("Database connection failed");

  const request = await db.collection("join_requests").findOne({
    _id: new ObjectId(requestId)
  });

  return request;
}

// Transaction functions
export async function createTransaction(
  transactionData: Omit<Transaction, "_id">
): Promise<Transaction & { _id: ObjectId }> {
  const client = await clientPromise
  const db = client.db(DB_NAME)

  const result = await db.collection(COLLECTIONS.TRANSACTIONS).insertOne(transactionData)
  return { ...transactionData, _id: result.insertedId }
}

export async function findTransactionsByUserId(userId: string): Promise<Transaction[]> {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  return db.collection(COLLECTIONS.TRANSACTIONS)
    .find({ userId })
    .sort({ date: -1 })
    .toArray()
}

export async function findTransactionsByChamaId(chamaId: string): Promise<Transaction[]> {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  return db.collection(COLLECTIONS.TRANSACTIONS)
    .find({ chamaId })
    .sort({ date: -1 })
    .toArray()
}

// Join Request functions
export async function createJoinRequest(
  joinRequestData: Omit<JoinRequest, "_id">
): Promise<JoinRequest & { _id: ObjectId }> {
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

export async function findPendingJoinRequestsByChamaId(chamaId: string): Promise<JoinRequest[]> {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  return db.collection(COLLECTIONS.JOIN_REQUESTS)
    .find({ chamaId, status: "pending" })
    .toArray()
}

export async function updateJoinRequestStatus(
  requestId: string, 
  status: "approved" | "rejected"
): Promise<boolean> {
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
): Promise<Loan & { _id: ObjectId }> {
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

export async function findLoansByUserId(userId: string): Promise<Loan[]> {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  return db.collection(COLLECTIONS.LOANS)
    .find({ userId })
    .sort({ requestDate: -1 })
    .toArray()
}

export async function findUserByPhone(phone: string): Promise<User | null> {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  
  // Normalize the phone number for better matching
  const normalizedPhone = normalizePhone(phone);
  
  // Try to find user by normalized phone
  const user = await db.collection(COLLECTIONS.USERS).findOne({ 
    phone: normalizedPhone 
  });
  
  if (user) return user;
  
  // If not found with normalized phone, try exact match
  return db.collection(COLLECTIONS.USERS).findOne({ phone });
}

// Enhanced normalizePhone function
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  
  // Handle Kenyan numbers specifically
  if (digits.startsWith('254') && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return '254' + digits.substring(1);
  }
  if (digits.startsWith('+254')) {
    return digits.substring(1);
  }
  
  // For other formats, try to extract the last 9 digits
  if (digits.length >= 9) {
    const last9Digits = digits.substring(digits.length - 9);
    return '254' + last9Digits;
  }
  
  return digits;
}

// Savings Goal functions
export async function createSavingsGoal(
  goalData: Omit<SavingsGoal, "_id" | "createdAt" | "currentAmount">,
  userId: string,
): Promise<SavingsGoal & { _id: ObjectId }> {
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

export async function findSavingsGoalsByUserId(userId: string): Promise<SavingsGoal[]> {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  return db.collection(COLLECTIONS.SAVINGS_GOALS)
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray()
}

export async function updateSavingsGoal(goalId: string, amount: number): Promise<boolean> {
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
): Promise<Investment & { _id: ObjectId }> {
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

export async function findInvestmentsByUserId(userId: string): Promise<Investment[]> {
  const client = await clientPromise
  const db = client.db(DB_NAME)
  return db.collection(COLLECTIONS.INVESTMENTS)
    .find({ userId })
    .sort({ purchaseDate: -1 })
    .toArray()
}

// PesaBot Chat functions
export async function savePesaBotChat(userId: string, messages: any[]): Promise<{ success: boolean }> {
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

export async function getPesaBotChat(userId: string): Promise<any> {
  const client = await clientPromise
  const db = client.db(DB_NAME)

  return db.collection(COLLECTIONS.PESABOT_CHATS).findOne({ userId })
}

// REMOVE OR COMMENT OUT THE INCORRECT getCurrentUser FUNCTION
/*
export async function getCurrentUser(): Promise<User | null> {
  // Implementation from your auth file
  const response = await fetch("/api/auth/user");
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  return data.user;
}
*/