// API client functions for the PochiYangu app
// These functions make calls to our API routes

// Auth functions
export async function signUp(userData: any) {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to sign up")
  }

  return response.json()
}

export async function login(credentials: any) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to login")
  }

  return response.json()
}

export async function logout() {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to logout")
  }

  return response.json()
}

export async function getCurrentUser() {
  const response = await fetch("/api/auth/user")

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  return data.user
}

export async function forgotPassword(email: string) {
  const response = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to send reset link")
  }

  return response.json()
}

// Dashboard data
export async function fetchDashboardData() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Not authenticated")

  // Fetch chamas
  const chamasResponse = await fetch("/api/chamas")
  if (!chamasResponse.ok) {
    throw new Error("Failed to fetch chamas")
  }
  const chamasData = await chamasResponse.json()

  // Fetch transactions
  const transactionsResponse = await fetch("/api/transactions")
  if (!transactionsResponse.ok) {
    throw new Error("Failed to fetch transactions")
  }
  const transactionsData = await transactionsResponse.json()

  // For now, we'll use mock data for insights
  const insights = [
    {
      message: "You can save up to 500 KES monthly by reducing subscription services.",
      type: "tip",
    },
    {
      message: `Your ${chamasData.chamas[0]?.name || "chama"} has grown by 15% this month!`,
      type: "achievement",
    },
  ]

  return {
    user,
    wallet: {
      balance: user.balance,
      currency: "KES",
    },
    chamas: chamasData.chamas,
    transactions: transactionsData.transactions,
    insights,
  }
}

// Chama functions
export async function fetchChamas() {
  const response = await fetch("/api/chamas")

  if (!response.ok) {
    throw new Error("Failed to fetch chamas")
  }

  const data = await response.json()
  return data.chamas
}

export async function fetchPublicChamas() {
  const response = await fetch("/api/chamas/public")

  if (!response.ok) {
    throw new Error("Failed to fetch public chamas")
  }

  const data = await response.json()
  return data.chamas
}

export async function createChama(chamaData: any) {
  const response = await fetch("/api/chamas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(chamaData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to create chama")
  }

  return response.json().then((data) => data.chama)
}

export async function joinChama(chamaId: string) {
  const response = await fetch(`/api/chamas/${chamaId}/join`, {
    method: "POST",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to join chama")
  }

  return response.json()
}

export async function fetchChamaDetails(chamaId: string) {
  const response = await fetch(`/api/chamas/${chamaId}`)

  if (!response.ok) {
    throw new Error("Failed to fetch chama details")
  }

  const data = await response.json()
  return data.chama
}

export async function contributeToChama(chamaId: string, amount: number) {
  // Check user balance before making the request
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Not authenticated")
  }
  
  if (user.balance < amount) {
    throw new Error("Insufficient balance for this contribution")
  }

  const response = await fetch(`/api/chamas/${chamaId}/contribute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to contribute to chama")
  }

  return response.json()
}

export async function requestWelfare(chamaId: string, amount: number, reason: string) {
  const response = await fetch(`/api/chamas/${chamaId}/welfare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount, reason }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to request welfare")
  }

  return response.json()
}

