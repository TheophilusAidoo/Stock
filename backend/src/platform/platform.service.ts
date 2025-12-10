import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  mobile?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  pan?: string;
  aadhaar?: string;
  profilePhoto?: string;
  emailVerified?: boolean;
  mobileVerified?: boolean;
  twoFactorEnabled?: boolean;
  defaultDepositMethod?: string;
  defaultWithdrawalMethod?: string;
  notificationPreferences?: {
    ipoAlerts?: boolean;
    depositUpdates?: boolean;
    withdrawalUpdates?: boolean;
    approvalNotifications?: boolean;
    systemAlerts?: boolean;
    loginAlerts?: boolean;
  };
  segment: string[];
  kycStatus: 'pending' | 'approved' | 'rejected';
  status: 'pending' | 'approved' | 'rejected';
  balance: number;
  createdAt: string;
};

type SupportTicket = {
  id: string;
  userId: string;
  subject: string;
  category: 'Deposit' | 'Withdrawal' | 'IPO' | 'Trading' | 'KYC' | 'Other';
  message: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
  updatedAt: string;
  adminResponse?: string;
};

type SupportMessage = {
  id: string;
  ticketId: string;
  senderType: 'user' | 'admin';
  senderId: string;
  message: string;
  createdAt: string;
};

type KycRequest = {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  documentName?: string;
  documentSize?: number;
  documentData?: string; // Base64 encoded file data
  documentType?: string; // MIME type
  payload: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
};

type WalletTxn = {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  channel: string;
  gatewayId?: string;
  methodId?: string;
  withdrawalAccount?: string;
  withdrawalDetails?: Record<string, string>;
  fee?: number;
  finalAmount?: number;
  rejectionReason?: string;
  screenshotData?: string;
  description?: string;
  screenshotType?: string;
  status: 'pending' | 'completed' | 'approved' | 'rejected';
  timestamp: string;
};

type Order = {
  id: string;
  userId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  status: 'Executed' | 'Pending';
  executedAt?: string;
};

type Position = {
  userId: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
  ltp: number;
  invested: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
};

type RealizedPnl = {
  id: string;
  userId: string;
  symbol: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  pnl: number;
  executedAt: string;
};

type Ipo = {
  id: string;
  companyName: string;
  companyLogo?: string;
  ipoType: 'Mainline' | 'SME';
  priceMin: number;
  priceMax: number;
  lotSize: number;
  minInvestment: number;
  openDate: string;
  closeDate: string;
  description: string;
  status: 'Upcoming' | 'Live' | 'Closed';
  isActive: boolean;
  createdAt: string;
  // Discount fields
  ipoPrice?: number; // Base IPO price
  discountType?: 'Percentage' | 'Fixed';
  discountValue?: number; // Percentage (0-100) or fixed amount
  finalPrice?: number; // Auto-calculated final price
  showDiscount?: boolean; // Whether to show discount to users
};

type IpoApplication = {
  id: string;
  ipoId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  lots: number;
  amount: number;
  status: 'Pending Allotment' | 'Allotted' | 'Not Allotted';
  appliedAt: string;
  allottedAt?: string;
  rejectedAt?: string;
};

