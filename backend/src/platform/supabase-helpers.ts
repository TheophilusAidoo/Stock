/**
 * Helper functions for Supabase operations
 * Maps between TypeScript types and Supabase column names
 */

export function mapUserFromDb(row: any): any {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
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
    segment: row.segment || [],
    kycStatus: row.kyc_status,
    status: row.status,
    balance: Number(row.balance) || 0,
    createdAt: row.created_at,
  };
}

export function mapUserToDb(user: any): any {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    mobile: user.mobile,
    date_of_birth: user.dateOfBirth,
    gender: user.gender,
    address: user.address,
    pan: user.pan,
    aadhaar: user.aadhaar,
    profile_photo: user.profilePhoto,
    email_verified: user.emailVerified,
    mobile_verified: user.mobileVerified,
    two_factor_enabled: user.twoFactorEnabled,
    default_deposit_method: user.defaultDepositMethod,
    default_withdrawal_method: user.defaultWithdrawalMethod,
    notification_preferences: user.notificationPreferences || {},
    segment: user.segment || [],
    kyc_status: user.kycStatus,
    status: user.status,
    balance: user.balance || 0,
    created_at: user.createdAt,
  };
}

export function mapWalletTxnFromDb(row: any): any {
  return {
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
  };
}

export function mapWalletTxnToDb(txn: any): any {
  return {
    id: txn.id,
    user_id: txn.userId,
    user_name: txn.userName,
    user_email: txn.userEmail,
    type: txn.type,
    amount: txn.amount,
    channel: txn.channel,
    gateway_id: txn.gatewayId,
    method_id: txn.methodId,
    withdrawal_account: txn.withdrawalAccount,
    withdrawal_details: txn.withdrawalDetails || {},
    fee: txn.fee || 0,
    final_amount: txn.finalAmount,
    rejection_reason: txn.rejectionReason,
    screenshot_data: txn.screenshotData,
    screenshot_type: txn.screenshotType,
    status: txn.status,
    timestamp: txn.timestamp,
  };
}

export function mapIpoFromDb(row: any): any {
  return {
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
  };
}

export function mapIpoToDb(ipo: any): any {
  return {
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
    is_active: ipo.isActive !== undefined ? ipo.isActive : true,
    ipo_price: ipo.ipoPrice,
    discount_type: ipo.discountType,
    discount_value: ipo.discountValue,
    final_price: ipo.finalPrice,
    show_discount: ipo.showDiscount || false,
    created_at: ipo.createdAt,
  };
}

export function mapIpoApplicationFromDb(row: any): any {
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
  };
}

export function mapIpoApplicationToDb(app: any): any {
  return {
    id: app.id,
    ipo_id: app.ipoId,
    user_id: app.userId,
    user_name: app.userName,
    user_email: app.userEmail,
    lots: app.lots,
    amount: app.amount,
    status: app.status,
    applied_at: app.appliedAt,
    allotted_at: app.allottedAt,
    rejected_at: app.rejectedAt,
  };
}

export function mapKycFromDb(row: any): any {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    documentName: row.document_name,
    documentSize: row.document_size,
    documentData: row.document_data,
    documentType: row.document_type,
    payload: row.payload || {},
    status: row.status,
    submittedAt: row.submitted_at,
  };
}

export function mapKycToDb(kyc: any): any {
  return {
    id: kyc.id,
    user_id: kyc.userId,
    user_name: kyc.userName,
    user_email: kyc.userEmail,
    document_name: kyc.documentName,
    document_size: kyc.documentSize,
    document_data: kyc.documentData,
    document_type: kyc.documentType,
    payload: kyc.payload || {},
    status: kyc.status,
    submitted_at: kyc.submittedAt,
  };
}

export function mapOrderFromDb(row: any): any {
  return {
    id: row.id,
    userId: row.user_id,
    symbol: row.symbol,
    side: row.side,
    quantity: row.quantity,
    price: Number(row.price) || 0,
    status: row.status,
    executedAt: row.executed_at,
  };
}

export function mapOrderToDb(order: any): any {
  return {
    id: order.id,
    user_id: order.userId,
    symbol: order.symbol,
    side: order.side,
    quantity: order.quantity,
    price: order.price,
    status: order.status,
    executed_at: order.executedAt,
  };
}

export function mapPositionFromDb(row: any): any {
  return {
    userId: row.user_id,
    symbol: row.symbol,
    quantity: row.quantity,
    avgPrice: Number(row.avg_price) || 0,
    ltp: Number(row.ltp) || 0,
    invested: Number(row.invested) || 0,
    currentValue: Number(row.current_value) || 0,
    pnl: Number(row.pnl) || 0,
    pnlPercent: Number(row.pnl_percent) || 0,
  };
}

export function mapPositionToDb(position: any): any {
  return {
    user_id: position.userId,
    symbol: position.symbol,
    quantity: position.quantity,
    avg_price: position.avgPrice,
    ltp: position.ltp,
    invested: position.invested,
    current_value: position.currentValue,
    pnl: position.pnl,
    pnl_percent: position.pnlPercent,
  };
}












