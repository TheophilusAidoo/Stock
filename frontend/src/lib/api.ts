// Default to local backend when running dev
const LOCAL_API = "http://localhost:4001";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || LOCAL_API;

// Test if backend is reachable
async function testBackendConnection(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3 second timeout for test
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
      mode: 'cors',
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  // Get auth token based on the path (admin routes use admin token, others use user token)
  // Only access localStorage on client side to avoid hydration issues
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    const isAdminRoute = path.startsWith('/admin');
    token = isAdminRoute 
      ? localStorage.getItem('admin_token')
      : localStorage.getItem('user_token');
  }
  
  // Check if body is FormData - if so, don't set Content-Type (browser will set it with boundary)
  const isFormData = options?.body instanceof FormData;
  
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options?.headers as Record<string, string> || {}),
  };
  
  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Remove body and headers from options to handle them separately
  const { body: optionsBody, headers: optionsHeaders, ...restOptions } = options || {};
  
  // Handle body - if it's FormData, use as-is; if it's a string (already JSON stringified), use as-is; otherwise stringify
  const requestBody = isFormData 
    ? optionsBody 
    : (typeof optionsBody === 'string' ? optionsBody : (optionsBody ? JSON.stringify(optionsBody) : undefined));

  // Add timeout to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  let response: Response;
  
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...restOptions,
      headers,
      body: requestBody,
      cache: "no-store",
      signal: controller.signal,
      mode: 'cors', // Explicitly set CORS mode
    });
    clearTimeout(timeoutId);
  } catch (error) {
    clearTimeout(timeoutId);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Test if backend is reachable
    const isReachable = await testBackendConnection(API_BASE);
    
    // Provide clear error message
    let helpfulMessage = `Cannot connect to backend API at ${API_BASE}\n\n`;
    helpfulMessage += `Error: ${errorMessage}\n`;
    
    if (!isReachable) {
      helpfulMessage += `\n❌ Backend is not running or not reachable.\n\n`;
      helpfulMessage += `To fix this:\n`;
      helpfulMessage += `1. Open Terminal\n`;
      helpfulMessage += `2. Run: cd "/Users/alphamac/Downloads/Angelone 2/backend"\n`;
      helpfulMessage += `3. Run: PORT=4001 HOST=localhost npm run start:dev\n`;
      helpfulMessage += `4. Wait for: "🚀 Backend server is running on http://localhost:4001"\n`;
      helpfulMessage += `5. Refresh this page and try again`;
    } else {
      helpfulMessage += `\nBackend is reachable but request failed. Check backend logs for errors.`;
    }
    
    throw new Error(helpfulMessage);
  }

  // Check if response is HTML (error page) instead of JSON
  const contentType = response.headers.get("content-type");
  if (contentType && !contentType.includes("application/json")) {
    const errorText = await response.text();
    // If it's HTML, the backend might not be running or endpoint is wrong
    if (errorText.trim().startsWith("<!DOCTYPE") || errorText.trim().startsWith("<html")) {
      throw new Error(`Backend server error: Received HTML instead of JSON. Is the backend running at ${API_BASE}?`);
    }
    throw new Error(errorText || "Unexpected response format");
  }

  if (!response.ok) {
    let errorMessage = "Something went wrong";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (parseError) {
      // If JSON parsing fails, try to get text
      const errorText = await response.text();
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null as T;
  }

  try {
    return (await response.json()) as T;
  } catch (jsonError) {
    const text = await response.text();
    throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
  }
}

