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
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to sign up");
  }

  return response.json();
}

export async function login(credentials: any) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to login");
  }

  return response.json();
}

export async function logout() {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to logout");
  }

  return response.json();
}

export async function getCurrentUser() {
  const response = await fetch("/api/auth/user");

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.user;
}

export async function forgotPassword(email: string) {
  const response = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send reset link");
  }

  return response.json();
}

// User Profile functions
export async function fetchUserProfile() {
  const response = await fetch("/api/user/profile");

  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  const data = await response.json();
  return data.profile;
}

export async function updateUserProfile(profileData: any) {
  const response = await fetch("/api/user/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update profile");
  }

  return response.json().then((data) => data.profile);
}

export async function updateNotificationPreferences(preferences: any) {
  const response = await fetch("/api/user/notifications", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preferences),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update notification preferences");
  }

  return response.json();
}

export async function updateSecuritySettings(settings: any) {
  const response = await fetch("/api/user/security", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update security settings");
  }

  return response.json();
}

// Dashboard data
export async function fetchDashboardData() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch chamas
  const chamasResponse = await fetch("/api/chamas");
  if (!chamasResponse.ok) {
    throw new Error("Failed to fetch chamas");
  }
  const chamasData = await chamasResponse.json();

  // Fetch transactions
  const transactionsResponse = await fetch("/api/transactions");
  if (!transactionsResponse.ok) {
    throw new Error("Failed to fetch transactions");
  }
  const transactionsData = await transactionsResponse.json();

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
  ];

  return {
    user,
    wallet: {
      balance: user.balance,
      currency: "KES",
    },
    chamas: chamasData.chamas,
    transactions: transactionsData.transactions,
    insights,
  };
}

// Chama functions
export async function fetchChamas() {
  const response = await fetch("/api/chamas");

  if (!response.ok) {
    throw new Error("Failed to fetch chamas");
  }

  const data = await response.json();
  return data.chamas.map((chama: any) => ({
    ...chama,
    id: chama._id || chama.id
  }));
}

export async function fetchPublicChamas() {
  const response = await fetch("/api/chamas/public");

  if (!response.ok) {
    throw new Error("Failed to fetch public chamas");
  }

  const data = await response.json();
  return data.chamas.map((chama: any) => ({
    ...chama,
    id: chama._id || chama.id
  }));
}

export async function createChama(chamaData: any) {
  const response = await fetch("/api/chamas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(chamaData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create chama");
  }

  const data = await response.json();
  return {
    ...data.chama,
    id: data.chama._id || data.chama.id
  };
}

export async function fetchChamaDetails(chamaId: string): Promise<ChamaDetails> {
  const response = await fetch(`/api/chamas/${chamaId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch chama details");
  }

  const data = await response.json();
  
  // Transform the chama data to match the expected interface
  const transformedChama = {
    ...data.chama,
    id: data.chama._id || data.chama.id,
    members: data.chama.members?.map((member: any) => ({
      ...member,
      id: member._id || member.id,
      userId: member.userId?._id || member.userId
    })) || [],
    transactions: data.chama.transactions?.map((txn: any) => ({
      ...txn,
      id: txn._id || txn.id,
      date: txn.date ? new Date(txn.date).toISOString() : new Date().toISOString()
    })) || [],
    nextContribution: data.chama.nextContribution || {
      amount: data.chama.contributionAmount || 0,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Default 30 days from now
    }
  };

  return transformedChama;
}

export async function joinChama(chamaId: string) {
  const response = await fetch(`/api/chamas/${chamaId}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to join chama");
  }

  return response.json();
}

export async function leaveChama(chamaId: string) {
  const response = await fetch(`/api/chamas/${chamaId}/leave`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to leave chama");
  }

  return response.json();
}

export async function contributeToChama(chamaId: string, amount: number) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  // Check user balance before making the request
  if (user.balance < amount) {
    throw new Error("Insufficient balance for this contribution");
  }

  const response = await fetch(`/api/chamas/${chamaId}/contribute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to contribute to chama");
  }

  return response.json();
}

export async function requestWelfare(chamaId: string, requestData: {
  amount: number;
  reason: string;
  urgency?: 'low' | 'medium' | 'high';
}) {
  const response = await fetch(`/api/chamas/${chamaId}/welfare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to request welfare");
  }

  return response.json();
}