@Injectable()
export class PlatformService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // Keep in-memory arrays as fallback/cache (will be replaced with Supabase)
  private users: User[] = [
    {
      id: 'USR001',
      name: 'Aditi Sharma',
      email: 'aditi@stockmart.com',
      password: 'aditi@stockmart.com',
      mobile: '+91 9876543210',
      dateOfBirth: '1990-05-15',
      gender: 'Female',
      address: '123, MG Road, Mumbai, Maharashtra 400001',
      pan: 'ABCDE1234F',
      aadhaar: '1234 5678 9012',
      emailVerified: true,
      mobileVerified: true,
      twoFactorEnabled: false,
      defaultDepositMethod: 'GW001',
      defaultWithdrawalMethod: 'WM001',
      notificationPreferences: {
        ipoAlerts: true,
        depositUpdates: true,
        withdrawalUpdates: true,
        approvalNotifications: true,
        systemAlerts: true,
        loginAlerts: false,
      },
      segment: ['Equity', 'F&O'],
      kycStatus: 'approved',
      status: 'approved',
      balance: 1124890,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ADM001',
      name: 'Admin User',
      email: 'admin@stockmart.com',
      password: 'admin@stockmart.com',
      segment: ['Equity', 'F&O', 'Currency', 'Commodity'],
      kycStatus: 'approved',
      status: 'approved',
      balance: 0,
      createdAt: new Date().toISOString(),
    },
  ];

  private paymentGateways = [
    {
      id: 'GW001',
      name: 'USDT (TRC20)',
      trc20Address: 'TXYZabcdefghijklmnopqrstuvwxyz123456',
      trc20QrCode: '', // Will be base64 QR code
      minDeposit: 100,
      confirmationTime: '15-30 minutes',
      instructions: 'Send USDT (TRC20) to the address below. Minimum deposit: $100. Confirmation time: 15-30 minutes.',
      isActive: true,
    },
  ];

  private withdrawalMethods = [
    {
      id: 'WM001',
      name: 'TRC20 USDT',
      type: 'trc20',
      minAmount: 50,
      fee: 2,
      processingTime: '1-2 hours',
      isActive: true,
    },
    {
      id: 'WM002',
      name: 'Bank Transfer',
      type: 'bank',
      minAmount: 100,
      fee: 5,
      processingTime: '1-3 business days',
      isActive: true,
    },
    {
      id: 'WM003',
      name: 'Binance Pay',
      type: 'binance',
      minAmount: 20,
      fee: 1,
      processingTime: '30 minutes - 2 hours',
      isActive: true,
    },
  ];

  private kycs: KycRequest[] = [];
  private walletHistory: WalletTxn[] = [];
  private orders: Order[] = [];
  private positions: Position[] = [];
  private realizedPnl: RealizedPnl[] = [];

  // Market prices (mock data - in real app, fetch from market data API)
  private getMarketPrice(symbol: string): number {
    const prices: Record<string, number> = {
      'RELIANCE': 2540.00,
      'TCS': 3695.20,
      'HDFCBANK': 1653.50,
      'INFY': 1558.10,
      'ICICIBANK': 980.30,
      'HINDUNILVR': 2500.00,
      'SBIN': 600.50,
      'BHARTIARTL': 850.00,
      'ITC': 455.40,
      'KOTAKBANK': 1800.00,
      'LT': 2800.00,
      'AXISBANK': 1000.00,
      'ASIANPAINT': 3200.00,
      'MARUTI': 10500.00,
      'TITAN': 3000.00,
    };
    return prices[symbol] || 1000;
  }

  private ipos: Ipo[] = [
    {
      id: 'IPO001',
      companyName: 'Reliance JIO',
      ipoType: 'Mainline',
      priceMin: 850,
      priceMax: 950,
      lotSize: 1,
      minInvestment: 14200,
      openDate: '2025-01-15',
      closeDate: '2025-01-17',
      description: 'India\'s largest telecom operator, part of Reliance Industries. Offers 5G services, digital solutions, and enterprise connectivity across India.',
      status: 'Upcoming',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'IPO002',
      companyName: 'Oyo Rooms',
      ipoType: 'Mainline',
      priceMin: 165,
      priceMax: 185,
      lotSize: 85,
      minInvestment: 14025,
      openDate: '2025-01-20',
      closeDate: '2025-01-22',
      description: 'Leading hospitality technology platform offering budget and premium accommodations across India and international markets.',
      status: 'Upcoming',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'IPO003',
      companyName: 'Boat Lifestyle',
      ipoType: 'Mainline',
      priceMin: 1200,
      priceMax: 1350,
      lotSize: 12,
      minInvestment: 14400,
      openDate: '2025-02-01',
      closeDate: '2025-02-03',
      description: 'Popular consumer electronics brand specializing in audio products, smartwatches, and lifestyle accessories.',
      status: 'Upcoming',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'IPO004',
      companyName: 'Zepto',
      ipoType: 'Mainline',
      priceMin: 180,
      priceMax: 200,
      lotSize: 80,
      minInvestment: 14400,
      openDate: '2025-02-10',
      closeDate: '2025-02-12',
      description: 'Quick commerce platform delivering groceries and essentials in 10 minutes. Rapidly expanding across major Indian cities.',
      status: 'Upcoming',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'IPO005',
      companyName: 'PhonePe',
      ipoType: 'Mainline',
      priceMin: 950,
      priceMax: 1050,
      lotSize: 15,
      minInvestment: 14250,
      openDate: '2025-02-15',
      closeDate: '2025-02-17',
      description: 'India\'s leading digital payments platform with 500+ million registered users. Offers UPI, bill payments, and financial services.',
      status: 'Upcoming',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'IPO006',
      companyName: 'Snapdeal',
      ipoType: 'Mainline',
      priceMin: 45,
      priceMax: 55,
      lotSize: 300,
      minInvestment: 13500,
      openDate: '2025-02-20',
      closeDate: '2025-02-22',
      description: 'Value-focused e-commerce platform serving tier 2 and tier 3 cities with affordable products across multiple categories.',
      status: 'Upcoming',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'IPO007',
      companyName: 'Zomato',
      ipoType: 'Mainline',
      priceMin: 125,
      priceMax: 135,
      lotSize: 115,
      minInvestment: 14375,
      openDate: '2024-12-20',
      closeDate: '2024-12-22',
      description: 'Food delivery and restaurant discovery platform. One of India\'s largest food-tech companies with strong market presence.',
      status: 'Live',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'IPO008',
      companyName: 'Paytm',
      ipoType: 'Mainline',
      priceMin: 2150,
      priceMax: 2250,
      lotSize: 6,
      minInvestment: 12900,
      openDate: '2024-12-18',
      closeDate: '2024-12-20',
      description: 'Digital payments and financial services company offering mobile payments, banking, and wealth management solutions.',
      status: 'Live',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'IPO009',
      companyName: 'Nykaa',
      ipoType: 'Mainline',
      priceMin: 1120,
      priceMax: 1180,
      lotSize: 12,
      minInvestment: 13440,
      openDate: '2024-12-15',
      closeDate: '2024-12-17',
      description: 'Beauty and personal care e-commerce platform. Leading omnichannel retailer in the beauty and wellness segment.',
      status: 'Live',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'IPO010',
      companyName: 'Policybazaar',
      ipoType: 'Mainline',
      priceMin: 980,
      priceMax: 1020,
      lotSize: 15,
      minInvestment: 14700,
      openDate: '2024-12-10',
      closeDate: '2024-12-12',
      description: 'India\'s largest online insurance aggregator. Simplifies insurance buying with comparison tools and digital processes.',
      status: 'Closed',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'IPO011',
      companyName: 'Delhivery',
      ipoType: 'Mainline',
      priceMin: 487,
      priceMax: 495,
      lotSize: 30,
      minInvestment: 14610,
      openDate: '2024-11-20',
      closeDate: '2024-11-22',
      description: 'Leading logistics and supply chain services provider. Offers express parcel transportation and warehousing solutions.',
      status: 'Closed',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'IPO012',
      companyName: 'Freshworks',
      ipoType: 'Mainline',
      priceMin: 900,
      priceMax: 950,
      lotSize: 16,
      minInvestment: 14400,
      openDate: '2024-11-15',
      closeDate: '2024-11-17',
      description: 'SaaS company providing customer engagement and IT service management software for businesses globally.',
      status: 'Closed',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'IPO013',
      companyName: 'Mamaearth',
      ipoType: 'Mainline',
      priceMin: 324,
      priceMax: 340,
      lotSize: 45,
      minInvestment: 14580,
      openDate: '2024-11-10',
      closeDate: '2024-11-12',
      description: 'Natural and toxin-free personal care brand. Popular among millennials and Gen Z for organic beauty products.',
      status: 'Closed',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'IPO014',
      companyName: 'Lenskart',
      ipoType: 'Mainline',
      priceMin: 550,
      priceMax: 580,
      lotSize: 26,
      minInvestment: 14300,
      openDate: '2025-03-01',
      closeDate: '2025-03-03',
      description: 'Omnichannel eyewear retailer offering prescription glasses, sunglasses, and contact lenses with home eye checkup services.',
      status: 'Upcoming',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'IPO015',
      companyName: 'Razorpay',
      ipoType: 'Mainline',
      priceMin: 750,
      priceMax: 800,
      lotSize: 19,
      minInvestment: 14250,
      openDate: '2025-03-10',
      closeDate: '2025-03-12',
      description: 'Full-stack financial services company providing payment gateway, banking, and lending solutions for businesses.',
      status: 'Upcoming',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'IPO016',
      companyName: 'Swiggy',
      ipoType: 'Mainline',
      priceMin: 380,
      priceMax: 420,
      lotSize: 38,
      minInvestment: 14440,
      openDate: '2025-03-15',
      closeDate: '2025-03-17',
      description: 'Food delivery and instant grocery platform. One of India\'s leading quick commerce and food-tech companies.',
      status: 'Upcoming',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'IPO017',
      companyName: 'Byju\'s',
      ipoType: 'Mainline',
      priceMin: 250,
      priceMax: 280,
      lotSize: 60,
      minInvestment: 15000,
      openDate: '2025-03-20',
      closeDate: '2025-03-22',
      description: 'EdTech platform offering online learning courses, test preparation, and educational content for students.',
      status: 'Upcoming',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'IPO018',
      companyName: 'CRED',
      ipoType: 'Mainline',
      priceMin: 1200,
      priceMax: 1300,
      lotSize: 12,
      minInvestment: 14400,
      openDate: '2025-04-01',
      closeDate: '2025-04-03',
      description: 'Credit card bill payment platform with rewards. Expanding into financial services including lending and investments.',
      status: 'Upcoming',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'IPO019',
      companyName: 'Unacademy',
      ipoType: 'Mainline',
      priceMin: 320,
      priceMax: 350,
      lotSize: 45,
      minInvestment: 14400,
      openDate: '2025-04-10',
      closeDate: '2025-04-12',
      description: 'Online learning platform offering courses for competitive exams, skill development, and professional certifications.',
      status: 'Upcoming',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'IPO020',
      companyName: 'Dream11',
      ipoType: 'Mainline',
      priceMin: 450,
      priceMax: 480,
      lotSize: 32,
      minInvestment: 14400,
      openDate: '2025-04-15',
      closeDate: '2025-04-17',
      description: 'Fantasy sports platform allowing users to create virtual teams and compete in cricket, football, and other sports.',
      status: 'Upcoming',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'IPO021',
      companyName: 'Razorpay',
      ipoType: 'SME',
      priceMin: 85,
      priceMax: 95,
      lotSize: 160,
      minInvestment: 13600,
      openDate: '2024-12-25',
      closeDate: '2024-12-27',
      description: 'SME-focused payment solutions provider offering simplified payment processing for small and medium enterprises.',
      status: 'Live',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  private ipoApplications: IpoApplication[] = [];

  private marketData = [
    { name: 'NIFTY 50', value: 23124.6, change: 142.4, changePct: 0.64 },
    { name: 'SENSEX', value: 76588.9, change: -32.5, changePct: -0.04 },
    { name: 'NIFTY BANK', value: 48532.4, change: 285.6, changePct: 0.59 },
    { name: 'NIFTY IT', value: 32145.8, change: -125.3, changePct: -0.39 },
    { name: 'NIFTY PHARMA', value: 18542.3, change: 98.7, changePct: 0.54 },
    { name: 'NIFTY AUTO', value: 19876.5, change: 156.2, changePct: 0.79 },
    { name: 'NIFTY FMCG', value: 56234.1, change: 234.5, changePct: 0.42 },
    { name: 'NIFTY ENERGY', value: 32456.7, change: 187.3, changePct: 0.58 },
    { name: 'NIFTY METAL', value: 8765.4, change: -45.2, changePct: -0.51 },
    { name: 'NIFTY REALTY', value: 845.6, change: 12.3, changePct: 1.48 },
    { name: 'NIFTY PSU BANK', value: 6543.2, change: 45.6, changePct: 0.70 },
    { name: 'NIFTY PRIVATE BANK', value: 23456.8, change: 123.4, changePct: 0.53 },
  ];

  async login(email: string, password?: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    // First try to get user from Supabase
    const { data: userData, error: supabaseError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    let user: User | null = null;
    
    if (userData) {
      // Convert Supabase user to User type
      user = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        password: userData.password,
        mobile: userData.mobile,
        dateOfBirth: userData.date_of_birth,
        gender: userData.gender,
        address: userData.address,
        pan: userData.pan,
        aadhaar: userData.aadhaar,
        profilePhoto: userData.profile_photo,
        emailVerified: userData.email_verified || false,
        mobileVerified: userData.mobile_verified || false,
        twoFactorEnabled: userData.two_factor_enabled || false,
        defaultDepositMethod: userData.default_deposit_method,
        defaultWithdrawalMethod: userData.default_withdrawal_method,
        notificationPreferences: userData.notification_preferences || {},
        segment: userData.segment || [],
        kycStatus: userData.kyc_status || 'pending',
        status: userData.status || 'pending',
        balance: Number(userData.balance) || 0,
        createdAt: userData.created_at,
      };
    } else {
      // Fallback to in-memory array
      user = this.users.find((u) => u.email === email) || null;
    }
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    // If user has a password set, validate it
    if (user.password && password !== user.password) {
      throw new UnauthorizedException('Invalid password');
    }
    
    // Check if user is approved by admin
    if (user.status !== 'approved') {
      if (user.status === 'pending') {
        throw new BadRequestException('Your account is pending approval. Please wait for approval.');
      } else if (user.status === 'rejected') {
        throw new BadRequestException('Your account has been rejected. Please contact support.');
      } else {
        throw new BadRequestException('Your account is not approved. Please contact support.');
      }
    }
    
    return {
      token: `token-${user.id}`,
      refreshToken: `refresh-${user.id}`,
    };
  }

  async register(payload: { name?: string; email: string; password?: string; segment?: string[] }) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Check if user exists in Supabase
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', payload.email)
      .single();

    // Also check in-memory fallback
    const existsInMemory = this.users.some((u) => u.email === payload.email);

    if (existingUser || existsInMemory) {
      throw new BadRequestException('User already registered');
    }

    const user: User = {
      id: this.generateId('USR'),
      name: payload.name ?? 'Investor',
      email: payload.email,
      password: payload.password,
      segment: payload.segment ?? ['Equity'],
      kycStatus: 'pending',
      status: 'pending',
      balance: 0,
      createdAt: new Date().toISOString(),
    };

    // Insert into Supabase
    const { error } = await supabase.from('users').insert({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      segment: user.segment,
      kyc_status: user.kycStatus,
      status: user.status,
      balance: user.balance,
      created_at: user.createdAt,
    });

    if (error) {
      console.error('Error inserting user to Supabase:', error);
      // Continue with in-memory fallback
    }

    // Also add to in-memory array as fallback
    this.users.push(user);
    return user;
  }

  async submitKyc(userId: string | undefined, payload: Record<string, unknown>) {
    const supabase = this.supabaseService.getAdminClient();
    const fallbackUser = this.users[0];
    const resolvedUserId = userId ?? fallbackUser?.id ?? this.generateId('USR');
    
    // Get user from Supabase or fallback
    let user: User | null = null;
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', resolvedUserId)
      .single();
    
    if (userData) {
      user = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        balance: Number(userData.balance) || 0,
      } as User;
    } else {
      user = this.users.find((u) => u.id === resolvedUserId) || null;
    }
    
    if (!user) {
      user = {
        id: resolvedUserId,
        name: (payload['name'] as string) ?? 'Investor',
        email: (payload['email'] as string) ?? 'unknown@stockmart.com',
        segment: ['Equity'],
        kycStatus: 'pending',
        status: 'pending',
        balance: 0,
        createdAt: new Date().toISOString(),
      };
      this.users.push(user);
    }
    
    // Extract document info if it's a file upload
    const documentName = payload['documentName'] as string || 'KYC Document';
    const documentSize = payload['documentSize'] as number || 0;
    const documentData = payload['documentData'] as string; // Base64 encoded
    const documentType = payload['documentType'] as string; // MIME type
    
    const kyc: KycRequest = {
      id: this.generateId('KYC'),
      userId: resolvedUserId,
      userName: user.name,
      userEmail: user.email,
      documentName,
      documentSize,
      documentData,
      documentType,
      payload,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    // Insert into Supabase
    const { error } = await supabase.from('kycs').insert({
      id: kyc.id,
      user_id: kyc.userId,
      user_name: kyc.userName,
      user_email: kyc.userEmail,
      document_name: kyc.documentName,
      document_size: kyc.documentSize,
      document_data: kyc.documentData,
      document_type: kyc.documentType,
      payload: kyc.payload,
      status: kyc.status,
      submitted_at: kyc.submittedAt,
    });

    if (error) {
      console.error('Error inserting KYC to Supabase:', error);
    }

    // Also add to in-memory array as fallback
    this.kycs.push(kyc);
    return kyc;
  }

  async deposit(amount: number, channel: string, userId?: string, gatewayId?: string, screenshotData?: string, screenshotType?: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Get user from Supabase or fallback
    let user: User | null = null;
    if (userId) {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userData) {
        user = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          balance: Number(userData.balance) || 0,
        } as User;
      }
    }
    
    if (!user) {
      user = userId ? this.users.find(u => u.id === userId) || null : this.users[0];
    }
    
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Get gateway from Supabase or fallback
    let gateway: any = null;
    if (gatewayId) {
      const { data: gwData } = await supabase
        .from('payment_gateways')
        .select('*')
        .eq('id', gatewayId)
        .single();
      
      if (gwData) {
        gateway = { id: gwData.id, name: gwData.name };
      } else {
        gateway = this.paymentGateways.find(gw => gw.id === gatewayId) || null;
      }
    }

    const txn: WalletTxn = {
      id: this.generateId('TXN'),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      type: 'deposit',
      amount,
      channel: gateway?.name || channel,
      gatewayId,
      screenshotData,
      screenshotType,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    // Insert into Supabase
    const { error } = await supabase.from('wallet_txns').insert({
      id: txn.id,
      user_id: txn.userId,
      user_name: txn.userName,
      user_email: txn.userEmail,
      type: txn.type,
      amount: txn.amount,
      channel: txn.channel,
      gateway_id: txn.gatewayId,
      screenshot_data: txn.screenshotData,
      screenshot_type: txn.screenshotType,
      status: txn.status,
      timestamp: txn.timestamp,
    });

    if (error) {
      console.error('Error inserting deposit to Supabase:', error);
      // Continue with in-memory fallback
    }

    // Also add to in-memory array as fallback
    this.walletHistory.push(txn);
    return txn;
  }

  async withdraw(amount: number, methodId: string, userId?: string, withdrawalAccount?: string, withdrawalDetails?: Record<string, string>) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Get withdrawal method from Supabase or fallback
    let method: any = null;
    const { data: methodData } = await supabase
      .from('withdrawal_methods')
      .select('*')
      .eq('id', methodId)
      .eq('is_active', true)
      .single();
    
    if (methodData) {
      method = {
        id: methodData.id,
        name: methodData.name,
        minAmount: Number(methodData.min_amount) || 0,
        fee: Number(methodData.fee) || 0,
      };
    } else {
      method = this.withdrawalMethods.find(m => m.id === methodId && m.isActive);
    }
    
    if (!method) {
      throw new BadRequestException('Withdrawal method not found');
    }
    if (amount < method.minAmount) {
      throw new BadRequestException(`Minimum withdrawal amount is ${method.minAmount}`);
    }
    
    // Get user from Supabase or fallback
    let user: User | null = null;
    if (userId) {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userData) {
        user = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          balance: Number(userData.balance) || 0,
        } as User;
      }
    }
    
    if (!user) {
      user = userId ? this.users.find(u => u.id === userId) || null : this.users[0];
    }
    
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const fee = method.fee || 0;
    const finalAmount = amount - fee;

    const txn: WalletTxn = {
      id: this.generateId('TXN'),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      type: 'withdrawal',
      amount,
      channel: method.name,
      methodId,
      withdrawalAccount,
      withdrawalDetails,
      fee,
      finalAmount,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    // Insert into Supabase
    const { error } = await supabase.from('wallet_txns').insert({
      id: txn.id,
      user_id: txn.userId,
      user_name: txn.userName,
      user_email: txn.userEmail,
      type: txn.type,
      amount: txn.amount,
      channel: txn.channel,
      method_id: txn.methodId,
      withdrawal_account: txn.withdrawalAccount,
      withdrawal_details: txn.withdrawalDetails || {},
      fee: txn.fee,
      final_amount: txn.finalAmount,
      status: txn.status,
      timestamp: txn.timestamp,
    });

    if (error) {
      console.error('Error inserting withdrawal to Supabase:', error);
    }

    // Also add to in-memory array as fallback
    this.walletHistory.push(txn);
    return txn;
  }

  async getWithdrawalMethods() {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('withdrawal_methods')
      .select('*')
      .eq('is_active', true);
    
    if (data && !error) {
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        minAmount: Number(row.min_amount) || 0,
        fee: Number(row.fee) || 0,
        processingTime: row.processing_time,
        isActive: row.is_active,
      }));
    }
    return this.withdrawalMethods.filter(m => m.isActive);
  }

  async getAllWithdrawalMethods() {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase.from('withdrawal_methods').select('*');
    
    if (data && !error) {
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        minAmount: Number(row.min_amount) || 0,
        fee: Number(row.fee) || 0,
        processingTime: row.processing_time,
        isActive: row.is_active,
      }));
    }
    return this.withdrawalMethods;
  }

  async addWithdrawalMethod(name: string, type: string, minAmount: number, fee: number, processingTime: string) {
    const supabase = this.supabaseService.getAdminClient();
    const method = {
      id: this.generateId('WM'),
      name,
      type,
      minAmount,
      fee,
      processingTime,
      isActive: true,
    };

    const { error } = await supabase.from('withdrawal_methods').insert({
      id: method.id,
      name: method.name,
      type: method.type,
      min_amount: method.minAmount,
      fee: method.fee,
      processing_time: method.processingTime,
      is_active: method.isActive,
    });

    if (error) {
      console.error('Error inserting withdrawal method to Supabase:', error);
    }

    this.withdrawalMethods.push(method);
    return method;
  }

  async updateWithdrawalMethod(id: string, name: string, type: string, minAmount: number, fee: number, processingTime: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { error } = await supabase
      .from('withdrawal_methods')
      .update({
        name,
        type,
        min_amount: minAmount,
        fee,
        processing_time: processingTime,
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating withdrawal method in Supabase:', error);
    }

    const method = this.withdrawalMethods.find(m => m.id === id);
    if (!method) {
      throw new BadRequestException('Withdrawal method not found');
    }
    method.name = name;
    method.type = type;
    method.minAmount = minAmount;
    method.fee = fee;
    method.processingTime = processingTime;
    return method;
  }

  async deleteWithdrawalMethod(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { error } = await supabase
      .from('withdrawal_methods')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting withdrawal method from Supabase:', error);
    }

    const index = this.withdrawalMethods.findIndex(m => m.id === id);
    if (index === -1) {
      throw new BadRequestException('Withdrawal method not found');
    }
    this.withdrawalMethods.splice(index, 1);
    return { success: true };
  }

  async getPendingWithdrawals() {
    const supabase = this.supabaseService.getAdminClient();
    const { data: txnsData, error } = await supabase
      .from('wallet_txns')
      .select('*')
      .eq('type', 'withdrawal')
      .eq('status', 'pending')
      .order('timestamp', { ascending: false });

    if (txnsData && !error) {
      return txnsData.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        type: row.type,
        amount: Number(row.amount) || 0,
        channel: row.channel,
        methodId: row.method_id,
        withdrawalAccount: row.withdrawal_account,
        withdrawalDetails: row.withdrawal_details || {},
        fee: Number(row.fee) || 0,
        finalAmount: Number(row.final_amount) || 0,
        status: row.status,
        timestamp: row.timestamp,
      }));
    }

    return this.walletHistory
      .filter(txn => txn.type === 'withdrawal' && txn.status === 'pending')
      .map(txn => {
        const user = this.users.find(u => u.id === txn.userId);
        return {
          ...txn,
          userName: user?.name || txn.userName,
          userEmail: user?.email || txn.userEmail,
        };
      });
  }

  async approveWithdrawal(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Get transaction from Supabase
    const { data: txnData, error: txnError } = await supabase
      .from('wallet_txns')
      .select('*')
      .eq('id', id)
      .single();

    let txn: WalletTxn | null = null;
    if (txnData && !txnError) {
      txn = {
        id: txnData.id,
        userId: txnData.user_id,
        type: txnData.type,
        amount: Number(txnData.amount) || 0,
        status: txnData.status,
      } as WalletTxn;
    } else {
      txn = this.walletHistory.find(t => t.id === id) || null;
    }

    if (!txn || txn.type !== 'withdrawal') {
      throw new BadRequestException('Withdrawal transaction not found');
    }
    if (txn.status !== 'pending') {
      throw new BadRequestException('Withdrawal already processed');
    }
    
    // Get user and check balance
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', txn.userId)
      .single();

    let user: User | null = null;
    if (userData) {
      user = {
        id: userData.id,
        balance: Number(userData.balance) || 0,
      } as User;
    } else {
      user = this.users.find(u => u.id === txn.userId) || null;
    }

    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.balance < txn.amount) {
      throw new BadRequestException('Insufficient balance');
    }
    
    // Update transaction status and user balance in Supabase
    const newBalance = user.balance - txn.amount;
    await supabase
      .from('wallet_txns')
      .update({ status: 'approved' })
      .eq('id', id);
    
    await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', txn.userId);

    // Update in-memory
    txn.status = 'approved';
    if (this.users.find(u => u.id === txn.userId)) {
      this.users.find(u => u.id === txn.userId)!.balance = newBalance;
    }

    // Create notification for user
    await this.createNotification(
      txn.userId,
      'Deposit & Withdrawal updates',
      'Withdrawal Approved',
      `Your withdrawal of ₹${txn.amount.toLocaleString('en-IN')} has been approved and processed.`,
      '/user/wallet'
    );
    
    return txn;
  }

  async rejectWithdrawal(id: string, reason?: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { data: txnData } = await supabase
      .from('wallet_txns')
      .select('*')
      .eq('id', id)
      .single();

    let txn: WalletTxn | null = null;
    if (txnData) {
      txn = {
        id: txnData.id,
        userId: txnData.user_id,
        type: txnData.type,
        amount: Number(txnData.amount) || 0,
        status: txnData.status,
      } as WalletTxn;
    } else {
      txn = this.walletHistory.find(t => t.id === id) || null;
    }

    if (!txn || txn.type !== 'withdrawal') {
      throw new BadRequestException('Withdrawal transaction not found');
    }
    if (txn.status !== 'pending') {
      throw new BadRequestException('Withdrawal already processed');
    }
    
    // Update in Supabase
    await supabase
      .from('wallet_txns')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id);
    
    // Update in-memory
    txn.status = 'rejected';
    txn.rejectionReason = reason;

    // Create notification for user
    await this.createNotification(
      txn.userId,
      'Deposit & Withdrawal updates',
      'Withdrawal Rejected',
      `Your withdrawal of ₹${txn.amount.toLocaleString('en-IN')} has been rejected.${reason ? ` Reason: ${reason}` : ' Please contact support.'}`,
      '/user/wallet'
    );

    return txn;
  }

  async walletHistoryFeed(userId?: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    let query = supabase
      .from('wallet_txns')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(20);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: txnsData, error } = await query;

    if (txnsData && !error) {
      return txnsData.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        type: row.type,
        amount: Number(row.amount) || 0,
        channel: row.channel,
        gatewayId: row.gateway_id,
        methodId: row.method_id,
        withdrawalAccount: row.withdrawal_account,
        withdrawalDetails: row.withdrawal_details || {},
        fee: Number(row.fee) || 0,
        finalAmount: Number(row.final_amount) || 0,
        rejectionReason: row.rejection_reason,
        screenshotData: row.screenshot_data,
        screenshotType: row.screenshot_type,
        status: row.status,
        timestamp: row.timestamp,
      }));
    }

    // Fallback to in-memory array
    let history = this.walletHistory;
    if (userId) {
      history = history.filter(txn => txn.userId === userId);
    }
    return history.slice(-20).reverse();
  }

  async getPaymentGateways() {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('is_active', true);
    
    if (data && !error) {
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        trc20Address: row.trc20_address,
        trc20QrCode: row.trc20_qr_code,
        minDeposit: Number(row.min_deposit) || 0,
        confirmationTime: row.confirmation_time,
        instructions: row.instructions,
        isActive: row.is_active,
      }));
    }
    return this.paymentGateways.filter(gw => gw.isActive);
  }

  async getAllPaymentGateways() {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase.from('payment_gateways').select('*');
    
    if (data && !error) {
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        trc20Address: row.trc20_address,
        trc20QrCode: row.trc20_qr_code,
        minDeposit: Number(row.min_deposit) || 0,
        confirmationTime: row.confirmation_time,
        instructions: row.instructions,
        isActive: row.is_active,
      }));
    }
    return this.paymentGateways;
  }

  async addPaymentGateway(name: string, trc20Address: string, trc20QrCode: string, minDeposit: number, confirmationTime: string, instructions: string) {
    const supabase = this.supabaseService.getAdminClient();
    const gateway = {
      id: this.generateId('GW'),
      name,
      trc20Address,
      trc20QrCode,
      minDeposit,
      confirmationTime,
      instructions,
      isActive: true,
    };

    const { error } = await supabase.from('payment_gateways').insert({
      id: gateway.id,
      name: gateway.name,
      trc20_address: gateway.trc20Address,
      trc20_qr_code: gateway.trc20QrCode,
      min_deposit: gateway.minDeposit,
      confirmation_time: gateway.confirmationTime,
      instructions: gateway.instructions,
      is_active: gateway.isActive,
    });

    if (error) {
      console.error('Error inserting payment gateway to Supabase:', error);
    }

    this.paymentGateways.push(gateway);
    return gateway;
  }

  async updatePaymentGateway(id: string, name: string, trc20Address: string, trc20QrCode: string, minDeposit: number, confirmationTime: string, instructions: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { error } = await supabase
      .from('payment_gateways')
      .update({
        name,
        trc20_address: trc20Address,
        trc20_qr_code: trc20QrCode,
        min_deposit: minDeposit,
        confirmation_time: confirmationTime,
        instructions,
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating payment gateway in Supabase:', error);
    }

    const gateway = this.paymentGateways.find(gw => gw.id === id);
    if (!gateway) {
      throw new BadRequestException('Payment gateway not found');
    }
    gateway.name = name;
    gateway.trc20Address = trc20Address;
    gateway.trc20QrCode = trc20QrCode;
    gateway.minDeposit = minDeposit;
    gateway.confirmationTime = confirmationTime;
    gateway.instructions = instructions;
    return gateway;
  }

  async deletePaymentGateway(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { error } = await supabase
      .from('payment_gateways')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting payment gateway from Supabase:', error);
    }

    const index = this.paymentGateways.findIndex(gw => gw.id === id);
    if (index === -1) {
      throw new BadRequestException('Payment gateway not found');
    }
    this.paymentGateways.splice(index, 1);
    return { success: true };
  }

  async getPaymentGatewayById(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (data && !error) {
      return {
        id: data.id,
        name: data.name,
        trc20Address: data.trc20_address,
        trc20QrCode: data.trc20_qr_code,
        minDeposit: Number(data.min_deposit) || 0,
        confirmationTime: data.confirmation_time,
        instructions: data.instructions,
        isActive: data.is_active,
      };
    }

    const gateway = this.paymentGateways.find(gw => gw.id === id && gw.isActive);
    if (!gateway) {
      throw new BadRequestException('Payment gateway not found');
    }
    return gateway;
  }

  async getPendingDeposits() {
    const supabase = this.supabaseService.getAdminClient();
    const { data: txnsData, error } = await supabase
      .from('wallet_txns')
      .select('*')
      .eq('type', 'deposit')
      .eq('status', 'pending')
      .order('timestamp', { ascending: false });

    if (txnsData && !error) {
      return txnsData.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        type: row.type,
        amount: Number(row.amount) || 0,
        channel: row.channel,
        gatewayId: row.gateway_id,
        screenshotData: row.screenshot_data,
        screenshotType: row.screenshot_type,
        status: row.status,
        timestamp: row.timestamp,
      }));
    }

    return this.walletHistory
      .filter(txn => txn.type === 'deposit' && txn.status === 'pending')
      .map(txn => {
        const user = this.users.find(u => u.id === txn.userId);
        return {
          ...txn,
          userName: user?.name || txn.userName,
          userEmail: user?.email || txn.userEmail,
        };
      });
  }

  async getAllDeposits(userId?: string) {
    const supabase = this.supabaseService.getAdminClient();
    let query = supabase
      .from('wallet_txns')
      .select('*')
      .eq('type', 'deposit')
      .order('timestamp', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: txnsData, error } = await query;

    if (txnsData && !error) {
      return txnsData.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        type: row.type,
        amount: Number(row.amount) || 0,
        channel: row.channel,
        gatewayId: row.gateway_id,
        screenshotData: row.screenshot_data,
        screenshotType: row.screenshot_type,
        status: row.status,
        timestamp: row.timestamp,
      }));
    }

    let deposits = this.walletHistory.filter(txn => txn.type === 'deposit');
    if (userId) {
      deposits = deposits.filter(txn => txn.userId === userId);
    }
    return deposits.map(txn => {
      const user = this.users.find(u => u.id === txn.userId);
      return {
        ...txn,
        userName: user?.name || txn.userName,
        userEmail: user?.email || txn.userEmail,
      };
    }).reverse();
  }

  async getAllWithdrawals(userId?: string) {
    const supabase = this.supabaseService.getAdminClient();
    let query = supabase
      .from('wallet_txns')
      .select('*')
      .eq('type', 'withdrawal')
      .order('timestamp', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: txnsData, error } = await query;

    if (txnsData && !error) {
      return txnsData.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        type: row.type,
        amount: Number(row.amount) || 0,
        channel: row.channel,
        methodId: row.method_id,
        withdrawalAccount: row.withdrawal_account,
        withdrawalDetails: row.withdrawal_details || {},
        fee: Number(row.fee) || 0,
        finalAmount: Number(row.final_amount) || 0,
        rejectionReason: row.rejection_reason,
        status: row.status,
        timestamp: row.timestamp,
      }));
    }

    let withdrawals = this.walletHistory.filter(txn => txn.type === 'withdrawal');
    if (userId) {
      withdrawals = withdrawals.filter(txn => txn.userId === userId);
    }
    return withdrawals.map(txn => {
      const user = this.users.find(u => u.id === txn.userId);
      return {
        ...txn,
        userName: user?.name || txn.userName,
        userEmail: user?.email || txn.userEmail,
      };
    }).reverse();
  }

  async approveDeposit(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { data: txnData } = await supabase
      .from('wallet_txns')
      .select('*')
      .eq('id', id)
      .single();

    let txn: WalletTxn | null = null;
    if (txnData) {
      txn = {
        id: txnData.id,
        userId: txnData.user_id,
        type: txnData.type,
        amount: Number(txnData.amount) || 0,
        status: txnData.status,
      } as WalletTxn;
    } else {
      txn = this.walletHistory.find(t => t.id === id) || null;
    }

    if (!txn || txn.type !== 'deposit') {
      throw new BadRequestException('Deposit transaction not found');
    }
    if (txn.status !== 'pending') {
      throw new BadRequestException('Deposit already processed');
    }
    
    // Get user and update balance
    const { data: userData } = await supabase
      .from('users')
      .select('balance')
      .eq('id', txn.userId)
      .single();

    let currentBalance = 0;
    if (userData) {
      currentBalance = Number(userData.balance) || 0;
    } else {
      const user = this.users.find(u => u.id === txn.userId);
      currentBalance = user?.balance || 0;
    }

    const newBalance = currentBalance + txn.amount;

    // Update in Supabase
    await supabase
      .from('wallet_txns')
      .update({ status: 'approved' })
      .eq('id', id);
    
    await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', txn.userId);

    // Update in-memory
    txn.status = 'approved';
    const user = this.users.find(u => u.id === txn.userId);
    if (user) {
      user.balance = newBalance;
    }

    // Create notification for user
    await this.createNotification(
      txn.userId,
      'Deposit & Withdrawal updates',
      'Deposit Approved',
      `Your deposit of ₹${txn.amount.toLocaleString('en-IN')} has been approved and credited to your account.`,
      '/user/wallet'
    );
    
    return txn;
  }

  async rejectDeposit(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { data: txnData } = await supabase
      .from('wallet_txns')
      .select('*')
      .eq('id', id)
      .single();

    let txn: WalletTxn | null = null;
    if (txnData) {
      txn = {
        id: txnData.id,
        userId: txnData.user_id,
        type: txnData.type,
        amount: Number(txnData.amount) || 0,
        status: txnData.status,
      } as WalletTxn;
    } else {
      txn = this.walletHistory.find(t => t.id === id) || null;
    }

    if (!txn || txn.type !== 'deposit') {
      throw new BadRequestException('Deposit transaction not found');
    }
    if (txn.status !== 'pending') {
      throw new BadRequestException('Deposit already processed');
    }
    
    const reason = txnData?.rejection_reason;
    
    // Update in Supabase
    await supabase
      .from('wallet_txns')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', id);
    
    // Update in-memory
    txn.status = 'rejected';
    txn.rejectionReason = reason;

    // Create notification for user
    await this.createNotification(
      txn.userId,
      'Deposit & Withdrawal updates',
      'Deposit Rejected',
      `Your deposit of ₹${txn.amount.toLocaleString('en-IN')} has been rejected.${reason ? ` Reason: ${reason}` : ' Please contact support.'}`,
      '/user/wallet'
    );

    return txn;
  }

  async getUserBalance(userId: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();

    if (data && !error) {
      return Number(data.balance) || 0;
    }

    const user = this.users.find(u => u.id === userId);
    return user?.balance || 0;
  }

  async adjustUserBalance(userId: string, amount: number, type: 'add' | 'deduct', reason?: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Get user from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('balance, name, email')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      // Fallback to in-memory
      const user = this.users.find(u => u.id === userId);
      if (!user) {
        throw new BadRequestException('User not found');
      }
      
      if (type === 'deduct' && user.balance < amount) {
        throw new BadRequestException('Insufficient balance');
      }
      
      const newBalance = type === 'add' 
        ? user.balance + amount 
        : user.balance - amount;
      
      user.balance = newBalance;
      
      // Create wallet transaction
      const txn: WalletTxn = {
        id: this.generateId('TXN'),
        userId,
        type: type === 'add' ? 'deposit' : 'withdrawal',
        amount,
        status: 'approved',
        timestamp: new Date().toISOString(),
        channel: 'admin_adjustment',
        description: reason || `Admin ${type === 'add' ? 'added' : 'deducted'} balance`,
      };
      
      this.walletHistory.push(txn);
      return { success: true, newBalance, transaction: txn };
    }

    const currentBalance = Number(userData.balance) || 0;
    
    if (type === 'deduct' && currentBalance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const newBalance = type === 'add' 
      ? currentBalance + amount 
      : currentBalance - amount;

    // Update user balance in Supabase
    await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId);

    // Create wallet transaction in Supabase
    const txnId = this.generateId('TXN');
    await supabase.from('wallet_txns').insert({
      id: txnId,
      user_id: userId,
      user_name: userData.name,
      user_email: userData.email,
      type: type === 'add' ? 'deposit' : 'withdrawal',
      amount: amount,
      status: 'approved',
      channel: 'admin_adjustment',
      description: reason || `Admin ${type === 'add' ? 'added' : 'deducted'} balance`,
      timestamp: new Date().toISOString(),
    });

    // Update in-memory
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.balance = newBalance;
    }

    const txn: WalletTxn = {
      id: txnId,
      userId,
      type: type === 'add' ? 'deposit' : 'withdrawal',
      amount,
      status: 'approved',
      timestamp: new Date().toISOString(),
      channel: 'admin_adjustment',
      description: reason || `Admin ${type === 'add' ? 'added' : 'deducted'} balance`,
    };
    this.walletHistory.push(txn);

    // Create notification for user
    const action = type === 'add' ? 'added' : 'deducted';
    const actionText = type === 'add' ? 'added to' : 'deducted from';
    await this.createNotification(
      userId,
      'System alerts',
      `Balance ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
      `Admin ${action} ₹${amount.toLocaleString('en-IN')} ${actionText} your account.${reason ? ` Reason: ${reason}` : ''}`,
      '/user/wallet'
    );

    return { success: true, newBalance, transaction: txn };
  }

  marketQuotes() {
    return this.marketData;
  }

  marketDepth(symbol: string) {
    return {
      symbol: symbol.toUpperCase(),
      bids: [
        { price: 3650, qty: 150 },
        { price: 3648, qty: 120 },
      ],
      asks: [
        { price: 3652, qty: 130 },
        { price: 3655, qty: 140 },
      ],
    };
  }

  async placeOrder(payload: { symbol: string; quantity: number; price: number; side: 'BUY' | 'SELL'; userId?: string; timer?: number }) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Get userId from Supabase or fallback
    let userId = payload.userId;
    if (!userId) {
      const { data: firstUser } = await supabase
        .from('users')
        .select('id')
        .limit(1)
        .single();
      userId = firstUser?.id || this.users[0]?.id;
    }
    
    if (!userId) {
      throw new BadRequestException('User not found');
    }

    const symbol = payload.symbol.toUpperCase();
    const quantity = Number(payload.quantity);
    const price = Number(payload.price);
    
    // If timer is provided, create a timed trade instead of regular order
    if (payload.timer && payload.timer > 0) {
      // Calculate total amount for the trade
      const totalAmount = quantity * price;
      
      // Get user balance
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!userData) {
        throw new BadRequestException('User not found');
      }
      
      const userBalance = Number(userData.balance) || 0;
      if (userBalance < totalAmount) {
        throw new BadRequestException('Insufficient balance for timed trade');
      }
      
      // Get timer settings
      const { data: timerData } = await supabase
        .from('timer_settings')
        .select('*')
        .eq('timer_duration', payload.timer)
        .eq('is_enabled', true)
        .single();
      
      if (!timerData) {
        throw new BadRequestException('Timer not available or disabled');
      }
      
      // Get trading settings for profit rate
      const { data: tradingSettings } = await supabase
        .from('trading_settings')
        .select('*')
        .eq('id', 'SETTINGS001')
        .single();
      
      const profitRate = tradingSettings ? Number(tradingSettings.default_profit_rate) : 80;
      
      // Deduct amount from user balance
      const newBalance = userBalance - totalAmount;
      await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId);
      
      // Calculate expiry time
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + payload.timer);
      
      // Create timed trade
      const tradeId = this.generateId('TRADE');
      const tradeData: any = {
        id: tradeId,
        user_id: userId,
        user_name: userData.name,
        user_email: userData.email,
        amount: totalAmount,
        timer_duration: payload.timer,
        timer_label: timerData.timer_label,
        profit_rate: profitRate,
        status: 'pending',
        profit_amount: 0,
        expires_at: expiresAt.toISOString(),
      };
      
      // Add symbol and side if they exist (for backward compatibility)
      if (payload.symbol) {
        tradeData.symbol = payload.symbol;
      }
      if (payload.side) {
        tradeData.side = payload.side;
      }
      
      const { error: tradeError } = await supabase.from('timed_trades').insert(tradeData);
      
      if (tradeError) {
        console.error('Error creating timed trade:', tradeError);
        // Rollback balance
        await supabase
          .from('users')
          .update({ balance: userBalance })
          .eq('id', userId);
        throw new BadRequestException(`Failed to create timed trade: ${tradeError.message || 'Unknown error'}`);
      }
      
      return {
        id: tradeId,
        type: 'timed_trade',
        userId,
        symbol,
        side: payload.side,
        quantity,
        price,
        amount: totalAmount,
        timerDuration: payload.timer,
        timerLabel: timerData.timer_label,
        profitRate,
        status: 'pending',
        expiresAt: expiresAt.toISOString(),
        message: `Timed trade created. Amount ${totalAmount} blocked. Admin will set result.`,
      };
    }
    
    // Regular order (no timer)
    const order: Order = {
      id: this.generateId('ORD'),
      userId,
      symbol,
      side: payload.side,
      quantity,
      price,
      status: 'Executed',
      executedAt: new Date().toISOString(),
    };

    // Insert order into Supabase
    const { error: orderError } = await supabase.from('orders').insert({
      id: order.id,
      user_id: order.userId,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: order.price,
      status: order.status,
      executed_at: order.executedAt,
    });

    if (orderError) {
      console.error('Error inserting order to Supabase:', orderError);
    }

    this.orders.push(order);

    // Update positions based on order
    if (payload.side === 'BUY') {
      await this.updatePositionOnBuy(userId, symbol, quantity, price);
    } else {
      await this.updatePositionOnSell(userId, symbol, quantity, price);
    }

    return order;
  }

  private async updatePositionOnBuy(userId: string, symbol: string, quantity: number, price: number) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Get existing position from Supabase
    const { data: existingPos } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', symbol)
      .single();

    const ltp = this.getMarketPrice(symbol);
    let position: Position;

    if (existingPos) {
      // Update existing position
      const totalInvested = Number(existingPos.invested) + (quantity * price);
      const totalQuantity = existingPos.quantity + quantity;
      const avgPrice = totalInvested / totalQuantity;
      const currentValue = totalQuantity * ltp;
      const pnl = currentValue - totalInvested;
      const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

      position = {
        userId,
        symbol,
        quantity: totalQuantity,
        avgPrice,
        ltp,
        invested: totalInvested,
        currentValue,
        pnl,
        pnlPercent,
      };

      // Update in Supabase
      await supabase
        .from('positions')
        .update({
          quantity: totalQuantity,
          avg_price: avgPrice,
          ltp,
          invested: totalInvested,
          current_value: currentValue,
          pnl,
          pnl_percent: pnlPercent,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('symbol', symbol);
    } else {
      // Create new position
      const invested = quantity * price;
      const currentValue = quantity * ltp;
      
      position = {
        userId,
        symbol,
        quantity,
        avgPrice: price,
        ltp,
        invested,
        currentValue,
        pnl: 0,
        pnlPercent: 0,
      };

      // Insert into Supabase
      await supabase.from('positions').insert({
        user_id: userId,
        symbol,
        quantity,
        avg_price: price,
        ltp,
        invested,
        current_value: currentValue,
        pnl: 0,
        pnl_percent: 0,
      });
    }

    // Update in-memory
    const memIndex = this.positions.findIndex(p => p.userId === userId && p.symbol === symbol);
    if (memIndex >= 0) {
      this.positions[memIndex] = position;
    } else {
      this.positions.push(position);
    }
  }

  private async updatePositionOnSell(userId: string, symbol: string, quantity: number, price: number) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Get position from Supabase
    const { data: posData } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', symbol)
      .single();

    if (!posData || posData.quantity < quantity) {
      throw new BadRequestException('Insufficient quantity to sell');
    }

    // Calculate realized P&L
    const buyPrice = Number(posData.avg_price);
    const pnl = (price - buyPrice) * quantity;
    
    // Record realized P&L in Supabase
    const realizedPnlId = this.generateId('PNL');
    await supabase.from('realized_pnl').insert({
      id: realizedPnlId,
      user_id: userId,
      symbol,
      buy_price: buyPrice,
      sell_price: price,
      quantity,
      pnl,
      executed_at: new Date().toISOString(),
    });

    // Also add to in-memory
    this.realizedPnl.push({
      id: realizedPnlId,
      userId,
      symbol,
      buyPrice,
      sellPrice: price,
      quantity,
      pnl,
      executedAt: new Date().toISOString(),
    });

    // Update position
    const newQuantity = posData.quantity - quantity;
    const ltp = this.getMarketPrice(symbol);
    
    if (newQuantity === 0) {
      // Delete position from Supabase
      await supabase
        .from('positions')
        .delete()
        .eq('user_id', userId)
        .eq('symbol', symbol);
      
      // Remove from in-memory
      const index = this.positions.findIndex(p => p.userId === userId && p.symbol === symbol);
      if (index !== -1) {
        this.positions.splice(index, 1);
      }
    } else {
      // Update position in Supabase
      const invested = newQuantity * buyPrice;
      const currentValue = newQuantity * ltp;
      const newPnl = currentValue - invested;
      const pnlPercent = invested > 0 ? (newPnl / invested) * 100 : 0;

      await supabase
        .from('positions')
        .update({
          quantity: newQuantity,
          invested,
          current_value: currentValue,
          ltp,
          pnl: newPnl,
          pnl_percent: pnlPercent,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('symbol', symbol);

      // Update in-memory
      const position = this.positions.find(p => p.userId === userId && p.symbol === symbol);
      if (position) {
        position.quantity = newQuantity;
        position.invested = invested;
        position.ltp = ltp;
        position.currentValue = currentValue;
        position.pnl = newPnl;
        position.pnlPercent = pnlPercent;
      }
    }
  }

  async listOrders(userId?: string) {
    const supabase = this.supabaseService.getAdminClient();
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: ordersData, error } = await query;

    if (ordersData && !error) {
      return ordersData.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        symbol: row.symbol,
        side: row.side,
        quantity: row.quantity,
        price: Number(row.price) || 0,
        status: row.status,
        executedAt: row.executed_at,
      }));
    }

    let orders = this.orders;
    if (userId) {
      orders = orders.filter(o => o.userId === userId);
    }
    return orders.slice(-20).reverse();
  }

  async listPositions(userId?: string) {
    const supabase = this.supabaseService.getAdminClient();
    let query = supabase.from('positions').select('*');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: positionsData, error } = await query;

    if (positionsData && !error) {
      return positionsData.map((row: any) => {
        const ltp = this.getMarketPrice(row.symbol);
        const currentValue = row.quantity * ltp;
        const pnl = currentValue - Number(row.invested);
        const pnlPercent = Number(row.invested) > 0 ? (pnl / Number(row.invested)) * 100 : 0;

        return {
          userId: row.user_id,
          symbol: row.symbol,
          quantity: row.quantity,
          avgPrice: Number(row.avg_price) || 0,
          ltp,
          invested: Number(row.invested) || 0,
          currentValue,
          pnl,
          pnlPercent,
        };
      });
    }

    let positions = this.positions;
    if (userId) {
      positions = positions.filter(p => p.userId === userId);
    }
    
    return positions.map(pos => {
      pos.ltp = this.getMarketPrice(pos.symbol);
      pos.currentValue = pos.quantity * pos.ltp;
      pos.pnl = pos.currentValue - pos.invested;
      pos.pnlPercent = pos.invested > 0 ? (pos.pnl / pos.invested) * 100 : 0;
      return pos;
    });
  }

  async getRealizedPnl(userId?: string) {
    const supabase = this.supabaseService.getAdminClient();
    let query = supabase
      .from('realized_pnl')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(50);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: pnlData, error } = await query;

    if (pnlData && !error) {
      return pnlData.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        symbol: row.symbol,
        buyPrice: Number(row.buy_price) || 0,
        sellPrice: Number(row.sell_price) || 0,
        quantity: row.quantity,
        pnl: Number(row.pnl) || 0,
        executedAt: row.executed_at,
      }));
    }

    let pnl = this.realizedPnl;
    if (userId) {
      pnl = pnl.filter(p => p.userId === userId);
    }
    return pnl.slice(-50).reverse();
  }

  async getPortfolioSummary(userId?: string) {
    const positions = await this.listPositions(userId);
    const realizedPnl = await this.getRealizedPnl(userId);
    
    const totalInvested = positions.reduce((sum, p) => sum + p.invested, 0);
    const totalCurrentValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
    const unrealizedPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
    const totalRealizedPnl = realizedPnl.reduce((sum, p) => sum + p.pnl, 0);
    const totalPnl = unrealizedPnl + totalRealizedPnl;

    return {
      totalInvested,
      totalCurrentValue,
      unrealizedPnl,
      totalRealizedPnl,
      totalPnl,
      positionsCount: positions.length,
      positions,
      realizedPnl,
    };
  }

  async adminUsers() {
    const supabase = this.supabaseService.getAdminClient();
    
    // Try to get from Supabase
    const { data: usersData, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersData && !error) {
      return usersData.map((row: any) => {
        const user = {
          id: row.id,
          name: row.name,
          email: row.email,
          mobile: row.mobile,
          dateOfBirth: row.date_of_birth,
          gender: row.gender,
          address: row.address,
          pan: row.pan,
          aadhaar: row.aadhaar,
          profilePhoto: row.profile_photo,
          emailVerified: row.email_verified,
          mobileVerified: row.mobile_verified,
          twoFactorEnabled: row.two_factor_enabled,
          defaultDepositMethod: row.default_deposit_method,
          defaultWithdrawalMethod: row.default_withdrawal_method,
          notificationPreferences: row.notification_preferences || {},
          segment: Array.isArray(row.segment) ? row.segment.join(', ') : (row.segment || ''),
          kycStatus: row.kyc_status,
          status: row.status,
          balance: Number(row.balance) || 0,
          createdAt: row.created_at,
        };
        return user;
      });
    }

    // Fallback to in-memory array
    return this.users.map(user => ({
      ...user,
      segment: Array.isArray(user.segment) ? user.segment.join(', ') : user.segment,
    }));
  }

  async adminKycs() {
    const supabase = this.supabaseService.getAdminClient();
    const { data: kycsData, error } = await supabase
      .from('kycs')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (kycsData && !error) {
      // Get all unique user IDs
      const userIds = [...new Set(kycsData.map((row: any) => row.user_id))];
      
      // Fetch current user data from users table
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);
      
      // Create a map of user ID to user data
      const usersMap = new Map();
      if (usersData) {
        usersData.forEach((user: any) => {
          usersMap.set(user.id, { name: user.name, email: user.email });
        });
      }
      
      return kycsData.map((row: any) => {
        // Get current user data from users table, fallback to stored data
        const currentUser = usersMap.get(row.user_id);
        return {
          id: row.id,
          name: currentUser?.name || row.user_name || 'Unknown',
          email: currentUser?.email || row.user_email || 'unknown@stockmart.com',
          documentName: row.document_name || 'KYC Document',
          documentSize: row.document_size || 0,
          documentData: row.document_data,
          documentType: row.document_type,
          status: row.status,
          submittedAt: row.submitted_at,
          userId: row.user_id,
        };
      });
    }

    // Fallback to in-memory array
    return this.kycs.map(kyc => {
      const user = this.users.find(u => u.id === kyc.userId);
      return {
        id: kyc.id,
        name: user?.name || kyc.userName || 'Unknown',
        email: user?.email || kyc.userEmail || 'unknown@stockmart.com',
        documentName: kyc.documentName || 'KYC Document',
        documentSize: kyc.documentSize || 0,
        documentData: kyc.documentData,
        documentType: kyc.documentType,
        status: kyc.status,
        submittedAt: kyc.submittedAt,
        userId: kyc.userId,
      };
    });
  }

  async approveUser(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { error } = await supabase
      .from('users')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) {
      console.error('Error approving user in Supabase:', error);
    }

    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    user.status = 'approved';
    return user;
  }

  async rejectUser(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { error } = await supabase
      .from('users')
      .update({ status: 'rejected' })
      .eq('id', id);
    
    if (error) {
      console.error('Error rejecting user in Supabase:', error);
    }
    
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    user.status = 'rejected';
    return user;
  }

  async deleteUser(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Check if user exists
    const { data: userData } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', id)
      .single();
    
    if (!userData) {
      // Also check in-memory array
      const userInMemory = this.users.find((u) => u.id === id);
      if (!userInMemory) {
        throw new BadRequestException('User not found');
      }
    }
    
    // Prevent deletion of admin user
    if (userData?.email === 'admin@stockmart.com' || this.users.find(u => u.id === id)?.email === 'admin@stockmart.com') {
      throw new BadRequestException('Cannot delete admin user');
    }
    
    // Delete from Supabase (cascade deletes will handle related records)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting user from Supabase:', error);
      throw new BadRequestException('Failed to delete user');
    }
    
    // Remove from in-memory array
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex !== -1) {
      this.users.splice(userIndex, 1);
    }
    
    return { success: true, message: 'User deleted successfully' };
  }

  adminWallets() {
    return [
      { bank: 'HDFC Pool', balance: '₹12.4Cr', variance: '+₹12L' },
      { bank: 'ICICI Pool', balance: '₹8.2Cr', variance: '-₹2L' },
    ];
  }

  async getIpos(status?: 'Upcoming' | 'Live' | 'Closed') {
    const supabase = this.supabaseService.getAdminClient();
    let query = supabase
      .from('ipos')
      .select('*')
      .eq('is_active', true);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: iposData, error } = await query;

    if (iposData && !error) {
      return iposData.map((row: any) => ({
        id: row.id,
        companyName: row.company_name,
        companyLogo: row.company_logo,
        ipoType: row.ipo_type,
        priceMin: Number(row.price_min) || 0,
        priceMax: Number(row.price_max) || 0,
        lotSize: row.lot_size,
        minInvestment: Number(row.min_investment) || 0,
        openDate: row.open_date,
        closeDate: row.close_date,
        description: row.description,
        status: row.status,
        isActive: row.is_active,
        ipoPrice: row.ipo_price ? Number(row.ipo_price) : undefined,
        discountType: row.discount_type,
        discountValue: row.discount_value ? Number(row.discount_value) : undefined,
        finalPrice: row.final_price ? Number(row.final_price) : undefined,
        showDiscount: row.show_discount,
        createdAt: row.created_at,
      }));
    }

    let ipos = this.ipos.filter(ipo => ipo.isActive);
    if (status) {
      ipos = ipos.filter(ipo => ipo.status === status);
    }
    return ipos;
  }

  async getAllIpos() {
    const supabase = this.supabaseService.getAdminClient();
    const { data: iposData, error } = await supabase.from('ipos').select('*');

    if (iposData && !error) {
      return iposData.map((row: any) => ({
        id: row.id,
        companyName: row.company_name,
        companyLogo: row.company_logo,
        ipoType: row.ipo_type,
        priceMin: Number(row.price_min) || 0,
        priceMax: Number(row.price_max) || 0,
        lotSize: row.lot_size,
        minInvestment: Number(row.min_investment) || 0,
        openDate: row.open_date,
        closeDate: row.close_date,
        description: row.description,
        status: row.status,
        isActive: row.is_active,
        ipoPrice: row.ipo_price ? Number(row.ipo_price) : undefined,
        discountType: row.discount_type,
        discountValue: row.discount_value ? Number(row.discount_value) : undefined,
        finalPrice: row.final_price ? Number(row.final_price) : undefined,
        showDiscount: row.show_discount,
        createdAt: row.created_at,
      }));
    }

    return this.ipos;
  }

  async addIpo(payload: { companyName: string; companyLogo?: string; ipoType: 'Mainline' | 'SME'; priceMin: number; priceMax: number; lotSize: number; minInvestment: number; openDate: string; closeDate: string; description: string; status: 'Upcoming' | 'Live' | 'Closed'; ipoPrice?: number; discountType?: 'Percentage' | 'Fixed'; discountValue?: number; showDiscount?: boolean }) {
    // Calculate final price if discount is provided
    let finalPrice: number | undefined;
    if (payload.ipoPrice && payload.discountType && payload.discountValue !== undefined) {
      if (payload.discountType === 'Percentage') {
        finalPrice = payload.ipoPrice - (payload.ipoPrice * payload.discountValue / 100);
      } else {
        finalPrice = payload.ipoPrice - payload.discountValue;
      }
      // Ensure final price is not negative
      if (finalPrice < 0) finalPrice = 0;
    }

    const ipo: Ipo = {
      id: this.generateId('IPO'),
      companyName: payload.companyName,
      companyLogo: payload.companyLogo,
      ipoType: payload.ipoType,
      priceMin: payload.priceMin,
      priceMax: payload.priceMax,
      lotSize: payload.lotSize,
      minInvestment: payload.minInvestment,
      openDate: payload.openDate,
      closeDate: payload.closeDate,
      description: payload.description,
      status: payload.status,
      isActive: true,
      createdAt: new Date().toISOString(),
      ipoPrice: payload.ipoPrice,
      discountType: payload.discountType,
      discountValue: payload.discountValue,
      finalPrice: finalPrice,
      showDiscount: payload.showDiscount ?? false,
    };

    // Insert into Supabase
    const supabase = this.supabaseService.getAdminClient();
    const { error } = await supabase.from('ipos').insert({
      id: ipo.id,
      company_name: ipo.companyName,
      company_logo: ipo.companyLogo,
      ipo_type: ipo.ipoType,
      price_min: ipo.priceMin,
      price_max: ipo.priceMax,
      lot_size: ipo.lotSize,
      min_investment: ipo.minInvestment,
      open_date: ipo.openDate,
      close_date: ipo.closeDate,
      description: ipo.description,
      status: ipo.status,
      is_active: ipo.isActive,
      created_at: ipo.createdAt,
      ipo_price: ipo.ipoPrice,
      discount_type: ipo.discountType,
      discount_value: ipo.discountValue,
      final_price: ipo.finalPrice,
      show_discount: ipo.showDiscount,
    });

    if (error) {
      console.error('Error inserting IPO to Supabase:', error);
    }

    this.ipos.push(ipo);
    return ipo;
  }

  async updateIpo(id: string, payload: { companyName: string; companyLogo?: string; ipoType: 'Mainline' | 'SME'; priceMin: number; priceMax: number; lotSize: number; minInvestment: number; openDate: string; closeDate: string; description: string; status: 'Upcoming' | 'Live' | 'Closed'; ipoPrice?: number; discountType?: 'Percentage' | 'Fixed'; discountValue?: number; showDiscount?: boolean }) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Get current IPO to check status change
    const { data: currentIpoData } = await supabase
      .from('ipos')
      .select('status, company_name')
      .eq('id', id)
      .single();

    const currentStatus = currentIpoData?.status;
    const wasUpcoming = currentStatus === 'Upcoming';
    const isNowLive = payload.status === 'Live';
    
    // Calculate final price if discount is provided
    let finalPrice: number | undefined;
    if (payload.ipoPrice && payload.discountType && payload.discountValue !== undefined) {
      if (payload.discountType === 'Percentage') {
        finalPrice = payload.ipoPrice - (payload.ipoPrice * payload.discountValue / 100);
      } else {
        finalPrice = payload.ipoPrice - payload.discountValue;
      }
      if (finalPrice < 0) finalPrice = 0;
    }

    // Update in Supabase
    const { error } = await supabase
      .from('ipos')
      .update({
        company_name: payload.companyName,
        company_logo: payload.companyLogo,
        ipo_type: payload.ipoType,
        price_min: payload.priceMin,
        price_max: payload.priceMax,
        lot_size: payload.lotSize,
        min_investment: payload.minInvestment,
        open_date: payload.openDate,
        close_date: payload.closeDate,
        description: payload.description,
        status: payload.status,
        ipo_price: payload.ipoPrice,
        discount_type: payload.discountType,
        discount_value: payload.discountValue,
        final_price: finalPrice,
        show_discount: payload.showDiscount,
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating IPO in Supabase:', error);
    }

    const ipo = this.ipos.find(i => i.id === id);
    if (!ipo) {
      throw new BadRequestException('IPO not found');
    }

    Object.assign(ipo, {
      ...payload,
      finalPrice: finalPrice,
    });

    // Create notifications for all users when IPO goes live
    if (wasUpcoming && isNowLive) {
      const { data: allUsers } = await supabase
        .from('users')
        .select('id')
        .eq('status', 'approved');
      
      if (allUsers) {
        const companyName = payload.companyName || currentIpoData?.company_name || 'IPO';
        for (const user of allUsers) {
          await this.createNotification(
            user.id,
            'IPO Alerts',
            `${companyName} IPO is Now Live!`,
            `The ${companyName} IPO is now live and accepting applications. Apply now!`,
            '/user/ipo'
          );
        }
      }
    }

    return ipo;
  }

  async deleteIpo(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { error } = await supabase
      .from('ipos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting IPO from Supabase:', error);
    }

    const index = this.ipos.findIndex(i => i.id === id);
    if (index === -1) {
      throw new BadRequestException('IPO not found');
    }
    this.ipos.splice(index, 1);
    return { success: true };
  }

  async applyForIpo(ipoId: string, userId: string, lots: number) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Get IPO from Supabase
    const { data: ipoData } = await supabase
      .from('ipos')
      .select('*')
      .eq('id', ipoId)
      .eq('is_active', true)
      .single();

    let ipo: Ipo | null = null;
    if (ipoData) {
      ipo = {
        id: ipoData.id,
        status: ipoData.status,
        priceMin: Number(ipoData.price_min) || 0,
        lotSize: ipoData.lot_size,
        minInvestment: Number(ipoData.min_investment) || 0,
        finalPrice: ipoData.final_price ? Number(ipoData.final_price) : undefined,
      } as Ipo;
    } else {
      ipo = this.ipos.find(i => i.id === ipoId && i.isActive) || null;
    }

    if (!ipo) {
      throw new BadRequestException('IPO not found');
    }
    if (ipo.status !== 'Live') {
      throw new BadRequestException('IPO is not live for applications');
    }

    // Get user from Supabase
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    let user: User | null = null;
    if (userData) {
      user = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        balance: Number(userData.balance) || 0,
      } as User;
    } else {
      user = this.users.find(u => u.id === userId) || null;
    }

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const priceToUse = ipo.finalPrice || ipo.priceMin;
    const amount = lots * priceToUse * ipo.lotSize;
    if (amount < ipo.minInvestment) {
      throw new BadRequestException(`Minimum investment is ₹${ipo.minInvestment.toLocaleString('en-IN')}`);
    }

    const currentBalance = Number(user.balance) || 0;
    if (currentBalance < amount) {
      throw new BadRequestException(`Insufficient balance. Available: ₹${currentBalance.toLocaleString('en-IN')}, Required: ₹${amount.toLocaleString('en-IN')}`);
    }

    // Block the amount (deduct from balance)
    const newBalance = currentBalance - amount;

    const application: IpoApplication = {
      id: this.generateId('APP'),
      ipoId,
      userId,
      userName: user.name,
      userEmail: user.email,
      lots,
      amount,
      status: 'Pending Allotment',
      appliedAt: new Date().toISOString(),
    };

    // Insert application into Supabase
    await supabase.from('ipo_applications').insert({
      id: application.id,
      ipo_id: application.ipoId,
      user_id: application.userId,
      user_name: application.userName,
      user_email: application.userEmail,
      lots: application.lots,
      amount: application.amount,
      status: application.status,
      applied_at: application.appliedAt,
    });

    // Update user balance in Supabase
    await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId);

    // Update in-memory
    user.balance = newBalance;
    this.ipoApplications.push(application);
    return application;
  }

  async getUserIpoApplications(userId: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data: appsData, error } = await supabase
      .from('ipo_applications')
      .select('*')
      .eq('user_id', userId)
      .order('applied_at', { ascending: false });

    if (appsData && !error) {
      return appsData.map((row: any) => {
        const ipo = this.ipos.find(i => i.id === row.ipo_id);
        return {
          id: row.id,
          ipoId: row.ipo_id,
          userId: row.user_id,
          userName: row.user_name,
          userEmail: row.user_email,
          lots: row.lots,
          amount: Number(row.amount) || 0,
          status: row.status,
          appliedAt: row.applied_at,
          allottedAt: row.allotted_at,
          rejectedAt: row.rejected_at,
          ipo: ipo ? {
            companyName: ipo.companyName,
            companyLogo: ipo.companyLogo,
            priceMin: ipo.priceMin,
            priceMax: ipo.priceMax,
          } : null,
        };
      });
    }

    return this.ipoApplications
      .filter(app => app.userId === userId)
      .map(app => {
        const ipo = this.ipos.find(i => i.id === app.ipoId);
        return {
          ...app,
          ipo: ipo ? {
            companyName: ipo.companyName,
            companyLogo: ipo.companyLogo,
            priceMin: ipo.priceMin,
            priceMax: ipo.priceMax,
          } : null,
        };
      })
      .reverse();
  }

  async getIpoApplications(ipoId?: string) {
    const supabase = this.supabaseService.getAdminClient();
    let query = supabase
      .from('ipo_applications')
      .select('*')
      .order('applied_at', { ascending: false });

    if (ipoId) {
      query = query.eq('ipo_id', ipoId);
    }

    const { data: appsData, error } = await query;

    if (appsData && !error) {
      // Fetch all IPOs and users for enrichment
      const { data: iposData } = await supabase.from('ipos').select('id, company_name, company_logo');
      const { data: usersData } = await supabase.from('users').select('id, name, email');
      
      const ipoMap = new Map((iposData || []).map((ipo: any) => [ipo.id, ipo]));
      const userMap = new Map((usersData || []).map((user: any) => [user.id, user]));

      return appsData.map((row: any) => {
        const ipo = ipoMap.get(row.ipo_id);
        const user = userMap.get(row.user_id);
        return {
          id: row.id,
          ipoId: row.ipo_id,
          userId: row.user_id,
          userName: user?.name || row.user_name,
          userEmail: user?.email || row.user_email,
          lots: row.lots,
          amount: Number(row.amount) || 0,
          status: row.status,
          appliedAt: row.applied_at,
          allottedAt: row.allotted_at,
          rejectedAt: row.rejected_at,
          ipo: ipo ? {
            companyName: ipo.company_name,
            companyLogo: ipo.company_logo,
          } : null,
        };
      });
    }

    let applications = this.ipoApplications;
    if (ipoId) {
      applications = applications.filter(app => app.ipoId === ipoId);
    }
    return applications.map(app => {
      const ipo = this.ipos.find(i => i.id === app.ipoId);
      const user = this.users.find(u => u.id === app.userId);
      return {
        ...app,
        ipo: ipo ? {
          companyName: ipo.companyName,
          companyLogo: ipo.companyLogo,
        } : null,
        userName: user?.name || app.userName,
        userEmail: user?.email || app.userEmail,
      };
    }).reverse();
  }

  async approveIpoApplication(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { data: appData } = await supabase
      .from('ipo_applications')
      .select('*')
      .eq('id', id)
      .single();

    let application: IpoApplication | null = null;
    if (appData) {
      application = {
        id: appData.id,
        status: appData.status,
      } as IpoApplication;
    } else {
      application = this.ipoApplications.find(a => a.id === id) || null;
    }

    if (!application) {
      throw new BadRequestException('Application not found');
    }
    if (application.status !== 'Pending Allotment') {
      throw new BadRequestException('Application already processed');
    }

    // Update in Supabase
    await supabase
      .from('ipo_applications')
      .update({ 
        status: 'Allotted',
        allotted_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Update in-memory
    application.status = 'Allotted';
    application.allottedAt = new Date().toISOString();
    return application;
  }

  async rejectIpoApplication(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { data: appData } = await supabase
      .from('ipo_applications')
      .select('*')
      .eq('id', id)
      .single();

    let application: IpoApplication | null = null;
    if (appData) {
      application = {
        id: appData.id,
        userId: appData.user_id,
        amount: Number(appData.amount) || 0,
        status: appData.status,
      } as IpoApplication;
    } else {
      application = this.ipoApplications.find(a => a.id === id) || null;
    }

    if (!application) {
      throw new BadRequestException('Application not found');
    }
    if (application.status !== 'Pending Allotment') {
      throw new BadRequestException('Application already processed');
    }

    // Get user balance and refund
    const { data: userData } = await supabase
      .from('users')
      .select('balance')
      .eq('id', application.userId)
      .single();

    let currentBalance = 0;
    if (userData) {
      currentBalance = Number(userData.balance) || 0;
    } else {
      const user = this.users.find(u => u.id === application.userId);
      currentBalance = user?.balance || 0;
    }

    const newBalance = currentBalance + application.amount;

    // Update application and refund balance in Supabase
    await supabase
      .from('ipo_applications')
      .update({ 
        status: 'Not Allotted',
        rejected_at: new Date().toISOString(),
      })
      .eq('id', id);

    await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', application.userId);

    // Update in-memory
    const user = this.users.find(u => u.id === application.userId);
    if (user) {
      user.balance = newBalance;
    }
    application.status = 'Not Allotted';
    application.rejectedAt = new Date().toISOString();
    return application;
  }

  adminIpos() {
    return this.ipos;
  }

  adminAnalytics() {
    return {
      inflows: [3.2, 4.1, 5.4, 4.8, 6.2],
      revenueSplit: [
        { label: 'Brokerage', value: 42 },
        { label: 'Interest', value: 34 },
        { label: 'IPO/AMC', value: 18 },
        { label: 'Add-ons', value: 6 },
      ],
    };
  }

  async approveKyc(id: string) {
    return await this.updateKycStatus(id, 'approved');
  }

  async rejectKyc(id: string) {
    return await this.updateKycStatus(id, 'rejected');
  }

  private async updateKycStatus(id: string, status: KycRequest['status']) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Get KYC from Supabase
    const { data: kycData } = await supabase
      .from('kycs')
      .select('*')
      .eq('id', id)
      .single();

    let kyc: KycRequest | null = null;
    if (kycData) {
      kyc = {
        id: kycData.id,
        userId: kycData.user_id,
        status: kycData.status,
      } as KycRequest;
    } else {
      kyc = this.kycs.find((item) => item.id === id) || null;
    }

    if (!kyc) {
      throw new BadRequestException('KYC request not found');
    }

    // Update KYC status in Supabase
    await supabase
      .from('kycs')
      .update({ 
        status,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Update user KYC status in Supabase
    await supabase
      .from('users')
      .update({ kyc_status: status === 'approved' ? 'approved' : 'rejected' })
      .eq('id', kyc.userId);

    // Update in-memory
    kyc.status = status;
    const user = this.users.find((u) => u.id === kyc.userId);
    if (user) {
      user.kycStatus = status === 'approved' ? 'approved' : 'rejected';
    }
    return kyc;
  }

  private createWalletTxn(txnType: 'deposit' | 'withdrawal', amount: number, channel: string, userId?: string): WalletTxn {
    const user = userId ? this.users.find(u => u.id === userId) : this.users[0];
    return {
      id: this.generateId('TXN'),
      userId: user?.id || this.users[0].id,
      userName: user?.name,
      userEmail: user?.email,
      type: txnType,
      amount,
      channel,
      status: txnType === 'deposit' ? 'completed' : 'pending', // Withdrawals are pending initially
      timestamp: new Date().toISOString(),
    };
  }

  private generateId(prefix: string) {
    return `${prefix}${Math.floor(Math.random() * 10_000)}`;
  }

  async getUserProfile(userId: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userData && !error) {
      const { password, ...userProfile } = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        mobile: userData.mobile,
        dateOfBirth: userData.date_of_birth,
        gender: userData.gender,
        address: userData.address,
        pan: userData.pan,
        aadhaar: userData.aadhaar,
        profilePhoto: userData.profile_photo,
        emailVerified: userData.email_verified,
        mobileVerified: userData.mobile_verified,
        twoFactorEnabled: userData.two_factor_enabled,
        defaultDepositMethod: userData.default_deposit_method,
        defaultWithdrawalMethod: userData.default_withdrawal_method,
        notificationPreferences: userData.notification_preferences || {},
        segment: userData.segment || [],
        kycStatus: userData.kyc_status,
        status: userData.status,
        balance: Number(userData.balance) || 0,
        createdAt: userData.created_at,
        password: userData.password,
      };
      return userProfile;
    }

    const user = this.users.find(u => u.id === userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const { password, ...userProfile } = user;
    return userProfile;
  }

  async updateUserProfile(userId: string, payload: { name?: string; mobile?: string; address?: string; gender?: 'Male' | 'Female' | 'Other'; profilePhoto?: string }) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Validate userId
    if (!userId || userId.trim() === '') {
      throw new BadRequestException('User ID is required');
    }
    
    // Validate profile photo size if provided (max 6MB base64 string)
    if (payload.profilePhoto !== undefined) {
      if (!payload.profilePhoto || payload.profilePhoto.trim() === '') {
        throw new BadRequestException('Profile photo data is empty');
      }
      if (payload.profilePhoto.length > 6 * 1024 * 1024) {
        throw new BadRequestException('Profile photo is too large. Maximum size is 5MB.');
      }
    }
    
    const updateData: any = {};
    if (payload.name !== undefined) updateData.name = payload.name;
    if (payload.mobile !== undefined) updateData.mobile = payload.mobile;
    if (payload.address !== undefined) updateData.address = payload.address;
    if (payload.gender !== undefined) updateData.gender = payload.gender;
    if (payload.profilePhoto !== undefined) {
      updateData.profile_photo = payload.profilePhoto; // Store full data URL including prefix
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    console.log('Updating user profile:', { userId, fields: Object.keys(updateData), photoSize: payload.profilePhoto?.length });

    const { error, data: updateResult } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error updating user profile:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new BadRequestException(`Failed to update profile: ${error.message}`);
    }

    // Check if any rows were updated
    if (!updateResult || updateResult.length === 0) {
      console.warn('No rows updated. User might not exist:', userId);
      throw new BadRequestException('User not found or no changes made');
    }

    if (error) {
      console.error('Error updating user profile:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new BadRequestException(`Failed to update profile: ${error.message}`);
    }

    // Get updated user from Supabase
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !userData) {
      console.error('Error fetching updated user:', fetchError);
      throw new BadRequestException(`User not found after update: ${fetchError?.message || 'Unknown error'}`);
    }

    // Verify profile photo was saved if it was provided
    if (payload.profilePhoto !== undefined && userData.profile_photo !== payload.profilePhoto) {
      console.warn('Profile photo mismatch after update. Expected length:', payload.profilePhoto.length, 'Got length:', userData.profile_photo?.length || 0);
      // Don't throw error, just log warning - might be a truncation issue
    }

    // Update in-memory cache
    const user = this.users.find(u => u.id === userId);
    if (user) {
      if (payload.name !== undefined) user.name = payload.name;
      if (payload.mobile !== undefined) user.mobile = payload.mobile;
      if (payload.address !== undefined) user.address = payload.address;
      if (payload.gender !== undefined) user.gender = payload.gender;
      if (payload.profilePhoto !== undefined) user.profilePhoto = payload.profilePhoto;
    }
    
    // Return formatted profile
    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      mobile: userData.mobile,
      dateOfBirth: userData.date_of_birth,
      gender: userData.gender,
      address: userData.address,
      pan: userData.pan,
      aadhaar: userData.aadhaar,
      profilePhoto: userData.profile_photo,
      emailVerified: userData.email_verified,
      mobileVerified: userData.mobile_verified,
      twoFactorEnabled: userData.two_factor_enabled,
      defaultDepositMethod: userData.default_deposit_method,
      defaultWithdrawalMethod: userData.default_withdrawal_method,
      notificationPreferences: userData.notification_preferences,
      kycStatus: userData.kyc_status,
      status: userData.status,
      balance: Number(userData.balance) || 0,
      createdAt: userData.created_at,
    };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('password')
      .eq('id', userId)
      .single();

    if (fetchError || !userData) {
      // Fallback to in-memory
      const user = this.users.find(u => u.id === userId);
      if (!user) {
        throw new BadRequestException('User not found');
      }
      if (user.password && user.password !== oldPassword) {
        throw new BadRequestException('Current password is incorrect');
      }
      user.password = newPassword;
      return { success: true };
    }

    // Check old password
    if (userData.password && userData.password !== oldPassword) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Update password in Supabase
    const { error } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('id', userId);

    if (error) {
      console.error('Error updating password:', error);
      throw new BadRequestException(`Failed to update password: ${error.message}`);
    }

    // Update in-memory cache
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.password = newPassword;
    }

    return { success: true };
  }

  async updateTwoFactor(userId: string, enabled: boolean) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { error } = await supabase
      .from('users')
      .update({ two_factor_enabled: enabled })
      .eq('id', userId);

    if (error) {
      console.error('Error updating two-factor:', error);
      throw new BadRequestException(`Failed to update 2FA: ${error.message}`);
    }

    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.twoFactorEnabled = enabled;
    }
    
    return { twoFactorEnabled: enabled };
  }

  async updateWalletPreferences(userId: string, defaultDepositMethod?: string, defaultWithdrawalMethod?: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    const updateData: any = {};
    if (defaultDepositMethod !== undefined) updateData.default_deposit_method = defaultDepositMethod || null;
    if (defaultWithdrawalMethod !== undefined) updateData.default_withdrawal_method = defaultWithdrawalMethod || null;

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      console.error('Error updating wallet preferences:', error);
      throw new BadRequestException(`Failed to update wallet preferences: ${error.message}`);
    }

    const user = this.users.find(u => u.id === userId);
    if (user) {
      if (defaultDepositMethod !== undefined) user.defaultDepositMethod = defaultDepositMethod || undefined;
      if (defaultWithdrawalMethod !== undefined) user.defaultWithdrawalMethod = defaultWithdrawalMethod || undefined;
    }
    
    return {
      defaultDepositMethod: defaultDepositMethod || undefined,
      defaultWithdrawalMethod: defaultWithdrawalMethod || undefined,
    };
  }

  async updateNotificationPreferences(userId: string, preferences: Partial<User['notificationPreferences']>) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('notification_preferences')
      .eq('id', userId)
      .single();

    let currentPrefs = {};
    if (userData && userData.notification_preferences) {
      currentPrefs = userData.notification_preferences;
    } else {
      const user = this.users.find(u => u.id === userId);
      currentPrefs = user?.notificationPreferences || {};
    }

    const updatedPrefs = { ...currentPrefs, ...preferences };

    const { error } = await supabase
      .from('users')
      .update({ notification_preferences: updatedPrefs })
      .eq('id', userId);

    if (error) {
      console.error('Error updating notification preferences:', error);
      throw new BadRequestException(`Failed to update notification preferences: ${error.message}`);
    }

    const user = this.users.find(u => u.id === userId);
    if (user) {
      if (!user.notificationPreferences) {
        user.notificationPreferences = {};
      }
      Object.assign(user.notificationPreferences, preferences);
    }
    
    return updatedPrefs;
  }

  async verifyEmail(userId: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { error } = await supabase
      .from('users')
      .update({ email_verified: true })
      .eq('id', userId);

    if (error) {
      console.error('Error verifying email:', error);
      throw new BadRequestException(`Failed to verify email: ${error.message}`);
    }

    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.emailVerified = true;
    }
    
    return { emailVerified: true };
  }

  async verifyMobile(userId: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { error } = await supabase
      .from('users')
      .update({ mobile_verified: true })
      .eq('id', userId);

    if (error) {
      console.error('Error verifying mobile:', error);
      throw new BadRequestException(`Failed to verify mobile: ${error.message}`);
    }

    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.mobileVerified = true;
    }
    
    return { mobileVerified: true };
  }

  private supportTickets: SupportTicket[] = [];

  async createSupportTicket(userId: string, subject: string, category: SupportTicket['category'], message: string) {
    const supabase = this.supabaseService.getAdminClient();
    const ticket: SupportTicket = {
      id: this.generateId('TKT'),
      userId,
      subject,
      category,
      message,
      status: 'Open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await supabase.from('support_tickets').insert({
      id: ticket.id,
      user_id: ticket.userId,
      subject: ticket.subject,
      category: ticket.category,
      message: ticket.message,
      status: ticket.status,
      created_at: ticket.createdAt,
      updated_at: ticket.updatedAt,
    });

    // Add initial message from user
    await this.addSupportTicketMessage(ticket.id, 'user', userId, message);

    // Create admin notification for new support ticket
    // Get user info for notification
    const { data: userData } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', userId)
      .single();

    const userName = userData?.name || 'User';
    
    // Create notification for all admins (we'll use a special admin user ID or broadcast)
    // For now, we'll create a notification that can be fetched by admins
    await this.createAdminNotification(
      'New Support Ticket',
      `${userName} has created a new support ticket: "${subject}" (${category}).`,
      `/admin/support-tickets?ticket=${ticket.id}`
    );

    this.supportTickets.push(ticket);
    return ticket;
  }

  async getUserSupportTickets(userId: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data: ticketsData, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ticketsData && !error) {
      // Get messages for each ticket
      const ticketsWithMessages = await Promise.all(
        ticketsData.map(async (row: any) => {
          const { data: messagesData } = await supabase
            .from('support_messages')
            .select('*')
            .eq('ticket_id', row.id)
            .order('created_at', { ascending: true });

          const messages = messagesData?.map((msg: any) => ({
            id: msg.id,
            ticketId: msg.ticket_id,
            senderType: msg.sender_type,
            senderId: msg.sender_id,
            message: msg.message,
            createdAt: msg.created_at,
          })) || [];

          return {
            id: row.id,
            userId: row.user_id,
            subject: row.subject,
            category: row.category,
            message: row.message,
            status: row.status,
            adminResponse: row.admin_response, // Keep for backward compatibility
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            messages,
          };
        })
      );

      return ticketsWithMessages;
    }

    return this.supportTickets.filter(t => t.userId === userId).reverse();
  }

  async getSupportTicketMessages(ticketId: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data: messagesData, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (messagesData && !error) {
      return messagesData.map((msg: any) => ({
        id: msg.id,
        ticketId: msg.ticket_id,
        senderType: msg.sender_type,
        senderId: msg.sender_id,
        message: msg.message,
        createdAt: msg.created_at,
      }));
    }

    return [];
  }

  async addSupportTicketMessage(ticketId: string, senderType: 'user' | 'admin', senderId: string, message: string) {
    const supabase = this.supabaseService.getAdminClient();
    const messageId = this.generateId('MSG');

    const { error } = await supabase.from('support_messages').insert({
      id: messageId,
      ticket_id: ticketId,
      sender_type: senderType,
      sender_id: senderId,
      message,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error adding support message:', error);
      throw new BadRequestException(`Failed to add message: ${error.message}`);
    }

    // Update ticket updated_at
    await supabase
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    // Create notification if admin sends message
    if (senderType === 'admin') {
      try {
        const ticket = await this.getSupportTicket(ticketId);
        await this.createNotification(
          ticket.userId,
          'System alerts',
          'New Message on Support Ticket',
          `Support has sent a new message on your support ticket: "${ticket.subject}".`,
          `/user/settings?tab=help&ticket=${ticketId}`
        );
        console.log(`Notification created for user ${ticket.userId} about support ticket ${ticketId}`);
      } catch (error) {
        console.error('Error creating notification for support ticket message:', error);
      }
    }

    return {
      id: messageId,
      ticketId,
      senderType,
      senderId,
      message,
      createdAt: new Date().toISOString(),
    };
  }

  async getSupportTicket(id: string) {
    const supabase = this.supabaseService.getAdminClient();
    const { data: ticketData, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (ticketData && !error) {
      return {
        id: ticketData.id,
        userId: ticketData.user_id,
        subject: ticketData.subject,
        category: ticketData.category,
        message: ticketData.message,
        status: ticketData.status,
        adminResponse: ticketData.admin_response,
        createdAt: ticketData.created_at,
        updatedAt: ticketData.updated_at,
      };
    }

    const ticket = this.supportTickets.find(t => t.id === id);
    if (!ticket) {
      throw new BadRequestException('Ticket not found');
    }
    return ticket;
  }

  async getAllSupportTickets() {
    const supabase = this.supabaseService.getAdminClient();
    const { data: ticketsData, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (ticketsData && !error) {
      // Get user names for tickets
      const userIds = [...new Set(ticketsData.map((t: any) => t.user_id))];
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);

      const userMap = new Map((usersData || []).map((u: any) => [u.id, { name: u.name, email: u.email }]));

      // Get messages for each ticket
      const ticketsWithMessages = await Promise.all(
        ticketsData.map(async (ticket: any) => {
          const { data: messagesData } = await supabase
            .from('support_messages')
            .select('*')
            .eq('ticket_id', ticket.id)
            .order('created_at', { ascending: true });

          const messages = messagesData?.map((msg: any) => ({
            id: msg.id,
            ticketId: msg.ticket_id,
            senderType: msg.sender_type,
            senderId: msg.sender_id,
            message: msg.message,
            createdAt: msg.created_at,
          })) || [];

          return {
            id: ticket.id,
            userId: ticket.user_id,
            userName: userMap.get(ticket.user_id)?.name || 'Unknown',
            userEmail: userMap.get(ticket.user_id)?.email || '',
            subject: ticket.subject,
            category: ticket.category,
            message: ticket.message,
            status: ticket.status,
            adminResponse: ticket.admin_response, // Keep for backward compatibility
            createdAt: ticket.created_at,
            updatedAt: ticket.updated_at,
            messages,
          };
        })
      );

      return ticketsWithMessages;
    }

    return this.supportTickets.map(ticket => {
      const user = this.users.find(u => u.id === ticket.userId);
      return {
        ...ticket,
        userName: user?.name || 'Unknown',
        userEmail: user?.email || '',
      };
    }).reverse();
  }

  async updateSupportTicketStatus(id: string, status: string, adminResponse?: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Get ticket info first to get userId
    const ticketData = await this.getSupportTicket(id);
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };
    
    // If adminResponse is provided, add it as a message instead of updating admin_response field
    if (adminResponse && adminResponse.trim() !== '') {
      await this.addSupportTicketMessage(id, 'admin', 'ADMIN', adminResponse);
    }

    const { error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating support ticket:', error);
      throw new BadRequestException(`Failed to update ticket: ${error.message}`);
    }

    const ticket = this.supportTickets.find(t => t.id === id);
    if (ticket) {
      ticket.status = status as any;
      ticket.updatedAt = new Date().toISOString();
    }

    // Create notification when status changes
    if (status !== ticketData.status) {
      const statusMessages: Record<string, string> = {
        'In Progress': 'Your support ticket is now being reviewed by our team.',
        'Resolved': 'Your support ticket has been resolved.',
        'Closed': 'Your support ticket has been closed.',
      };

      if (statusMessages[status]) {
        await this.createNotification(
          ticketData.userId,
          'System alerts',
          'Support Ticket Status Updated',
          `Your support ticket "${ticketData.subject}" status has been updated to: ${status}. ${statusMessages[status]}`,
          `/user/settings?tab=help&ticket=${id}`
        );
      }
    }

    return await this.getSupportTicket(id);
  }

  async getAdminOverview() {
    const supabase = this.supabaseService.getAdminClient();
    
    // Active Users (approved users) - from Supabase
    const { data: usersData } = await supabase
      .from('users')
      .select('status, created_at');
    
    const activeUsers = usersData?.filter(u => u.status === 'approved').length || this.users.filter(u => u.status === 'approved').length;
    const totalUsers = usersData?.length || this.users.length;
    const activeUsersMoM = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : '0';

    // Pending KYCs - from Supabase
    const { data: kycsData } = await supabase
      .from('kycs')
      .select('status');
    
    const pendingKycs = kycsData?.filter(k => k.status === 'pending').length || this.kycs.filter(k => k.status === 'pending').length;
    const yesterdayKycs = Math.max(0, pendingKycs - Math.floor(Math.random() * 5));
    const kycChange = yesterdayKycs > 0 ? (((pendingKycs - yesterdayKycs) / yesterdayKycs) * 100).toFixed(1) : '0';

    // Payouts Today (withdrawals approved today) - from Supabase
    const today = new Date().toISOString().split('T')[0];
    const { data: payoutsData } = await supabase
      .from('wallet_txns')
      .select('amount')
      .eq('type', 'withdrawal')
      .eq('status', 'approved')
      .gte('timestamp', today);
    
    const payoutsToday = payoutsData || this.walletHistory.filter(txn => 
      txn.type === 'withdrawal' && 
      txn.status === 'approved' &&
      txn.timestamp.startsWith(today)
    );
    const totalPayoutsAmount = payoutsToday.reduce((sum: number, txn: any) => sum + (Number(txn.amount) || 0), 0);
    const payoutsCount = payoutsToday.length;
    const yesterdayPayouts = Math.max(0, payoutsCount - Math.floor(Math.random() * 3));
    const payoutsChange = yesterdayPayouts > 0 ? (((payoutsCount - yesterdayPayouts) / yesterdayPayouts) * 100).toFixed(1) : '0';

    // IPO Applications - from Supabase
    const { data: ipoAppsData } = await supabase
      .from('ipo_applications')
      .select('id');
    
    const totalIpoApplications = ipoAppsData?.length || this.ipoApplications.length;
    const lastMonthApplications = Math.max(0, totalIpoApplications - Math.floor(Math.random() * 100));
    const ipoChange = lastMonthApplications > 0 ? (((totalIpoApplications - lastMonthApplications) / lastMonthApplications) * 100).toFixed(1) : '0';
    
    const { data: latestIpoData } = await supabase
      .from('ipos')
      .select('company_name')
      .eq('status', 'Live')
      .limit(1)
      .single();
    
    const latestIpoName = latestIpoData?.company_name || this.ipos.find(i => i.status === 'Live')?.companyName || 'N/A';

    // Risk Alerts (mock data - in real app, calculate from positions/orders)
    const riskAlerts = [
      { account: 'ACC1921', detail: 'F&O exposure > limit', severity: 'High' },
      { account: 'ACC1744', detail: 'Payout delay > 24h', severity: 'Medium' },
      { account: 'ACC1611', detail: 'Dormant account reactivated', severity: 'Low' },
    ];

    // IPO Pipeline - from Supabase
    const { data: iposData } = await supabase
      .from('ipos')
      .select('*')
      .eq('is_active', true);
    
    const ipos = iposData || this.ipos;
    const upcomingIpos = ipos.filter((i: any) => i.status === 'Upcoming').slice(0, 3);
    const liveIpos = ipos.filter((i: any) => i.status === 'Live').slice(0, 3);
    const closedIpos = ipos.filter((i: any) => i.status === 'Closed').slice(0, 3);
    const ipoPipeline = [
      ...upcomingIpos.map((i: any) => ({ 
        id: i.id,
        companyName: i.company_name || i.companyName,
        openDate: i.open_date || i.openDate,
        closeDate: i.close_date || i.closeDate,
        status: 'upcoming' as const 
      })),
      ...liveIpos.map((i: any) => ({ 
        id: i.id,
        companyName: i.company_name || i.companyName,
        openDate: i.open_date || i.openDate,
        closeDate: i.close_date || i.closeDate,
        status: 'open' as const 
      })),
      ...closedIpos.map((i: any) => ({ 
        id: i.id,
        companyName: i.company_name || i.companyName,
        openDate: i.open_date || i.openDate,
        closeDate: i.close_date || i.closeDate,
        status: 'closed' as const 
      })),
    ].slice(0, 3);

    // Recent Wallet Operations (last 10 transactions) - from Supabase
    const { data: recentTxnsData } = await supabase
      .from('wallet_txns')
      .select('id, type, amount, status, timestamp, user_id, user_name')
      .order('timestamp', { ascending: false })
      .limit(10);
    
    let recentTransactions: any[] = [];
    if (recentTxnsData) {
      recentTransactions = recentTxnsData.map((row: any) => ({
        id: row.id,
        type: row.type,
        amount: Number(row.amount) || 0,
        status: row.status,
        timestamp: row.timestamp,
        userName: row.user_name || 'Unknown',
      }));
    } else {
      recentTransactions = this.walletHistory
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
        .map(txn => {
          const user = this.users.find(u => u.id === txn.userId);
          return {
            id: txn.id,
            type: txn.type,
            amount: txn.amount,
            status: txn.status,
            timestamp: txn.timestamp,
            userName: user?.name || 'Unknown',
          };
        });
    }

    // Analytics: Calculate daily inflows for last 7 days - from Supabase (optimized)
    const dailyInflows: number[] = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Fetch all deposits at once instead of 7 separate queries
    const sevenDaysAgoDeposits = new Date();
    sevenDaysAgoDeposits.setDate(sevenDaysAgoDeposits.getDate() - 6);
    const depositsDateStr = sevenDaysAgoDeposits.toISOString().split('T')[0];
    
    const { data: allDepositsData } = await supabase
      .from('wallet_txns')
      .select('amount, timestamp')
      .eq('type', 'deposit')
      .eq('status', 'approved')
      .gte('timestamp', depositsDateStr);
    
    const allDeposits = allDepositsData || this.walletHistory.filter(txn =>
      txn.type === 'deposit' &&
      txn.status === 'approved' &&
      txn.timestamp >= depositsDateStr
    );
    
    // Group by day
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStr = date.toISOString().split('T')[0];
      const nextDayStr = new Date(date.getTime() + 86400000).toISOString().split('T')[0];
      
      const dayDeposits = allDeposits.filter((txn: any) => {
        const txnDate = txn.timestamp?.split('T')[0] || txn.timestamp;
        return txnDate >= dayStr && txnDate < nextDayStr;
      });
      
      const dayTotal = dayDeposits.reduce((sum: number, txn: any) => sum + (Number(txn.amount) || 0), 0);
      dailyInflows.push(dayTotal / 10000000); // Convert to Cr
    }

    // Analytics: Revenue Split (calculate from transactions) - from Supabase
    const { data: allTxnsData } = await supabase
      .from('wallet_txns')
      .select('fee')
      .eq('status', 'approved');
    
    const allTxns = allTxnsData || this.walletHistory.filter(txn => txn.status === 'approved');
    const totalRevenue = allTxns.reduce((sum: number, txn: any) => sum + (Number(txn.fee) || 0), 0);
    
    // Simulate revenue split based on transaction types
    const brokerageRevenue = totalRevenue * 0.42;
    const interestRevenue = totalRevenue * 0.34;
    const ipoRevenue = totalRevenue * 0.18;
    const addonsRevenue = totalRevenue * 0.06;

    const revenueSplit = [
      { label: 'Brokerage', value: totalRevenue > 0 ? Math.round((brokerageRevenue / totalRevenue) * 100) : 42 },
      { label: 'Interest', value: totalRevenue > 0 ? Math.round((interestRevenue / totalRevenue) * 100) : 34 },
      { label: 'IPO/AMC', value: totalRevenue > 0 ? Math.round((ipoRevenue / totalRevenue) * 100) : 18 },
      { label: 'Add-ons', value: totalRevenue > 0 ? Math.round((addonsRevenue / totalRevenue) * 100) : 6 },
    ];

    // Analytics: User Growth (last 7 days) - from Supabase (optimized)
    const userGrowth: number[] = [];
    const sevenDaysAgoUsers = new Date();
    sevenDaysAgoUsers.setDate(sevenDaysAgoUsers.getDate() - 6);
    const userDateStr = sevenDaysAgoUsers.toISOString().split('T')[0];
    
    // Fetch all users from last 7 days at once
    const { data: recentUsersData } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', userDateStr);
    
    const recentUsers = recentUsersData || this.users.filter(u => u.createdAt && u.createdAt >= userDateStr);
    
    // Group by day
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStr = date.toISOString().split('T')[0];
      const nextDayStr = new Date(date.getTime() + 86400000).toISOString().split('T')[0];
      
      const dayUsers = recentUsers.filter((u: any) => {
        const userDate = u.created_at?.split('T')[0] || u.createdAt?.split('T')[0];
        return userDate >= dayStr && userDate < nextDayStr;
      });
      
      userGrowth.push(dayUsers.length);
    }

    // Analytics: Transaction Volume (last 7 days) - from Supabase (optimized)
    const transactionVolume: number[] = [];
    const sevenDaysAgoTxns = new Date();
    sevenDaysAgoTxns.setDate(sevenDaysAgoTxns.getDate() - 6);
    const txnDateStr = sevenDaysAgoTxns.toISOString().split('T')[0];
    
    // Fetch all transactions from last 7 days at once
    const { data: volumeTxnsData } = await supabase
      .from('wallet_txns')
      .select('timestamp')
      .gte('timestamp', txnDateStr);
    
    const volumeTxns = volumeTxnsData || this.walletHistory.filter(txn => txn.timestamp >= txnDateStr);
    
    // Group by day
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStr = date.toISOString().split('T')[0];
      const nextDayStr = new Date(date.getTime() + 86400000).toISOString().split('T')[0];
      
      const dayTxns = volumeTxns.filter((txn: any) => {
        const txnDate = txn.timestamp?.split('T')[0] || txn.timestamp;
        return txnDate >= dayStr && txnDate < nextDayStr;
      });
      
      transactionVolume.push(dayTxns.length);
    }

    return {
      stats: {
        activeUsers: {
          count: activeUsers,
          change: parseFloat(activeUsersMoM),
          helper: 'MoM',
        },
        pendingKycs: {
          count: pendingKycs,
          change: parseFloat(kycChange),
          helper: 'vs yesterday',
        },
        payoutsToday: {
          amount: totalPayoutsAmount,
          count: payoutsCount,
          change: parseFloat(payoutsChange),
          helper: `${payoutsCount} requests`,
        },
        ipoApplications: {
          count: totalIpoApplications,
          change: parseFloat(ipoChange),
          helper: latestIpoName,
        },
      },
      riskAlerts,
      ipoPipeline,
      recentTransactions,
      analytics: {
        dailyInflows: dailyInflows.map((value, index) => ({
          name: days[index],
          value: Math.max(0.1, value), // Ensure minimum value for chart
        })),
        revenueSplit,
        userGrowth: userGrowth.map((value, index) => ({
          name: days[index],
          value,
        })),
        transactionVolume: transactionVolume.map((value, index) => ({
          name: days[index],
          value,
        })),
      },
    };
  }

  // Helper method to create notifications
  private async createNotification(
    userId: string,
    category: 'IPO Alerts' | 'Deposit & Withdrawal updates' | 'Approval notifications' | 'System alerts',
    title: string,
    message: string,
    link?: string
  ) {
    const supabase = this.supabaseService.getAdminClient();
    const notificationId = this.generateId('NOTIF');
    
    const { error } = await supabase.from('notifications').insert({
      id: notificationId,
      user_id: userId,
      category,
      title,
      message,
      link,
      read: false,
      timestamp: new Date().toISOString(),
    });

    if (error) {
      console.error('Error creating notification:', error);
      // Don't throw - notifications are non-critical
    }
  }

  private async createAdminNotification(
    title: string,
    message: string,
    link?: string
  ) {
    const supabase = this.supabaseService.getAdminClient();
    const notificationId = this.generateId('ADMIN_NOTIF');
    
    // Store admin notifications with a special user_id 'ADMIN' or use admin_notifications table
    // For simplicity, we'll use 'ADMIN' as user_id for admin notifications
    const { error } = await supabase.from('notifications').insert({
      id: notificationId,
      user_id: 'ADMIN', // Special ID for admin notifications
      category: 'System alerts',
      title,
      message,
      link,
      read: false,
      timestamp: new Date().toISOString(),
    });

    if (error) {
      console.error('Error creating admin notification:', error);
      // Don't throw - notifications are non-critical
    }
  }

  async getAdminNotifications() {
    const supabase = this.supabaseService.getAdminClient();
    
    const { data: notificationsData, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', 'ADMIN')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (notificationsData && !error) {
      return notificationsData.map((row: any) => ({
        id: row.id,
        category: row.category,
        title: row.title,
        message: row.message,
        timestamp: row.timestamp,
        read: row.read,
        link: row.link,
      }));
    }

    return [];
  }

  async getUserNotifications(userId: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Get full user data from Supabase
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    // Fallback to in-memory if not in Supabase
    const user = userData 
      ? {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          status: userData.status,
          kycStatus: userData.kyc_status,
          balance: Number(userData.balance) || 0,
          createdAt: userData.created_at,
        } as User
      : this.users.find(u => u.id === userId);
    
    if (!user) {
      // Return empty array if user not found instead of throwing error
      return [];
    }

    const notifications: Array<{
      id: string;
      category: 'IPO Alerts' | 'Deposit & Withdrawal updates' | 'Approval notifications' | 'System alerts';
      title: string;
      message: string;
      timestamp: string;
      read: boolean;
      link?: string;
    }> = [];

    // IPO Alerts - from Supabase
    const { data: ipoAppsData } = await supabase
      .from('ipo_applications')
      .select('*, ipos!inner(company_name)')
      .eq('user_id', userId)
      .order('applied_at', { ascending: false });

    const userIpoApplications = ipoAppsData || this.ipoApplications.filter(app => app.userId === userId);
    userIpoApplications.forEach((app: any) => {
      const ipoId = app.ipo_id || app.ipoId;
      const ipo = this.ipos.find(i => i.id === ipoId) || { companyName: app.ipos?.company_name || 'Unknown' };
      const status = app.status;
      const lots = app.lots;
      const amount = Number(app.amount) || 0;
      const appliedAt = app.applied_at || app.appliedAt;

      if (status === 'Pending Allotment') {
        notifications.push({
          id: `IPO-${app.id}`,
          category: 'IPO Alerts',
          title: `${ipo.companyName} - Application Submitted`,
          message: `Your application for ${lots} lots (₹${amount.toLocaleString('en-IN')}) is pending allotment.`,
          timestamp: appliedAt,
          read: false,
          link: `/user/ipo/${ipoId}`,
        });
      } else if (status === 'Allotted') {
        notifications.push({
          id: `IPO-ALLOT-${app.id}`,
          category: 'IPO Alerts',
          title: `${ipo.companyName} - Allotted`,
          message: `Congratulations! Your application for ${lots} lots has been allotted.`,
          timestamp: appliedAt,
          read: false,
          link: `/user/ipo/${ipoId}`,
        });
      } else if (status === 'Not Allotted') {
        notifications.push({
          id: `IPO-REJECT-${app.id}`,
          category: 'IPO Alerts',
          title: `${ipo.companyName} - Not Allotted`,
          message: `Your application for ${lots} lots was not allotted. Funds have been unblocked.`,
          timestamp: appliedAt,
          read: false,
          link: `/user/ipo/${ipoId}`,
        });
      }
    });

    // Deposit & Withdrawal updates - from Supabase
    const { data: txnsData } = await supabase
      .from('wallet_txns')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(10);

    const userTransactions = txnsData || this.walletHistory
      .filter(txn => txn.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    userTransactions.forEach((txn: any) => {
      const txnType = txn.type;
      const txnStatus = txn.status;
      const txnAmount = Number(txn.amount) || 0;
      const txnTimestamp = txn.timestamp;
      const txnId = txn.id;
      const rejectionReason = txn.rejection_reason || txn.rejectionReason;

      if (txnType === 'deposit') {
        if (txnStatus === 'approved') {
          notifications.push({
            id: `DEP-${txnId}`,
            category: 'Deposit & Withdrawal updates',
            title: 'Deposit Approved',
            message: `Your deposit of ₹${txnAmount.toLocaleString('en-IN')} has been approved and credited to your account.`,
            timestamp: txnTimestamp,
            read: false,
            link: '/user/wallet',
          });
        } else if (txnStatus === 'rejected') {
          notifications.push({
            id: `DEP-REJ-${txnId}`,
            category: 'Deposit & Withdrawal updates',
            title: 'Deposit Rejected',
            message: `Your deposit of ₹${txnAmount.toLocaleString('en-IN')} has been rejected. Please contact support.`,
            timestamp: txnTimestamp,
            read: false,
            link: '/user/wallet',
          });
        } else if (txnStatus === 'pending') {
          notifications.push({
            id: `DEP-PEND-${txnId}`,
            category: 'Deposit & Withdrawal updates',
            title: 'Deposit Pending',
            message: `Your deposit of ₹${txnAmount.toLocaleString('en-IN')} is pending admin approval.`,
            timestamp: txnTimestamp,
            read: false,
            link: '/user/wallet',
          });
        }
      } else if (txnType === 'withdrawal') {
        if (txnStatus === 'approved') {
          notifications.push({
            id: `WD-${txnId}`,
            category: 'Deposit & Withdrawal updates',
            title: 'Withdrawal Approved',
            message: `Your withdrawal of ₹${txnAmount.toLocaleString('en-IN')} has been approved and processed.`,
            timestamp: txnTimestamp,
            read: false,
            link: '/user/wallet',
          });
        } else if (txnStatus === 'rejected') {
          notifications.push({
            id: `WD-REJ-${txnId}`,
            category: 'Deposit & Withdrawal updates',
            title: 'Withdrawal Rejected',
            message: `Your withdrawal of ₹${txnAmount.toLocaleString('en-IN')} has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
            timestamp: txnTimestamp,
            read: false,
            link: '/user/wallet',
          });
        } else if (txnStatus === 'pending') {
          notifications.push({
            id: `WD-PEND-${txnId}`,
            category: 'Deposit & Withdrawal updates',
            title: 'Withdrawal Pending',
            message: `Your withdrawal of ₹${txnAmount.toLocaleString('en-IN')} is pending admin approval.`,
            timestamp: txnTimestamp,
            read: false,
            link: '/user/wallet',
          });
        }
      }
    });

    // Get full user data for approval notifications
    const { data: fullUserData } = await supabase
      .from('users')
      .select('status, kyc_status, created_at')
      .eq('id', userId)
      .single();

    const userStatus = fullUserData?.status || user.status;
    const userKycStatus = fullUserData?.kyc_status || user.kycStatus;
    const userCreatedAt = fullUserData?.created_at || user.createdAt;

    // Approval notifications
    if (userStatus === 'approved') {
      notifications.push({
        id: `APPROVE-${userId}`,
        category: 'Approval notifications',
        title: 'Account Approved',
        message: 'Your account has been approved. You can now access all features.',
        timestamp: userCreatedAt,
        read: false,
        link: '/user/dashboard',
      });
    } else if (userStatus === 'rejected') {
      notifications.push({
        id: `REJECT-${userId}`,
        category: 'Approval notifications',
        title: 'Account Rejected',
        message: 'Your account registration has been rejected. Please contact support.',
        timestamp: userCreatedAt,
        read: false,
        link: '/user/settings',
      });
    }

    if (userKycStatus === 'approved') {
      notifications.push({
        id: `KYC-${userId}`,
        category: 'Approval notifications',
        title: 'KYC Verified',
        message: 'Your KYC documents have been verified. Full access unlocked.',
        timestamp: userCreatedAt,
        read: false,
        link: '/user/settings',
      });
    } else if (userKycStatus === 'rejected') {
      notifications.push({
        id: `KYC-REJ-${userId}`,
        category: 'Approval notifications',
        title: 'KYC Rejected',
        message: 'Your KYC documents have been rejected. Please resubmit.',
        timestamp: userCreatedAt,
        read: false,
        link: '/user/settings',
      });
    }

    // System alerts
    notifications.push({
      id: `SYS-${userId}-1`,
      category: 'System alerts',
      title: 'Welcome to StockMart',
      message: 'Thank you for joining! Start trading and investing today.',
      timestamp: userCreatedAt,
      read: false,
      link: '/user/dashboard',
    });

    // Fetch notifications from database
    const { data: dbNotifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (dbNotifications) {
      dbNotifications.forEach((notif: any) => {
        notifications.push({
          id: notif.id,
          category: notif.category as 'IPO Alerts' | 'Deposit & Withdrawal updates' | 'Approval notifications' | 'System alerts',
          title: notif.title,
          message: notif.message,
          timestamp: notif.timestamp,
          read: notif.read || false,
          link: notif.link,
        });
      });
    }

    // Sort by timestamp (newest first)
    return notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async markNotificationAsRead(userId: string, notificationId: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Update notification in database
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw new BadRequestException('Failed to mark notification as read');
    }

    return { success: true };
  }

  async markAllNotificationsAsRead(userId: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Update all notifications for user
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw new BadRequestException('Failed to mark all notifications as read');
    }

    return { success: true };
  }

  // ============================================
  // TIMER-BASED TRADING SYSTEM
  // ============================================

  async getTimerSettings() {
    const supabase = this.supabaseService.getAdminClient();
    
    const { data: timersData, error } = await supabase
      .from('timer_settings')
      .select('*')
      .order('timer_duration', { ascending: true });
    
    if (timersData && !error) {
      return timersData.map((row: any) => ({
        id: row.id,
        duration: row.timer_duration,
        label: row.timer_label,
        isEnabled: row.is_enabled,
      }));
    }
    
    // Initialize default timers if none exist
    const defaultTimers = [
      { duration: 1, label: '1min', isEnabled: true },
      { duration: 5, label: '5min', isEnabled: true },
      { duration: 10, label: '10min', isEnabled: true },
      { duration: 15, label: '15min', isEnabled: true },
      { duration: 60, label: '1hour', isEnabled: true },
    ];
    
    for (const timer of defaultTimers) {
      await supabase.from('timer_settings').upsert({
        id: `TIMER${timer.duration}`,
        timer_duration: timer.duration,
        timer_label: timer.label,
        is_enabled: timer.isEnabled,
      }, { onConflict: 'timer_duration' });
    }
    
    return defaultTimers.map(t => ({
      id: `TIMER${t.duration}`,
      duration: t.duration,
      label: t.label,
      isEnabled: t.isEnabled,
    }));
  }

  async updateTimerSettings(timerId: string, isEnabled: boolean) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { error } = await supabase
      .from('timer_settings')
      .update({ is_enabled: isEnabled })
      .eq('id', timerId);
    
    if (error) {
      console.error('Error updating timer settings:', error);
      throw new BadRequestException('Failed to update timer settings');
    }
    
    return { success: true };
  }

  async addTimerSettings(duration: number, label: string, isEnabled: boolean = true) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Check if timer with this duration already exists
    const { data: existing } = await supabase
      .from('timer_settings')
      .select('*')
      .eq('timer_duration', duration)
      .single();
    
    if (existing) {
      throw new BadRequestException(`Timer with duration ${duration} minutes already exists`);
    }
    
    const timerId = this.generateId('TIMER');
    const { error } = await supabase.from('timer_settings').insert({
      id: timerId,
      timer_duration: duration,
      timer_label: label,
      is_enabled: isEnabled,
    });
    
    if (error) {
      console.error('Error adding timer settings:', error);
      throw new BadRequestException('Failed to add timer settings');
    }
    
    return {
      id: timerId,
      duration,
      label,
      isEnabled,
    };
  }

  async deleteTimerSettings(timerId: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Check if timer is being used in any active trades
    const { data: activeTrades } = await supabase
      .from('timed_trades')
      .select('id')
      .eq('status', 'pending')
      .limit(1);
    
    // Get timer duration to check
    const { data: timerData } = await supabase
      .from('timer_settings')
      .select('timer_duration')
      .eq('id', timerId)
      .single();
    
    if (timerData) {
      const { data: tradesWithTimer } = await supabase
        .from('timed_trades')
        .select('id')
        .eq('timer_duration', timerData.timer_duration)
        .eq('status', 'pending')
        .limit(1);
      
      if (tradesWithTimer && tradesWithTimer.length > 0) {
        throw new BadRequestException('Cannot delete timer with active pending trades');
      }
    }
    
    const { error } = await supabase
      .from('timer_settings')
      .delete()
      .eq('id', timerId);
    
    if (error) {
      console.error('Error deleting timer settings:', error);
      throw new BadRequestException('Failed to delete timer settings');
    }
    
    return { success: true };
  }

  async getTradingSettings() {
    const supabase = this.supabaseService.getAdminClient();
    
    const { data: settingsData } = await supabase
      .from('trading_settings')
      .select('*')
      .eq('id', 'SETTINGS001')
      .single();
    
    if (settingsData) {
      return {
        defaultProfitRate: Number(settingsData.default_profit_rate) || 80,
        currencyCode: settingsData.currency_code || 'INR',
        currencySymbol: settingsData.currency_symbol || '₹',
        locale: settingsData.locale || 'en-IN',
      };
    }
    
    // Initialize default settings
    await supabase.from('trading_settings').insert({
      id: 'SETTINGS001',
      default_profit_rate: 80.00,
      currency_code: 'INR',
      currency_symbol: '₹',
      locale: 'en-IN',
    });
    
    return { 
      defaultProfitRate: 80,
      currencyCode: 'INR',
      currencySymbol: '₹',
      locale: 'en-IN',
    };
  }

  async getCurrencySettings() {
    const supabase = this.supabaseService.getAdminClient();
    
    const { data: settingsData } = await supabase
      .from('trading_settings')
      .select('currency_code, currency_symbol, locale')
      .eq('id', 'SETTINGS001')
      .single();
    
    if (settingsData) {
      return {
        currencyCode: settingsData.currency_code || 'INR',
        currencySymbol: settingsData.currency_symbol || '₹',
        locale: settingsData.locale || 'en-IN',
      };
    }
    
    // Return defaults if not found
    return {
      currencyCode: 'INR',
      currencySymbol: '₹',
      locale: 'en-IN',
    };
  }

  async updateTradingSettings(profitRate?: number, currencyCode?: string, currencySymbol?: string, locale?: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    // First, check if settings exist
    const { data: existingSettings } = await supabase
      .from('trading_settings')
      .select('*')
      .eq('id', 'SETTINGS001')
      .single();
    
    // Build update data, only including fields that are provided
    const updateData: any = {};
    if (profitRate !== undefined) {
      updateData.default_profit_rate = profitRate;
    }
    if (currencyCode !== undefined) {
      updateData.currency_code = currencyCode;
    }
    if (currencySymbol !== undefined) {
      updateData.currency_symbol = currencySymbol;
    }
    if (locale !== undefined) {
      updateData.locale = locale;
    }
    
    let error;
    if (existingSettings) {
      // Update existing settings
      const { error: updateError } = await supabase
        .from('trading_settings')
        .update(updateData)
        .eq('id', 'SETTINGS001');
      error = updateError;
    } else {
      // Insert new settings if they don't exist
      const insertData: any = {
        id: 'SETTINGS001',
        default_profit_rate: profitRate ?? 80,
        currency_code: currencyCode ?? 'INR',
        currency_symbol: currencySymbol ?? '₹',
        locale: locale ?? 'en-IN',
      };
      
      const { error: insertError } = await supabase
        .from('trading_settings')
        .insert(insertData);
      error = insertError;
    }
    
    if (error) {
      console.error('Error updating trading settings:', error);
      const errorMsg = error.message || 'Unknown error';
      if (errorMsg.includes('column') && errorMsg.includes('currency')) {
        throw new BadRequestException(
          `Currency columns not found in trading_settings table. ` +
          `Please run the migration script (backend/add-currency-columns.sql) in your Supabase SQL Editor to add the missing columns.`
        );
      }
      throw new BadRequestException(`Failed to update trading settings: ${errorMsg}`);
    }
    
    // Return updated settings
    const { data: updatedSettings } = await supabase
      .from('trading_settings')
      .select('*')
      .eq('id', 'SETTINGS001')
      .single();
    
    return {
      success: true,
      defaultProfitRate: updatedSettings ? Number(updatedSettings.default_profit_rate) : profitRate || 80,
      currencyCode: updatedSettings?.currency_code || currencyCode || 'INR',
      currencySymbol: updatedSettings?.currency_symbol || currencySymbol || '₹',
      locale: updatedSettings?.locale || locale || 'en-IN',
    };
  }

  async createTimedTrade(userId: string, amount: number, timerDuration: number) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Get user
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!userData) {
      throw new BadRequestException('User not found');
    }
    
    const userBalance = Number(userData.balance) || 0;
    if (userBalance < amount) {
      throw new BadRequestException('Insufficient balance');
    }
    
    // Get timer settings
    const { data: timerData } = await supabase
      .from('timer_settings')
      .select('*')
      .eq('timer_duration', timerDuration)
      .eq('is_enabled', true)
      .single();
    
    if (!timerData) {
      throw new BadRequestException('Timer not available or disabled');
    }
    
    // Get trading settings
    const { data: tradingSettings } = await supabase
      .from('trading_settings')
      .select('*')
      .eq('id', 'SETTINGS001')
      .single();
    
    const profitRate = tradingSettings ? Number(tradingSettings.default_profit_rate) : 80;
    
    // Deduct amount from user balance
    const newBalance = userBalance - amount;
    await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId);
    
    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + timerDuration);
    
    // Create timed trade
    const tradeId = this.generateId('TRADE');
    const tradeData: any = {
      id: tradeId,
      user_id: userId,
      user_name: userData.name,
      user_email: userData.email,
      amount: amount,
      timer_duration: timerDuration,
      timer_label: timerData.timer_label,
      profit_rate: profitRate,
      status: 'pending',
      profit_amount: 0,
      expires_at: expiresAt.toISOString(),
    };
    
    const { error: tradeError } = await supabase.from('timed_trades').insert(tradeData);
    
    if (tradeError) {
      console.error('Error creating timed trade:', tradeError);
      // Rollback balance
      await supabase
        .from('users')
        .update({ balance: userBalance })
        .eq('id', userId);
      throw new BadRequestException(`Failed to create trade: ${tradeError.message || 'Unknown error'}`);
    }
    
    return {
      id: tradeId,
      userId,
      amount,
      timerDuration,
      timerLabel: timerData.timer_label,
      profitRate,
      status: 'pending',
      expiresAt: expiresAt.toISOString(),
    };
  }

  async getUserTimedTrades(userId: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    const { data: tradesData } = await supabase
      .from('timed_trades')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (tradesData) {
      // Check for expired pending trades and auto-set random result
      const now = new Date();
      for (const row of tradesData) {
        if (row.status === 'pending' && row.expires_at) {
          const expiresAt = new Date(row.expires_at);
          if (expiresAt < now) {
            // Timer expired and admin hasn't set result - auto-set random result
            const randomResults: ('win' | 'lose' | 'draw')[] = ['win', 'lose', 'draw'];
            const randomResult = randomResults[Math.floor(Math.random() * randomResults.length)];
            
            try {
              await this.setTradeResult(row.id, randomResult, 'SYSTEM');
            } catch (error) {
              console.error(`Failed to auto-set result for trade ${row.id}:`, error);
            }
          }
        }
      }
      
      // Reload trades after auto-setting results
      const { data: updatedTradesData } = await supabase
        .from('timed_trades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (updatedTradesData) {
        return updatedTradesData.map((row: any) => ({
          id: row.id,
          symbol: row.symbol || 'N/A',
          side: row.side || 'BUY',
          amount: Number(row.amount) || 0,
          timerDuration: row.timer_duration,
          timerLabel: row.timer_label,
          profitRate: Number(row.profit_rate) || 0,
          status: row.status,
          profitAmount: Number(row.profit_amount) || 0,
          expiresAt: row.expires_at,
          createdAt: row.created_at,
          resultSetAt: row.result_set_at,
        }));
      }
    }
    
    return [];
  }

  async getAllTimedTrades(status?: 'pending' | 'win' | 'lose' | 'draw') {
    const supabase = this.supabaseService.getAdminClient();
    
    let query = supabase
      .from('timed_trades')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: tradesData } = await query;
    
    if (tradesData) {
      return tradesData.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        amount: Number(row.amount) || 0,
        timerDuration: row.timer_duration,
        timerLabel: row.timer_label,
        profitRate: Number(row.profit_rate) || 0,
        status: row.status,
        profitAmount: Number(row.profit_amount) || 0,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        resultSetBy: row.result_set_by,
        resultSetAt: row.result_set_at,
      }));
    }
    
    return [];
  }

  async setTradeResult(tradeId: string, result: 'win' | 'lose' | 'draw', adminUserId?: string) {
    const supabase = this.supabaseService.getAdminClient();
    
    // Get trade
    const { data: tradeData } = await supabase
      .from('timed_trades')
      .select('*')
      .eq('id', tradeId)
      .single();
    
    if (!tradeData) {
      throw new BadRequestException('Trade not found');
    }
    
    if (tradeData.status !== 'pending') {
      throw new BadRequestException('Trade result already set');
    }
    
    // Get user
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', tradeData.user_id)
      .single();
    
    if (!userData) {
      throw new BadRequestException('User not found');
    }
    
    const amount = Number(tradeData.amount) || 0;
    const profitRate = Number(tradeData.profit_rate) || 80;
    let newBalance = Number(userData.balance) || 0;
    let profitAmount = 0;
    
    if (result === 'win') {
      // User wins: amount × profit_rate
      profitAmount = amount * (profitRate / 100);
      newBalance = newBalance + amount + profitAmount; // Return amount + profit
    } else if (result === 'lose') {
      // User loses: amount is already deducted, nothing to return
      profitAmount = 0;
      // Balance already deducted when trade was created
    } else if (result === 'draw') {
      // Draw: return full amount
      profitAmount = 0;
      newBalance = newBalance + amount; // Return the amount
    }
    
    // Update user balance
    await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', tradeData.user_id);
    
    // Update trade status
    await supabase
      .from('timed_trades')
      .update({
        status: result,
        profit_amount: profitAmount,
        result_set_by: adminUserId || 'ADMIN',
        result_set_at: new Date().toISOString(),
      })
      .eq('id', tradeId);
    
    // Create wallet transaction record
    const txnId = this.generateId('TXN');
    await supabase.from('wallet_txns').insert({
      id: txnId,
      user_id: tradeData.user_id,
      user_name: tradeData.user_name,
      user_email: tradeData.user_email,
      type: result === 'win' ? 'deposit' : 'withdrawal',
      amount: result === 'win' ? (amount + profitAmount) : (result === 'draw' ? amount : 0),
      channel: 'Timed Trade',
      status: 'completed',
      timestamp: new Date().toISOString(),
    });
    
    return {
      success: true,
      tradeId,
      result,
      profitAmount,
      newBalance,
    };
  }
}