export const api = {
  auth: {
    login: (payload: { email: string; password: string }) =>
      request<{ token: string; refreshToken: string }>("/auth/login", {
        method: "POST",
        body: payload,
      }),
    register: (payload: Record<string, unknown>) =>
      request("/auth/register", { method: "POST", body: payload }),
    kyc: (formData: FormData) =>
      request("/users/kyc", { 
        method: "POST", 
        body: formData,
        headers: {} // Let browser set Content-Type with boundary for FormData
      }),
  },
  wallet: {
    deposit: (payload: { amount: number; channel: string; userId?: string; gatewayId?: string; screenshotData?: string; screenshotType?: string }) =>
      request("/wallet/deposit", { method: "POST", body: JSON.stringify(payload) }),
    withdraw: (payload: { amount: number; methodId: string; userId?: string; withdrawalAccount?: string; withdrawalDetails?: Record<string, string> }) =>
      request("/wallet/withdraw", { method: "POST", body: JSON.stringify(payload) }),
    getWithdrawalMethods: () =>
      request("/wallet/withdrawal-methods", { method: "GET" }),
    history: (userId?: string) => 
      request(`/wallet/history${userId ? `?userId=${userId}` : ''}`, { method: "GET" }),
    balance: (userId: string) => 
      request("/wallet/balance", { method: "POST", body: JSON.stringify({ userId }) }),
    getPaymentGateway: (id?: string) => 
      request(`/wallet/payment-gateway${id ? `?id=${id}` : ''}`, { method: "GET" }),
  },
  market: {
    quotes: () => request("/market/quotes", { method: "GET" }),
    depth: (symbol: string) => request(`/market/depth/${symbol}`, { method: "GET" }),
  },
  ipo: {
    getIpos: (status?: 'Upcoming' | 'Live' | 'Closed') => 
      request(`/ipos${status ? `?status=${status}` : ''}`, { method: "GET" }),
    apply: (payload: { ipoId: string; userId: string; lots: number }) =>
      request("/ipos/apply", { method: "POST", body: JSON.stringify(payload) }),
    getApplications: (userId: string) =>
      request(`/ipos/applications?userId=${userId}`, { method: "GET" }),
  },
  user: {
    getProfile: (userId: string) =>
      request(`/user/profile?userId=${userId}`, { method: "GET" }),
    updateProfile: (payload: { userId: string; name?: string; mobile?: string; address?: string; gender?: 'Male' | 'Female' | 'Other'; profilePhoto?: string }) =>
      request("/user/profile", { method: "POST", body: JSON.stringify(payload) }),
    changePassword: (payload: { userId: string; oldPassword: string; newPassword: string }) =>
      request("/user/change-password", { method: "POST", body: JSON.stringify(payload) }),
    updateTwoFactor: (payload: { userId: string; enabled: boolean }) =>
      request("/user/two-factor", { method: "POST", body: JSON.stringify(payload) }),
    updateWalletPreferences: (payload: { userId: string; defaultDepositMethod?: string; defaultWithdrawalMethod?: string }) =>
      request("/user/wallet-preferences", { method: "POST", body: JSON.stringify(payload) }),
    updateNotificationPreferences: (payload: { userId: string; preferences: Record<string, boolean> }) =>
      request("/user/notification-preferences", { method: "POST", body: JSON.stringify(payload) }),
    verifyEmail: (userId: string) =>
      request("/user/verify-email", { method: "POST", body: JSON.stringify({ userId }) }),
    verifyMobile: (userId: string) =>
      request("/user/verify-mobile", { method: "POST", body: JSON.stringify({ userId }) }),
    createSupportTicket: (payload: { userId: string; subject: string; category: 'Deposit' | 'Withdrawal' | 'IPO' | 'Trading' | 'KYC' | 'Other'; message: string }) =>
      request("/user/support-ticket", { method: "POST", body: JSON.stringify(payload) }),
    getSupportTickets: (userId: string) =>
      request(`/user/support-tickets?userId=${userId}`, { method: "GET" }),
    getSupportTicket: (id: string) =>
      request(`/user/support-ticket/${id}`, { method: "GET" }),
    getSupportTicketMessages: (ticketId: string) =>
      request(`/user/support-tickets/${ticketId}/messages`, { method: "GET" }),
    addSupportTicketMessage: (ticketId: string, userId: string, message: string) =>
      request(`/user/support-tickets/${ticketId}/messages`, { method: "POST", body: JSON.stringify({ userId, message }) }),
    getNotifications: (userId: string) =>
      request(`/user/notifications?userId=${userId}`, { method: "GET" }),
    markNotificationAsRead: (userId: string, notificationId: string) =>
      request(`/user/notifications/${notificationId}/read`, { method: "POST", body: JSON.stringify({ userId }) }),
    markAllNotificationsAsRead: (userId: string) =>
      request(`/user/notifications/read-all`, { method: "POST", body: JSON.stringify({ userId }) }),
  },
  trading: {
    placeOrder: (payload: { symbol: string; quantity: number; price: number; side: 'BUY' | 'SELL'; orderType?: string; productType?: string; validity?: string; userId?: string; timer?: number }) =>
      request("/trades", { method: "POST", body: JSON.stringify(payload) }),
    orders: (userId?: string) => request(`/trades/orders${userId ? `?userId=${userId}` : ''}`, { method: "GET" }),
    positions: (userId?: string) => request(`/trades/positions${userId ? `?userId=${userId}` : ''}`, { method: "GET" }),
    portfolioSummary: (userId?: string) => request(`/portfolio/summary${userId ? `?userId=${userId}` : ''}`, { method: "GET" }),
    realizedPnl: (userId?: string) => request(`/portfolio/realized-pnl${userId ? `?userId=${userId}` : ''}`, { method: "GET" }),
    getCurrencySettings: () => request("/currency/settings", { method: "GET" }),
    getTimerSettings: () => request("/trading/timer-settings", { method: "GET" }),
    getTradingSettings: () => request("/trading/settings", { method: "GET" }),
    createTimedTrade: (payload: { userId: string; amount: number; timerDuration: number; symbol: string; side: 'BUY' | 'SELL' }) =>
      request("/trading/timed-trade", { method: "POST", body: JSON.stringify(payload) }),
    getTimedTrades: (userId: string) =>
      request(`/trading/timed-trades?userId=${userId}`, { method: "GET" }),
  },
  admin: {
    users: () => request("/admin/users", { method: "GET" }),
    approveUser: (id: string) =>
      request(`/admin/users/${id}/approve`, { method: "POST" }),
    rejectUser: (id: string) =>
      request(`/admin/users/${id}/reject`, { method: "POST" }),
    deleteUser: (id: string) =>
      request(`/admin/users/${id}/delete`, { method: "POST" }),
    adjustUserBalance: (id: string, payload: { amount: number; type: 'add' | 'deduct'; reason?: string }) =>
      request(`/admin/users/${id}/adjust-balance`, { method: "POST", body: JSON.stringify(payload) }),
    approveKyc: (id: string) =>
      request(`/admin/kyc/${id}/approve`, { method: "POST" }),
    rejectKyc: (id: string) =>
      request(`/admin/kyc/${id}/reject`, { method: "POST" }),
    wallets: () => request("/admin/wallets", { method: "GET" }),
    ipos: () => request("/admin/ipos", { method: "GET" }),
    addIpo: (payload: { companyName: string; companyLogo?: string; ipoType: 'Mainline' | 'SME'; priceMin: number; priceMax: number; lotSize: number; minInvestment: number; openDate: string; closeDate: string; description: string; status: 'Upcoming' | 'Live' | 'Closed'; ipoPrice?: number; discountType?: 'Percentage' | 'Fixed'; discountValue?: number; showDiscount?: boolean }) =>
      request("/admin/ipos/add", { method: "POST", body: JSON.stringify(payload) }),
    updateIpo: (id: string, payload: { companyName: string; companyLogo?: string; ipoType: 'Mainline' | 'SME'; priceMin: number; priceMax: number; lotSize: number; minInvestment: number; openDate: string; closeDate: string; description: string; status: 'Upcoming' | 'Live' | 'Closed'; ipoPrice?: number; discountType?: 'Percentage' | 'Fixed'; discountValue?: number; showDiscount?: boolean }) =>
      request(`/admin/ipos/update/${id}`, { method: "POST", body: JSON.stringify(payload) }),
    deleteIpo: (id: string) =>
      request(`/admin/ipos/delete/${id}`, { method: "POST" }),
    getIpoApplications: (ipoId?: string) =>
      request(`/admin/ipos/applications${ipoId ? `?ipoId=${ipoId}` : ''}`, { method: "GET" }),
    approveIpoApplication: (id: string) =>
      request(`/admin/ipos/applications/${id}/approve`, { method: "POST" }),
    rejectIpoApplication: (id: string) =>
      request(`/admin/ipos/applications/${id}/reject`, { method: "POST" }),
    analytics: () => request("/admin/analytics", { method: "GET" }),
    getOverview: () => request("/admin/overview", { method: "GET" }),
    kycs: () => request("/admin/kycs", { method: "GET" }),
    getPaymentGateways: () => request("/admin/payment-gateway", { method: "GET" }),
    addPaymentGateway: (payload: { name: string; trc20Address: string; trc20QrCode: string; minDeposit: number; confirmationTime: string; instructions: string }) =>
      request("/admin/payment-gateway", { method: "POST", body: JSON.stringify(payload) }),
    updatePaymentGateway: (id: string, payload: { name: string; trc20Address: string; trc20QrCode: string; minDeposit: number; confirmationTime: string; instructions: string }) =>
      request(`/admin/payment-gateway/${id}`, { method: "POST", body: JSON.stringify(payload) }),
    deletePaymentGateway: (id: string) =>
      request(`/admin/payment-gateway/${id}/delete`, { method: "POST" }),
    getPendingDeposits: (userId?: string, all?: boolean) => 
      request(`/admin/deposits${userId || all ? `?${userId ? `userId=${userId}` : ''}${all ? `${userId ? '&' : ''}all=true` : ''}` : ''}`, { method: "GET" }),
    getAllDeposits: (userId?: string) => 
      request(`/admin/deposits?all=true${userId ? `&userId=${userId}` : ''}`, { method: "GET" }),
    approveDeposit: (id: string) => request(`/admin/deposits/${id}/approve`, { method: "POST" }),
    rejectDeposit: (id: string) => request(`/admin/deposits/${id}/reject`, { method: "POST" }),
    getWithdrawalMethods: () => request("/admin/withdrawal-methods", { method: "GET" }),
    addWithdrawalMethod: (payload: { name: string; type: string; minAmount: number; fee: number; processingTime: string }) =>
      request("/admin/withdrawal-methods", { method: "POST", body: JSON.stringify(payload) }),
    updateWithdrawalMethod: (id: string, payload: { name: string; type: string; minAmount: number; fee: number; processingTime: string }) =>
      request(`/admin/withdrawal-methods/${id}`, { method: "POST", body: JSON.stringify(payload) }),
    deleteWithdrawalMethod: (id: string) =>
      request(`/admin/withdrawal-methods/${id}/delete`, { method: "POST" }),
    getPendingWithdrawals: (userId?: string, all?: boolean) => 
      request(`/admin/withdrawals${userId || all ? `?${userId ? `userId=${userId}` : ''}${all ? `${userId ? '&' : ''}all=true` : ''}` : ''}`, { method: "GET" }),
    getAllWithdrawals: (userId?: string) => 
      request(`/admin/withdrawals?all=true${userId ? `&userId=${userId}` : ''}`, { method: "GET" }),
    approveWithdrawal: (id: string) => request(`/admin/withdrawals/${id}/approve`, { method: "POST" }),
    rejectWithdrawal: (id: string, reason?: string) =>
      request(`/admin/withdrawals/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),
    getTimerSettings: () => request("/trading/timer-settings", { method: "GET" }),
    updateTimerSettings: (id: string, isEnabled: boolean) =>
      request(`/trading/timer-settings/${id}`, { method: "POST", body: JSON.stringify({ isEnabled }) }),
    addTimerSettings: (payload: { duration: number; label: string; isEnabled?: boolean }) =>
      request("/admin/timer-settings/add", { method: "POST", body: JSON.stringify(payload) }),
    deleteTimerSettings: (id: string) =>
      request(`/admin/timer-settings/${id}/delete`, { method: "POST" }),
    getTradingSettings: () => request("/trading/settings", { method: "GET" }),
    updateTradingSettings: (payload: { defaultProfitRate?: number; currencyCode?: string; currencySymbol?: string; locale?: string }) =>
      request("/trading/settings", { method: "POST", body: JSON.stringify(payload) }),
    getCurrencySettings: () => request("/currency/settings", { method: "GET" }),
    getAllTimedTrades: (status?: 'pending' | 'win' | 'lose' | 'draw') =>
      request(`/admin/timed-trades${status ? `?status=${status}` : ''}`, { method: "GET" }),
    setTradeResult: (id: string, result: 'win' | 'lose' | 'draw') =>
      request(`/admin/timed-trades/${id}/result`, { method: "POST", body: JSON.stringify({ result }) }),
    getAllSupportTickets: () => request("/admin/support-tickets", { method: "GET" }),
    updateSupportTicket: (id: string, status: string, adminResponse?: string) =>
      request(`/admin/support-tickets/${id}/update`, { method: "POST", body: JSON.stringify({ status, adminResponse }) }),
    getNotifications: () =>
      request("/admin/notifications", { method: "GET" }),
  },
};