// Chat functions
export async function fetchChatHistory(chamaId: string) {
  const response = await fetch(`/api/chamas/${chamaId}/chat`);

  if (!response.ok) {
    throw new Error("Failed to fetch chat history");
  }

  const data = await response.json();
  return data.messages;
}

export async function fetchChamaBasicInfo(chamaId: string) {
  const response = await fetch(`/api/chamas/${chamaId}/basic`);

  if (!response.ok) {
    throw new Error("Failed to fetch chama basic info");
  }

  const data = await response.json();
  return data.chama;
}

export async function sendChatMessage(chamaId: string, content: string) {
  const response = await fetch(`/api/chamas/${chamaId}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send message");
  }

  return response.json().then((data) => data.message);
}

// Voting functions
export async function fetchVotingProposals(chamaId: string) {
  const response = await fetch(`/api/chamas/${chamaId}/proposals`);

  if (!response.ok) {
    throw new Error("Failed to fetch voting proposals");
  }

  const data = await response.json();
  return data.proposals;
}

export async function createProposal(chamaId: string, proposalData: any) {
  const response = await fetch(`/api/chamas/${chamaId}/proposals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(proposalData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create proposal");
  }

  return response.json().then((data) => data.proposal);
}

export async function submitVote(chamaId: string, proposalId: string, option: string) {
  const response = await fetch(`/api/chamas/${chamaId}/proposals/${proposalId}/vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ option }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to submit vote");
  }

  return response.json();
}

// Admin functions
export async function fetchChamaAdminData(chamaId: string) {
  const response = await fetch(`/api/chamas/${chamaId}/admin`);

  if (!response.ok) {
    throw new Error("Failed to fetch admin data");
  }

  const data = await response.json();
  return data.adminData;
}

export async function addCoAdmin(chamaId: string, email: string) {
  const response = await fetch(`/api/chamas/${chamaId}/admin/co-admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to add co-admin");
  }

  return response.json().then((data) => data.admin);
}

export async function removeCoAdmin(chamaId: string, adminId: string) {
  const response = await fetch(`/api/chamas/${chamaId}/admin/co-admin/${adminId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to remove co-admin");
  }

  return response.json();
}

export async function approveJoinRequest(chamaId: string, requestId: string) {
  const response = await fetch(`/api/chamas/${chamaId}/join-requests/${requestId}/approve`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to approve join request");
  }

  return response.json();
}

export async function rejectJoinRequest(chamaId: string, requestId: string) {
  const response = await fetch(`/api/chamas/${chamaId}/join-requests/${requestId}/reject`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to reject join request");
  }

  return response.json();
}

export async function toggleChamaVisibility(chamaId: string, newType: "private" | "public") {
  const response = await fetch(`/api/chamas/${chamaId}/visibility`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: newType }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update visibility");
  }

  return response.json();
}

export async function generateInviteLink(chamaId: string) {
  const response = await fetch(`/api/chamas/${chamaId}/invite-link`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to generate invite link");
  }

  return response.json().then((data) => data.inviteLink);
}

export async function downloadReceipt(chamaId: string) {
  const response = await fetch(`/api/chamas/${chamaId}/receipt`, {
    method: "GET",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to download receipt");
  }

  return response.json();
}

// Savings functions
export async function fetchSavingsGoals() {
  const response = await fetch("/api/savings");

  if (!response.ok) {
    throw new Error("Failed to fetch savings goals");
  }

  const data = await response.json();
  return {
    goals: data.goals,
    userBalance: data.userBalance // Make sure your API returns this
  };
}

export async function createSavingsGoal(goalData: any) {
  const response = await fetch("/api/savings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(goalData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create savings goal");
  }

  return response.json().then((data) => data.goal);
}

export async function contributeToSavingsGoal(goalId: string, amount: number) {
  // Check user balance before making the request
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  
  if (user.balance < amount) {
    throw new Error("Insufficient balance for this contribution");
  }

  const response = await fetch(`/api/savings/${goalId}/contribute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to contribute to savings goal");
  }

  return response.json();
}

// Updated verifyRecipient function with better error handling
export async function verifyRecipient(
  identifier: string,
  type: 'phone' | 'email'
): Promise<{
  name: string;
  verified: boolean;
  type: 'phone' | 'email';
  identifier: string;
}> {
  try {
    // Try the new endpoint first
    let response;
    try {
      response = await fetch('/api/payments/verify-recipient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, type }),
      });
    } catch (networkError) {
      console.warn('Primary verification endpoint failed, trying fallback');
      // Fallback to a different endpoint if the primary one fails
      response = await fetch('/api/verify-recipient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, type }),
      });
    }

    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Invalid response format:', text.substring(0, 100));
      throw new Error('Server returned an invalid response format');
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Recipient verification failed');
    }

    if (!data.verified) {
      throw new Error(data.message || 'Recipient not found');
    }

    return {
      name: data.name || 'Verified User',
      verified: true,
      type,
      identifier
    };
  } catch (error) {
    console.error('Verification error:', error);
    // Return a mock response in development if the endpoint doesn't exist
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using mock verification response in development');
      return {
        name: 'Test User',
        verified: true,
        type,
        identifier
      };
    }
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to verify recipient. Please try again.'
    );
  }
}
// Loans functions
export async function fetchLoans() {
  const response = await fetch("/api/loans");

  if (!response.ok) {
    throw new Error("Failed to fetch loans");
  }

  const data = await response.json();
  return data.loans;
}

