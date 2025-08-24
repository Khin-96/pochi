// API client functions for the PochiYangu app
// These functions make calls to our API routes

// Interface definitions
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChamaDetails {
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

export interface WelfareRequest {
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

export interface JoinRequest {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
}

// Helper function for API requests
async function apiRequest<T>(
  url: string, 
  options: RequestInit = {}
): Promise<T> {
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    let errorMessage = 'Request failed';
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      // If we can't parse JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  // Handle cases where response might be empty
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Auth functions
export async function signUp(userData: any) {
  return apiRequest('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function login(credentials: any) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function logout(): Promise<{ message: string }> {
  try {
    await apiRequest('/api/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear client-side storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
    }
  }
  
  return { message: 'Logged out successfully' };
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await apiRequest<any>('/api/auth/session', {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    
    if (!session.user) {
      return null;
    }

    return {
      id: session.user.id,
      name: session.user.name || '',
      email: session.user.email || '',
      phone: session.user.phone || '',
      balance: Number(session.user.balance) || 0,
      avatar: session.user.image || undefined,
    };
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    return null;
  }
}

export async function forgotPassword(email: string) {
  return apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// User Profile functions
export async function fetchUserProfile(): Promise<any> {
  try {
    const data = await apiRequest<any>('/api/user/profile', {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
    
    // Check if the response has the expected structure
    if (!data.profile) {
      throw new Error('Invalid profile data structure');
    }
    
    return data; // This should now have { profile: {...} }
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    
    if (error instanceof Error && error.message.includes('401')) {
      // Redirect to login if unauthorized
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    throw error;
  }
}

export async function updateUserProfile(profileData: any) {
  const data = await apiRequest<any>('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
  
  return data.profile;
}

export async function fetchUserStats(): Promise<any> {
  return apiRequest<any>('/api/user/stats', {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

export async function updateNotificationPreferences(preferences: any) {
  return apiRequest('/api/user/notifications', {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
}

export async function updateSecuritySettings(settings: any) {
  return apiRequest('/api/user/security', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

// Dashboard data
export async function fetchDashboardData() {
  // Fetch chamas and transactions in parallel - let API routes handle auth
  const [chamasData, transactionsData] = await Promise.all([
    apiRequest<{ chamas: any[] }>('/api/chamas'),
    apiRequest<{ transactions: any[] }>('/api/transactions')
  ]);

  // For now, we'll use mock data for insights
  const insights = [
    {
      message: 'You can save up to 500 KES monthly by reducing subscription services.',
      type: 'tip',
    },
    {
      message: `Your ${chamasData.chamas[0]?.name || 'chama'} has grown by 15% this month!`,
      type: 'achievement',
    },
  ];

  return {
    chamas: chamasData.chamas,
    transactions: transactionsData.transactions,
    insights,
  };
}

// Chama functions
export async function fetchChamas() {
  const data = await apiRequest<{ chamas: any[] }>('/api/chamas');
  return data.chamas.map((chama: any) => ({
    ...chama,
    id: chama._id || chama.id
  }));
}

export async function fetchPublicChamas() {
  const data = await apiRequest<{ chamas: any[] }>('/api/chamas/public');
  return data.chamas.map((chama: any) => ({
    ...chama,
    id: chama._id || chama.id
  }));
}

export async function createChama(chamaData: any) {
  const data = await apiRequest<{ chama: any }>('/api/chamas', {
    method: 'POST',
    body: JSON.stringify(chamaData),
  });
  
  return {
    ...data.chama,
    id: data.chama._id || data.chama.id
  };
}

export async function fetchChamaDetails(chamaId: string): Promise<ChamaDetails> {
  const data = await apiRequest<{ chama: any }>(`/api/chamas/${chamaId}`);
  
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
  return apiRequest(`/api/chamas/${chamaId}/join`, {
    method: 'POST',
  });
}

export async function leaveChama(chamaId: string) {
  return apiRequest(`/api/chamas/${chamaId}/leave`, {
    method: 'POST',
  });
}

export async function contributeToChama(chamaId: string, amount: number) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Check user balance before making the request
  if (user.balance < amount) {
    throw new Error('Insufficient balance for this contribution');
  }

  return apiRequest(`/api/chamas/${chamaId}/contribute`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

export async function requestWelfare(chamaId: string, requestData: {
  amount: number;
  reason: string;
  urgency?: 'low' | 'medium' | 'high';
}) {
  return apiRequest(`/api/chamas/${chamaId}/welfare`, {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
}

// Chat functions
export async function fetchChatHistory(chamaId: string) {
  const data = await apiRequest<{ messages: any[] }>(`/api/chamas/${chamaId}/chat`);
  return data.messages;
}

export async function fetchChamaBasicInfo(chamaId: string) {
  const data = await apiRequest<{ chama: any }>(`/api/chamas/${chamaId}/basic`);
  return data.chama;
}

export async function sendChatMessage(chamaId: string, content: string) {
  const data = await apiRequest<{ message: any }>(`/api/chamas/${chamaId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  
  return data.message;
}

// Voting functions
export async function fetchVotingProposals(chamaId: string) {
  const data = await apiRequest<{ proposals: any[] }>(`/api/chamas/${chamaId}/proposals`);
  return data.proposals;
}

export async function createProposal(chamaId: string, proposalData: any) {
  const data = await apiRequest<{ proposal: any }>(`/api/chamas/${chamaId}/proposals`, {
    method: 'POST',
    body: JSON.stringify(proposalData),
  });
  
  return data.proposal;
}

export async function submitVote(chamaId: string, proposalId: string, option: string) {
  return apiRequest(`/api/chamas/${chamaId}/proposals/${proposalId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ option }),
  });
}

// Admin functions
export async function fetchChamaAdminData(chamaId: string) {
  const data = await apiRequest<{ adminData: any }>(`/api/chamas/${chamaId}/admin`);
  return data.adminData;
}

export async function addCoAdmin(chamaId: string, email: string) {
  const data = await apiRequest<{ admin: any }>(`/api/chamas/${chamaId}/admin/co-admin`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  
  return data.admin;
}

export async function removeCoAdmin(chamaId: string, adminId: string) {
  return apiRequest(`/api/chamas/${chamaId}/admin/co-admin/${adminId}`, {
    method: 'DELETE',
  });
}

export async function toggleChamaVisibility(chamaId: string, newType: 'private' | 'public') {
  return apiRequest(`/api/chamas/${chamaId}/visibility`, {
    method: 'POST',
    body: JSON.stringify({ type: newType }),
  });
}

export async function requestToJoinChama(chamaId: string, reason?: string) {
  return apiRequest(`/api/chamas/${chamaId}/join-request`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function fetchJoinRequests(chamaId: string) {
  const data = await apiRequest<{ requests: JoinRequest[] }>(`/api/chamas/${chamaId}/join-requests`);
  return data.requests;
}

export async function approveJoinRequest(chamaId: string, requestId: string) {
  return apiRequest(`/api/chamas/${chamaId}/join-requests/${requestId}/approve`, {
    method: 'POST',
  });
}

export async function rejectJoinRequest(chamaId: string, requestId: string) {
  return apiRequest(`/api/chamas/${chamaId}/join-requests/${requestId}/reject`, {
    method: 'POST',
  });
}

export async function generateInviteLink(chamaId: string) {
  const data = await apiRequest<{ inviteLink: string }>(`/api/chamas/${chamaId}/invite-link`, {
    method: 'POST',
  });
  
  return data.inviteLink;
}

export async function downloadReceipt(chamaId: string) {
  return apiRequest(`/api/chamas/${chamaId}/receipt`);
}

// Savings functions
export async function fetchSavingsGoals() {
  const data = await apiRequest<{ goals: any[]; userBalance: number }>('/api/savings');
  return {
    goals: data.goals,
    userBalance: data.userBalance
  };
}

export async function createSavingsGoal(goalData: {
  name: string;
  targetAmount: number;
  deadline?: string;
  category: string;
}) {
  return apiRequest('/api/savings', {
    method: 'POST',
    body: JSON.stringify(goalData),
  });
}

export async function contributeToSavingsGoal(goalId: string, amount: number) {
  // Check user balance before making the request
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Not authenticated');
  }
  
  if (user.balance < amount) {
    throw new Error('Insufficient balance for this contribution');
  }

  return apiRequest(`/api/savings/${goalId}/contribute`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
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
  message?: string;
}> {
  try {
    const data = await apiRequest<any>('/api/payments/verify-recipient', {
      method: 'POST',
      body: JSON.stringify({ identifier, type }),
    });
    
    return {
      name: data.name || 'Verified User',
      verified: data.verified || false,
      type,
      identifier,
      message: data.message
    };
  } catch (error) {
    console.error('Verification error:', error);
    
    // In development, allow testing with mock data
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
  const data = await apiRequest<{ loans: any[] }>('/api/loans');
  return data.loans;
}

export async function requestLoan(loanData: any) {
  const data = await apiRequest<{ loan: any }>('/api/loans', {
    method: 'POST',
    body: JSON.stringify(loanData),
  });
  
  return data.loan;
}

export async function repayLoan(loanId: string, amount: number) {
  // Check user balance before making the request
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Not authenticated');
  }
  
  if (user.balance < amount) {
    throw new Error('Insufficient balance for loan repayment');
  }

  return apiRequest(`/api/loans/${loanId}/repay`, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}

// Investments functions
export async function fetchInvestments() {
  const data = await apiRequest<{ investments: any[] }>('/api/investments');
  return data.investments;
}

export async function createInvestment(investmentData: any) {
  // Check user balance before making the request
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Not authenticated');
  }
  
  if (user.balance < investmentData.amount) {
    throw new Error('Insufficient balance for this investment');
  }

  const data = await apiRequest<{ investment: any }>('/api/investments', {
    method: 'POST',
    body: JSON.stringify(investmentData),
  });
  
  return data.investment;
}

export async function sendMoney(requestData: any) {
  try {
    return await apiRequest('/api/payments/send', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new Error('Session expired. Please login again.');
      }
      
      if (error.message.includes('Validation failed')) {
        throw error; // Re-throw validation errors as-is
      }
    }
    
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Network error occurred. Please try again.'
    );
  }
}

export async function fetchTransactions() {
  const data = await apiRequest<{ transactions: any[] }>('/api/transactions');
  return data.transactions;
}