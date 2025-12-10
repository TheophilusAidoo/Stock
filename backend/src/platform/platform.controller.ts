import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PlatformService } from './platform.service';
import { SupabaseService } from './supabase.service';

@Controller()
export class PlatformController {
  constructor(
    private readonly platform: PlatformService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Post('auth/login')
  async login(@Body() body: { email: string; password?: string }) {
    return await this.platform.login(body.email, body.password);
  }

  @Post('auth/register')
  async register(@Body() body: { name?: string; email: string; password?: string; segment?: string[] }) {
    return await this.platform.register(body);
  }

  @Post('users/kyc')
  async submitKyc(@Body() body: Record<string, unknown>) {
    // Handle FormData - extract userId and document metadata
    const userId = body['userId'] as string | undefined;
    const documentName = body['documentName'] as string | undefined;
    const documentSize = body['documentSize'] ? Number(body['documentSize']) : undefined;
    const documentData = body['documentData'] as string | undefined; // Base64 data
    const documentType = body['documentType'] as string | undefined; // MIME type
    
    const payload: Record<string, unknown> = {
      documentName,
      documentSize,
      documentData,
      documentType,
      ...body,
    };
    
    return await this.platform.submitKyc(userId, payload);
  }

  @Post('wallet/deposit')
  async deposit(@Body() body: { amount: number; channel: string; userId?: string; gatewayId?: string; screenshotData?: string; screenshotType?: string }) {
    return await this.platform.deposit(
      body.amount, 
      body.channel, 
      body.userId, 
      body.gatewayId, 
      body.screenshotData, 
      body.screenshotType
    );
  }

  @Post('wallet/withdraw')
  async withdraw(@Body() body: { amount: number; methodId: string; userId?: string; withdrawalAccount?: string; withdrawalDetails?: Record<string, string> }) {
    return await this.platform.withdraw(
      body.amount,
      body.methodId,
      body.userId,
      body.withdrawalAccount,
      body.withdrawalDetails
    );
  }

  @Get('wallet/withdrawal-methods')
  async getWithdrawalMethods() {
    return await this.platform.getWithdrawalMethods();
  }

  @Get('wallet/history')
  async walletHistory(@Query('userId') userId?: string) {
    return await this.platform.walletHistoryFeed(userId);
  }

  @Post('wallet/balance')
  async getBalance(@Body() body: { userId: string }) {
    return { balance: await this.platform.getUserBalance(body.userId) };
  }

  @Get('wallet/payment-gateway')
  async getPaymentGateway(@Query('id') id?: string) {
    if (id) {
      return await this.platform.getPaymentGatewayById(id);
    }
    return await this.platform.getPaymentGateways();
  }

  @Get('market/quotes')
  quotes() {
    return this.platform.marketQuotes();
  }

  @Get('market/depth/:symbol')
  depth(@Param('symbol') symbol: string) {
    return this.platform.marketDepth(symbol);
  }

  @Post('trades')
  async placeOrder(@Body() body: { symbol: string; quantity: number; price: number; side: 'BUY' | 'SELL'; userId?: string; timer?: number }) {
    return await this.platform.placeOrder(body);
  }

  @Get('trades/orders')
  async orders(@Query('userId') userId?: string) {
    return await this.platform.listOrders(userId);
  }

  @Get('trades/positions')
  async positions(@Query('userId') userId?: string) {
    return await this.platform.listPositions(userId);
  }

  @Get('portfolio/summary')
  async portfolioSummary(@Query('userId') userId?: string) {
    return await this.platform.getPortfolioSummary(userId);
  }

  @Get('portfolio/realized-pnl')
  async realizedPnl(@Query('userId') userId?: string) {
    return await this.platform.getRealizedPnl(userId);
  }

  @Get('admin/users')
  async adminUsers() {
    return await this.platform.adminUsers();
  }

  @Post('admin/users/:id/approve')
  async approveUser(@Param('id') id: string) {
    return await this.platform.approveUser(id);
  }

  @Post('admin/users/:id/reject')
  async rejectUser(@Param('id') id: string) {
    return await this.platform.rejectUser(id);
  }

  @Post('admin/users/:id/delete')
  async deleteUser(@Param('id') id: string) {
    return await this.platform.deleteUser(id);
  }

  @Post('admin/users/:id/adjust-balance')
  async adjustUserBalance(@Param('id') id: string, @Body() body: { amount: number; type: 'add' | 'deduct'; reason?: string }) {
    return await this.platform.adjustUserBalance(id, body.amount, body.type, body.reason);
  }

  @Post('admin/kyc/:id/approve')
  async adminApprove(@Param('id') id: string) {
    return await this.platform.approveKyc(id);
  }

  @Post('admin/kyc/:id/reject')
  async adminReject(@Param('id') id: string) {
    return await this.platform.rejectKyc(id);
  }

  @Get('admin/wallets')
  adminWallets() {
    return this.platform.adminWallets();
  }

  @Get('ipos')
  async getIpos(@Query('status') status?: 'Upcoming' | 'Live' | 'Closed') {
    return await this.platform.getIpos(status);
  }

  @Get('ipos/:id/applications')
  async getIpoApplications(@Param('id') id: string) {
    return await this.platform.getIpoApplications(id);
  }

  @Post('ipos/apply')
  async applyForIpo(@Body() body: { ipoId: string; userId: string; lots: number }) {
    return await this.platform.applyForIpo(body.ipoId, body.userId, body.lots);
  }

  @Get('ipos/applications')
  async getUserIpoApplications(@Query('userId') userId: string) {
    return await this.platform.getUserIpoApplications(userId);
  }

  @Get('admin/ipos')
  async adminIpos() {
    return await this.platform.getAllIpos();
  }

  @Post('admin/ipos/add')
  async addIpo(@Body() body: { companyName: string; companyLogo?: string; ipoType: 'Mainline' | 'SME'; priceMin: number; priceMax: number; lotSize: number; minInvestment: number; openDate: string; closeDate: string; description: string; status: 'Upcoming' | 'Live' | 'Closed'; ipoPrice?: number; discountType?: 'Percentage' | 'Fixed'; discountValue?: number; showDiscount?: boolean }) {
    return await this.platform.addIpo(body);
  }

  @Post('admin/ipos/update/:id')
  async updateIpo(@Param('id') id: string, @Body() body: { companyName: string; companyLogo?: string; ipoType: 'Mainline' | 'SME'; priceMin: number; priceMax: number; lotSize: number; minInvestment: number; openDate: string; closeDate: string; description: string; status: 'Upcoming' | 'Live' | 'Closed'; ipoPrice?: number; discountType?: 'Percentage' | 'Fixed'; discountValue?: number; showDiscount?: boolean }) {
    return await this.platform.updateIpo(id, body);
  }

  @Post('admin/ipos/delete/:id')
  async deleteIpo(@Param('id') id: string) {
    return await this.platform.deleteIpo(id);
  }

  @Get('admin/ipos/applications')
  async getAdminIpoApplications(@Query('ipoId') ipoId?: string) {
    return await this.platform.getIpoApplications(ipoId);
  }

  @Post('admin/ipos/applications/:id/approve')
  async approveIpoApplication(@Param('id') id: string) {
    return await this.platform.approveIpoApplication(id);
  }

  @Post('admin/ipos/applications/:id/reject')
  async rejectIpoApplication(@Param('id') id: string) {
    return await this.platform.rejectIpoApplication(id);
  }

  @Get('user/profile')
  async getUserProfile(@Query('userId') userId: string) {
    return await this.platform.getUserProfile(userId);
  }

  @Post('user/profile')
  async updateUserProfile(@Body() body: { userId: string; name?: string; mobile?: string; address?: string; gender?: 'Male' | 'Female' | 'Other'; profilePhoto?: string }) {
    return await this.platform.updateUserProfile(body.userId, body);
  }

  @Post('user/change-password')
  async changePassword(@Body() body: { userId: string; oldPassword: string; newPassword: string }) {
    return await this.platform.changePassword(body.userId, body.oldPassword, body.newPassword);
  }

  @Post('user/two-factor')
  async updateTwoFactor(@Body() body: { userId: string; enabled: boolean }) {
    return await this.platform.updateTwoFactor(body.userId, body.enabled);
  }

  @Post('user/wallet-preferences')
  async updateWalletPreferences(@Body() body: { userId: string; defaultDepositMethod?: string; defaultWithdrawalMethod?: string }) {
    return await this.platform.updateWalletPreferences(body.userId, body.defaultDepositMethod, body.defaultWithdrawalMethod);
  }

  @Post('user/notification-preferences')
  async updateNotificationPreferences(@Body() body: { userId: string; preferences: Record<string, boolean> }) {
    return await this.platform.updateNotificationPreferences(body.userId, body.preferences);
  }

  @Post('user/verify-email')
  verifyEmail(@Body() body: { userId: string }) {
    return this.platform.verifyEmail(body.userId);
  }

  @Post('user/verify-mobile')
  verifyMobile(@Body() body: { userId: string }) {
    return this.platform.verifyMobile(body.userId);
  }

  @Post('user/support-ticket')
  async createSupportTicket(@Body() body: { userId: string; subject: string; category: 'Deposit' | 'Withdrawal' | 'IPO' | 'Trading' | 'KYC' | 'Other'; message: string }) {
    return await this.platform.createSupportTicket(body.userId, body.subject, body.category, body.message);
  }

  @Get('user/support-tickets')
  async getUserSupportTickets(@Query('userId') userId: string) {
    return await this.platform.getUserSupportTickets(userId);
  }

  @Get('user/support-ticket/:id')
  async getSupportTicket(@Param('id') id: string) {
    return await this.platform.getSupportTicket(id);
  }

  @Get('admin/support-tickets')
  async getAllSupportTickets() {
    return await this.platform.getAllSupportTickets();
  }

  @Post('admin/support-tickets/:id/update')
  async updateSupportTicket(@Param('id') id: string, @Body() body: { status: string; adminResponse?: string }) {
    return await this.platform.updateSupportTicketStatus(id, body.status, body.adminResponse);
  }

  @Get('user/support-tickets/:id/messages')
  async getSupportTicketMessages(@Param('id') ticketId: string) {
    return await this.platform.getSupportTicketMessages(ticketId);
  }

  @Post('user/support-tickets/:id/messages')
  async addSupportTicketMessage(@Param('id') ticketId: string, @Body() body: { userId: string; message: string }) {
    return await this.platform.addSupportTicketMessage(ticketId, 'user', body.userId, body.message);
  }

  @Post('admin/support-tickets/:id/messages')
  async addAdminSupportTicketMessage(@Param('id') ticketId: string, @Body() body: { message: string }) {
    return await this.platform.addSupportTicketMessage(ticketId, 'admin', 'ADMIN', body.message);
  }

  @Get('admin/notifications')
  async getAdminNotifications() {
    return await this.platform.getAdminNotifications();
  }

  @Get('admin/analytics')
  adminAnalytics() {
    return this.platform.adminAnalytics();
  }

  @Get('admin/overview')
  async getAdminOverview() {
    return await this.platform.getAdminOverview();
  }

  @Get('user/notifications')
  async getUserNotifications(@Query('userId') userId: string) {
    return await this.platform.getUserNotifications(userId);
  }

  @Post('user/notifications/:id/read')
  async markNotificationAsRead(@Param('id') id: string, @Body() body: { userId: string }) {
    return await this.platform.markNotificationAsRead(body.userId, id);
  }

  @Post('user/notifications/read-all')
  async markAllNotificationsAsRead(@Body() body: { userId: string }) {
    return await this.platform.markAllNotificationsAsRead(body.userId);
  }

  @Get('admin/kycs')
  async adminKycs() {
    return await this.platform.adminKycs();
  }

  @Get('admin/payment-gateway')
  async getAdminPaymentGateways() {
    return await this.platform.getAllPaymentGateways();
  }

  @Post('admin/payment-gateway')
  async addPaymentGateway(@Body() body: { name: string; trc20Address: string; trc20QrCode: string; minDeposit: number; confirmationTime: string; instructions: string }) {
    return await this.platform.addPaymentGateway(
      body.name || 'USDT (TRC20)',
      body.trc20Address || '',
      body.trc20QrCode || '',
      body.minDeposit || 100,
      body.confirmationTime || '15-30 minutes',
      body.instructions || ''
    );
  }

  @Post('admin/payment-gateway/:id')
  async updatePaymentGateway(@Param('id') id: string, @Body() body: { name: string; trc20Address: string; trc20QrCode: string; minDeposit: number; confirmationTime: string; instructions: string }) {
    return await this.platform.updatePaymentGateway(
      id,
      body.name || 'USDT (TRC20)',
      body.trc20Address || '',
      body.trc20QrCode || '',
      body.minDeposit || 100,
      body.confirmationTime || '15-30 minutes',
      body.instructions || ''
    );
  }

  @Post('admin/payment-gateway/:id/delete')
  async deletePaymentGateway(@Param('id') id: string) {
    return await this.platform.deletePaymentGateway(id);
  }

  @Get('admin/deposits')
  async getPendingDeposits(@Query('userId') userId?: string, @Query('all') all?: string) {
    if (all === 'true') {
      return await this.platform.getAllDeposits(userId);
    }
    return await this.platform.getPendingDeposits();
  }

  @Post('admin/deposits/:id/approve')
  async approveDeposit(@Param('id') id: string) {
    return await this.platform.approveDeposit(id);
  }

  @Post('admin/deposits/:id/reject')
  async rejectDeposit(@Param('id') id: string) {
    return await this.platform.rejectDeposit(id);
  }

  @Get('admin/withdrawal-methods')
  async getAdminWithdrawalMethods() {
    return await this.platform.getAllWithdrawalMethods();
  }

  @Post('admin/withdrawal-methods')
  async addWithdrawalMethod(@Body() body: { name: string; type: string; minAmount: number; fee: number; processingTime: string }) {
    return await this.platform.addWithdrawalMethod(
      body.name,
      body.type,
      body.minAmount,
      body.fee,
      body.processingTime
    );
  }

  @Post('admin/withdrawal-methods/:id')
  async updateWithdrawalMethod(@Param('id') id: string, @Body() body: { name: string; type: string; minAmount: number; fee: number; processingTime: string }) {
    return await this.platform.updateWithdrawalMethod(
      id,
      body.name,
      body.type,
      body.minAmount,
      body.fee,
      body.processingTime
    );
  }

  @Post('admin/withdrawal-methods/:id/delete')
  async deleteWithdrawalMethod(@Param('id') id: string) {
    return await this.platform.deleteWithdrawalMethod(id);
  }

  @Get('admin/withdrawals')
  async getPendingWithdrawals(@Query('userId') userId?: string, @Query('all') all?: string) {
    if (all === 'true') {
      return await this.platform.getAllWithdrawals(userId);
    }
    return await this.platform.getPendingWithdrawals();
  }

  @Post('admin/withdrawals/:id/approve')
  async approveWithdrawal(@Param('id') id: string) {
    return await this.platform.approveWithdrawal(id);
  }

  @Post('admin/withdrawals/:id/reject')
  async rejectWithdrawal(@Param('id') id: string, @Body() body: { reason?: string }) {
    return await this.platform.rejectWithdrawal(id, body.reason);
  }

  // ============================================
  // TIMER-BASED TRADING ENDPOINTS
  // ============================================

  @Get('trading/timer-settings')
  async getTimerSettings() {
    return await this.platform.getTimerSettings();
  }

  @Get('trading/settings')
  async getTradingSettings() {
    return await this.platform.getTradingSettings();
  }

  @Get('currency/settings')
  async getCurrencySettings() {
    return await this.platform.getCurrencySettings();
  }

  @Post('trading/timer-settings/:id')
  async updateTimerSettings(@Param('id') id: string, @Body() body: { isEnabled: boolean }) {
    return await this.platform.updateTimerSettings(id, body.isEnabled);
  }

  @Post('admin/timer-settings/add')
  async addTimerSettings(@Body() body: { duration: number; label: string; isEnabled?: boolean }) {
    return await this.platform.addTimerSettings(body.duration, body.label, body.isEnabled ?? true);
  }

  @Post('admin/timer-settings/:id/delete')
  async deleteTimerSettings(@Param('id') id: string) {
    return await this.platform.deleteTimerSettings(id);
  }

  @Post('trading/settings')
  async updateTradingSettings(@Body() body: { defaultProfitRate?: number; currencyCode?: string; currencySymbol?: string; locale?: string }) {
    return await this.platform.updateTradingSettings(body.defaultProfitRate, body.currencyCode, body.currencySymbol, body.locale);
  }

  @Post('trading/timed-trade')
  async createTimedTrade(@Body() body: { userId: string; amount: number; timerDuration: number }) {
    return await this.platform.createTimedTrade(body.userId, body.amount, body.timerDuration);
  }

  @Get('trading/timed-trades')
  async getUserTimedTrades(@Query('userId') userId: string) {
    return await this.platform.getUserTimedTrades(userId);
  }

  @Get('admin/timed-trades')
  async getAllTimedTrades(@Query('status') status?: 'pending' | 'win' | 'lose' | 'draw') {
    return await this.platform.getAllTimedTrades(status);
  }

  @Post('admin/timed-trades/:id/result')
  async setTradeResult(@Param('id') id: string, @Body() body: { result: 'win' | 'lose' | 'draw'; adminUserId?: string }) {
    return await this.platform.setTradeResult(id, body.result, body.adminUserId);
  }

  @Get('health/supabase')
  testSupabase() {
    return this.supabaseService.testConnection();
  }
}