export async function leaveChama(chamaId: string) {
  const response = await fetch(`/api/chamas/${chamaId}/leave`, {
    method: "POST",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to leave chama")
  }

  return response.json()
}

// Chat functions
export async function fetchChatHistory(chamaId: string) {
  const response = await fetch(`/api/chamas/${chamaId}/chat`)

  if (!response.ok) {
    throw new Error("Failed to fetch chat history")
  }

  const data = await response.json()
  return data.messages
}

export async function fetchChamaBasicInfo(chamaId: string) {
  const response = await fetch(`/api/chamas/${chamaId}/basic`)

  if (!response.ok) {
    throw new Error("Failed to fetch chama basic info")
  }

  const data = await response.json()
  return data.chama
}

export async function sendChatMessage(chamaId: string, content: string) {
  const response = await fetch(`/api/chamas/${chamaId}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to send message")
  }

  return response.json().then((data) => data.message)
}

// Voting functions
export async function fetchVotingProposals(chamaId: string) {
  const response = await fetch(`/api/chamas/${chamaId}/proposals`)

  if (!response.ok) {
    throw new Error("Failed to fetch voting proposals")
  }

  const data = await response.json()
  return data.proposals
}

export async function createProposal(chamaId: string, proposalData: any) {
  const response = await fetch(`/api/chamas/${chamaId}/proposals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(proposalData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to create proposal")
  }

  return response.json().then((data) => data.proposal)
}

export async function submitVote(chamaId: string, proposalId: string, option: string) {
  const response = await fetch(`/api/chamas/${chamaId}/proposals/${proposalId}/vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ option }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to submit vote")
  }

  return response.json()
}

// Admin functions
export async function fetchChamaAdminData(chamaId: string) {
  const response = await fetch(`/api/chamas/${chamaId}/admin`)

  if (!response.ok) {
    throw new Error("Failed to fetch admin data")
  }

  const data = await response.json()
  return data.adminData
}

export async function addCoAdmin(chamaId: string, email: string) {
  const response = await fetch(`/api/chamas/${chamaId}/admin/co-admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to add co-admin")
  }

  return response.json().then((data) => data.admin)
}

export async function removeCoAdmin(chamaId: string, adminId: string) {
  const response = await fetch(`/api/chamas/${chamaId}/admin/co-admin/${adminId}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to remove co-admin")
  }

  return response.json()
}

export async function approveJoinRequest(chamaId: string, requestId: string) {
  const response = await fetch(`/api/chamas/${chamaId}/join-requests/${requestId}/approve`, {
    method: "POST",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to approve join request")
  }

  return response.json()
}

export async function rejectJoinRequest(chamaId: string, requestId: string) {
  const response = await fetch(`/api/chamas/${chamaId}/join-requests/${requestId}/reject`, {
    method: "POST",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to reject join request")
  }

  return response.json()
}

export async function toggleChamaVisibility(chamaId: string, newType: "private" | "public") {
  const response = await fetch(`/api/chamas/${chamaId}/visibility`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: newType }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to update visibility")
  }

  return response.json()
}

export async function generateInviteLink(chamaId: string) {
  const response = await fetch(`/api/chamas/${chamaId}/invite-link`, {
    method: "POST",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to generate invite link")
  }

  return response.json().then((data) => data.inviteLink)
}

export async function downloadReceipt(chamaId: string) {
  const response = await fetch(`/api/chamas/${chamaId}/receipt`, {
    method: "GET",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to download receipt")
  }

  return response.json()
}

// Savings functions
export async function fetchSavingsGoals() {
  const response = await fetch("/api/savings")

  if (!response.ok) {
    throw new Error("Failed to fetch savings goals")
  }

  const data = await response.json()
  return data.goals
}

export async function createSavingsGoal(goalData: any) {
  const response = await fetch("/api/savings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(goalData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to create savings goal")
  }

  return response.json().then((data) => data.goal)
}

export async function contributeToSavingsGoal(goalId: string, amount: number) {
  // Check user balance before making the request
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Not authenticated")
  }
  
  if (user.balance < amount) {
    throw new Error("Insufficient balance for this contribution")
  }

  const response = await fetch(`/api/savings/${goalId}/contribute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to contribute to savings goal")
  }

  return response.json()
}

// Loans functions
export async function fetchLoans() {
  const response = await fetch("/api/loans")

  if (!response.ok) {
    throw new Error("Failed to fetch loans")
  }

  const data = await response.json()
  return data.loans
}

export async function requestLoan(loanData: any) {
  const response = await fetch("/api/loans", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loanData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to request loan")
  }

  return response.json().then((data) => data.loan)
}

export async function repayLoan(loanId: string, amount: number) {
  // Check user balance before making the request
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Not authenticated")
  }
  
  if (user.balance < amount) {
    throw new Error("Insufficient balance for loan repayment")
  }

  const response = await fetch(`/api/loans/${loanId}/repay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to repay loan")
  }

  return response.json()
}

// Investments functions
export async function fetchInvestments() {
  const response = await fetch("/api/investments")

  if (!response.ok) {
    throw new Error("Failed to fetch investments")
  }

  const data = await response.json()
  return data.investments
}

export async function createInvestment(investmentData: any) {
  // Check user balance before making the request
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Not authenticated")
  }
  
  if (user.balance < investmentData.amount) {
    throw new Error("Insufficient balance for this investment")
  }

  const response = await fetch("/api/investments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(investmentData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to create investment")
  }

  return response.json().then((data) => data.investment)
}

// Payments functions
export async function sendMoney(recipientPhone: string, amount: number, description: string) {
  // Check user balance before making the request
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Not authenticated")
  }
  
  if (user.balance < amount) {
    throw new Error("Insufficient balance for this transaction")
  }

  const response = await fetch("/api/payments/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipientPhone, amount, description }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to send money")
  }

  return response.json()
}

export async function fetchTransactions() {
  const response = await fetch("/api/transactions")

  if (!response.ok) {
    throw new Error("Failed to fetch transactions")
  }

  const data = await response.json()
  return data.transactions
}