export async function requestLoan(loanData: any) {
  const response = await fetch("/api/loans", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loanData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to request loan");
  }

  return response.json().then((data) => data.loan);
}

export async function repayLoan(loanId: string, amount: number) {
  // Check user balance before making the request
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  
  if (user.balance < amount) {
    throw new Error("Insufficient balance for loan repayment");
  }

  const response = await fetch(`/api/loans/${loanId}/repay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to repay loan");
  }

  return response.json();
}

// Investments functions
export async function fetchInvestments() {
  const response = await fetch("/api/investments");

  if (!response.ok) {
    throw new Error("Failed to fetch investments");
  }

  const data = await response.json();
  return data.investments;
}

export async function createInvestment(investmentData: any) {
  // Check user balance before making the request
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  
  if (user.balance < investmentData.amount) {
    throw new Error("Insufficient balance for this investment");
  }

  const response = await fetch("/api/investments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(investmentData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create investment");
  }

  return response.json().then((data) => data.investment);
}

// Payments functions
export async function sendMoney(
  recipientIdentifier: string, 
  amount: number, 
  description: string,
  recipientType: 'phone' | 'email'
) {
  try {
    // First check if we have a valid session
    const sessionCheck = await fetch('/api/auth/session');
    if (!sessionCheck.ok) {
      throw new Error("Not authenticated");
    }

    const response = await fetch("/api/payments/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Ensure credentials are included
        credentials: 'include',
      },
      body: JSON.stringify({ 
        recipientIdentifier, 
        amount, 
        description,
        recipientType
      }),
    });

    if (!response.ok) {
      let errorMessage = "Failed to send money";
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch (e) {
        const text = await response.text();
        if (text) errorMessage = text;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    console.error("Payment processing error:", error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : "Network error occurred. Please try again."
    );
  }
}

export async function fetchTransactions() {
  const response = await fetch("/api/transactions");

  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }

  const data = await response.json();
  return data.transactions;
}

// Update the ChamaDetails interface to match your data structure
interface ChamaDetails {
  id: string;
  _id: string;
  name: string;
  type: "private" | "public";
  description: string;
  rules: string;
  memberCount: number;
  maxMembers: number;
  balance: number;
  currency: string;
  isAdmin: boolean;
  isPrimaryAdmin: boolean;
  contributionAmount: number;
  contributionFrequency: string;
  nextContribution: {
    amount: number;
    dueDate: string;
  };
  members: Array<{
    id: string;
    userId: string;
    name: string;
    avatar?: string;
    role: "admin" | "member";
    joinDate: string;
  }>;
  transactions: Array<{
    id: string;
    type: "contribution" | "welfare" | "investment" | "payout";
    amount: number;
    description: string;
    date: string;
    memberId: string;
    memberName: string;
    isTest: boolean;
  }>;
  pendingRequests?: number;
}

interface WelfareRequest {
  id: string;
  chamaId: string;
  memberId: string;
  memberName: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  urgency: 'low' | 'medium' | 'high';
}