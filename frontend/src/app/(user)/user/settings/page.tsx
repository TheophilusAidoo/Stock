'use client';

import { useState, useEffect } from "react";
import { UserShell } from "@/components/layout/user-shell";
import { api } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import { 
  User, Mail, Phone, MapPin, CreditCard, Shield, Wallet, 
  Bell, HelpCircle, CheckCircle2, XCircle, Loader2, Camera,
  Lock, Key, Eye, EyeOff, FileText, MessageSquare, Plus, ChevronDown
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";

type UserProfile = {
  id: string;
  name: string;
  email: string;
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
  kycStatus: 'pending' | 'approved' | 'rejected';
};

type SupportMessage = {
  id: string;
  ticketId: string;
  senderType: 'user' | 'admin';
  senderId: string;
  message: string;
  createdAt: string;
};

type SupportTicket = {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  adminResponse?: string;
  messages?: SupportMessage[];
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'wallet' | 'kyc' | 'notifications' | 'help'>('profile');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showPassword, setShowPassword] = useState({ old: false, new: false, confirm: false });
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());
  const [replyMessages, setReplyMessages] = useState<Record<string, string>>({});

  function playBellSound() {
    try {
      // Use HTML5 Audio for better browser compatibility
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume audio context if suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Bell-like sound: two tones with better timing
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.15);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (error) {
      console.error('Failed to play bell sound:', error);
      // Fallback: try using HTML5 audio beep
      try {
        const beep = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OSdTgwOUKnm8LZjGwY4kdfyznksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBtpvfDknU4MDlCp5vC2YxsGOJHX8s55LAUkd8fw3ZBACxRe');
        beep.volume = 0.5;
        beep.play().catch(() => {});
      } catch (e) {
        console.error('Fallback audio also failed:', e);
      }
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Check URL params for tab and ticket ID
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      const ticketId = params.get('ticket');
      
      // Switch to help tab if tab=help is in URL
      if (tab === 'help') {
        setActiveTab('help');
      }
      
      // Expand specific ticket if ticket ID is provided
      if (ticketId) {
        setActiveTab('help');
        setTimeout(() => {
          setExpandedTickets(new Set([ticketId]));
        }, 500);
      }
    }
  }, []);

  useEffect(() => {
    // Poll for ticket updates every 30 seconds when on help tab
    if (activeTab !== 'help') return;

    const interval = setInterval(async () => {
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const userId = userToken ? userToken.replace('token-', '') : undefined;
      if (userId) {
        try {
          const tickets = await api.user.getSupportTickets(userId);
          const newTickets = tickets as SupportTicket[];
          
          // Check for new admin messages
          setSupportTickets((oldTickets) => {
            newTickets.forEach((newTicket) => {
              const oldTicket = oldTickets.find(t => t.id === newTicket.id);
              const oldMessageCount = oldTicket?.messages?.length || 0;
              const newMessageCount = newTicket.messages?.length || 0;
              
              // Check if admin sent a new message
              if (newTicket.messages && newMessageCount > oldMessageCount) {
                const newAdminMessages = newTicket.messages.filter(m => 
                  m.senderType === 'admin' && 
                  (!oldTicket?.messages || !oldTicket.messages.find(om => om.id === m.id))
                );
                if (newAdminMessages.length > 0) {
                  playBellSound();
                }
              }
            });
            return newTickets;
          });
        } catch (error) {
          console.error('Failed to poll tickets:', error);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTab]);

  async function loadData() {
    try {
      setLoading(true);
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const userId = userToken ? userToken.replace('token-', '') : undefined;

      if (!userId) {
        setLoading(false);
        return;
      }

      // Try to get profile from user endpoint first, fallback to admin users
      let profileData: any = null;
      try {
        profileData = await api.user.getProfile(userId);
      } catch (error) {
        console.error('Profile load error, trying fallback:', error);
        // Fallback: get from admin users endpoint
        try {
          const users = await api.admin.users();
          const userData = (users as any[]).find((u: any) => u.id === userId);
          if (userData) {
            const { password, segment, ...profile } = userData;
            // Convert segment string to array if needed
            profileData = {
              ...profile,
              segment: Array.isArray(profile.segment) ? profile.segment : (profile.segment ? profile.segment.split(', ') : []),
            };
          }
        } catch (fallbackError) {
          console.error('Fallback profile load error:', fallbackError);
        }
      }

      const tickets = await api.user.getSupportTickets(userId).catch(() => []);

      if (profileData) {
        setProfile(profileData as UserProfile);
      }
      setSupportTickets(tickets as SupportTicket[]);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleProfilePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setProfilePhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleUpdateProfilePhoto() {
    if (!profilePhotoFile || !profile) return;

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (profilePhotoFile.size > maxSize) {
      alert('Image size must be less than 5MB. Please choose a smaller image.');
      return;
    }

    setSaving(true);
    try {
      const reader = new FileReader();
      const photoData = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => {
          const result = e.target?.result as string;
          // Validate base64 data length (max ~6.5MB base64 = ~5MB image)
          if (result && result.length > 7 * 1024 * 1024) {
            reject(new Error('Image is too large. Please choose a smaller image.'));
            return;
          }
          resolve(result);
        };
        reader.onerror = (error) => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(profilePhotoFile);
      });

      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const userId = userToken ? userToken.replace('token-', '') : undefined;

      if (!userId) {
        throw new Error('User not authenticated. Please log in again.');
      }

      console.log('Uploading profile photo...', { userId, photoSize: photoData.length });

      const result = await api.user.updateProfile({
        userId: userId,
        profilePhoto: photoData,
      });

      console.log('Profile photo update result:', result);

      setProfilePhotoFile(null);
      setProfilePhotoPreview(null);
      await loadData();
      
      // Dispatch event to notify sidebar to refresh profile
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profileUpdated'));
      }
      
      alert('Profile photo updated successfully');
    } catch (error) {
      console.error('Error updating profile photo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile photo';
      alert(`Error: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      const formData = new FormData(event.currentTarget);
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const userId = userToken ? userToken.replace('token-', '') : undefined;

      const name = formData.get('name') as string;
      const mobile = formData.get('mobile') as string;
      const address = formData.get('address') as string;
      const gender = formData.get('gender') as string;

      await api.user.updateProfile({
        userId: userId!,
        name: name || undefined,
        mobile: mobile || undefined,
        address: address || undefined,
        gender: gender && gender !== '' ? gender as 'Male' | 'Female' | 'Other' : undefined,
      });

      await loadData();
      
      // Dispatch event to notify sidebar to refresh profile
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profileUpdated'));
      }
      
      alert('Profile updated successfully');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(event.currentTarget);
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const userId = userToken ? userToken.replace('token-', '') : undefined;

      const oldPassword = formData.get('oldPassword') as string;
      const newPassword = formData.get('newPassword') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      if (newPassword !== confirmPassword) {
        alert('New password and confirm password do not match');
        setSaving(false);
        return;
      }

      if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long');
        setSaving(false);
        return;
      }

      await api.user.changePassword({
        userId: userId!,
        oldPassword,
        newPassword,
      });

      alert('Password changed successfully');
      setShowPasswordForm(false);
      setShowPassword({ old: false, new: false, confirm: false });
      (event.target as HTMLFormElement).reset();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  }

  async function handleTwoFactor(enabled: boolean) {
    setSaving(true);
    try {
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const userId = userToken ? userToken.replace('token-', '') : undefined;

      await api.user.updateTwoFactor({ userId: userId!, enabled });
      await loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update 2FA');
    } finally {
      setSaving(false);
    }
  }

  async function handleWalletPreferences(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(event.currentTarget);
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const userId = userToken ? userToken.replace('token-', '') : undefined;

      const defaultDepositMethod = formData.get('defaultDepositMethod') as string;
      const defaultWithdrawalMethod = formData.get('defaultWithdrawalMethod') as string;

      await api.user.updateWalletPreferences({
        userId: userId!,
        defaultDepositMethod: defaultDepositMethod && defaultDepositMethod !== '' ? defaultDepositMethod : undefined,
        defaultWithdrawalMethod: defaultWithdrawalMethod && defaultWithdrawalMethod !== '' ? defaultWithdrawalMethod : undefined,
      });

      await loadData();
      alert('Wallet preferences updated successfully');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  }

  async function handleNotificationPreferences(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(event.currentTarget);
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const userId = userToken ? userToken.replace('token-', '') : undefined;

      const preferences: Record<string, boolean> = {
        ipoAlerts: formData.get('ipoAlerts') === 'on',
        depositUpdates: formData.get('depositUpdates') === 'on',
        withdrawalUpdates: formData.get('withdrawalUpdates') === 'on',
        approvalNotifications: formData.get('approvalNotifications') === 'on',
        systemAlerts: formData.get('systemAlerts') === 'on',
        loginAlerts: formData.get('loginAlerts') === 'on',
      };

      await api.user.updateNotificationPreferences({ userId: userId!, preferences });
      await loadData();
      alert('Notification preferences updated');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(event.currentTarget);
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const userId = userToken ? userToken.replace('token-', '') : undefined;

      await api.user.createSupportTicket({
        userId: userId!,
        subject: formData.get('subject') as string,
        category: formData.get('category') as any,
        message: formData.get('message') as string,
      });

      await loadData();
      setShowTicketForm(false);
      alert('Support ticket created successfully');
      (event.target as HTMLFormElement).reset();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create ticket');
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify(type: 'email' | 'mobile') {
    try {
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      const userId = userToken ? userToken.replace('token-', '') : undefined;

      if (type === 'email') {
        await api.user.verifyEmail(userId!);
      } else {
        await api.user.verifyMobile(userId!);
      }

      await loadData();
      alert(`${type === 'email' ? 'Email' : 'Mobile'} verification initiated`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to verify');
    }
  }

  if (loading) {
    return (
      <UserShell title="Settings" subtitle="Control notifications, limits, and security">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-white/60" />
        </div>
      </UserShell>
    );
  }

  if (!profile) {
    return (
      <UserShell title="Settings" subtitle="Control notifications, limits, and security">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center text-white/60">
          <p>Failed to load profile</p>
        </div>
      </UserShell>
    );
  }

  const isKycVerified = profile.kycStatus === 'approved';

  return (
    <UserShell title="Settings" subtitle="Control notifications, limits, and security">
      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-white/10 overflow-x-auto">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'security', label: 'Security', icon: Shield },
          { id: 'wallet', label: 'Wallet', icon: Wallet },
          { id: 'kyc', label: 'KYC', icon: CreditCard },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'help', label: 'Help Center', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap px-4 py-2 text-sm font-medium transition",
                activeTab === tab.id
                  ? "border-b-2 border-blue-400 text-blue-400"
                  : "text-white/60 hover:text-white"
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold mb-4">Profile & Personal Information</h2>
            
            <div className="mb-6 flex items-center gap-4">
              <div className="relative">
                {profilePhotoPreview ? (
                  <img src={profilePhotoPreview} alt="Profile" className="size-24 rounded-full object-cover" />
                ) : profile.profilePhoto ? (
                  <img src={profile.profilePhoto} alt="Profile" className="size-24 rounded-full object-cover" />
                ) : (
                  <div className="flex size-24 items-center justify-center rounded-full bg-white/10 text-4xl text-white/60">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-blue-600 p-2 text-white hover:bg-blue-700 transition">
                  <Camera className="size-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{profile.name}</h3>
                <p className="text-sm text-white/60">{profile.email}</p>
                {profilePhotoFile && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={handleUpdateProfilePhoto}
                      disabled={saving}
                      className="rounded-xl bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {saving ? 'Uploading...' : 'Save Photo'}
                    </button>
                    <button
                      onClick={() => {
                        setProfilePhotoFile(null);
                        setProfilePhotoPreview(null);
                      }}
                      className="rounded-xl border border-white/20 bg-white/5 px-3 py-1 text-xs text-white hover:bg-white/10 transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-white/60">Full Name</label>
                  <input
                    name="name"
                    type="text"
                    defaultValue={profile.name}
                    disabled={isKycVerified}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500 disabled:opacity-50"
                    required
                  />
                  {isKycVerified && <p className="mt-1 text-xs text-white/40">Read-only (KYC verified)</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm text-white/60">Email Address</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      defaultValue={profile.email}
                      readOnly
                      className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none read-only:opacity-50"
                    />
                    {profile.emailVerified ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
                        <CheckCircle2 className="size-3" />
                        Verified
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleVerify('email')}
                        className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-white/60">Mobile Number</label>
                  <div className="flex items-center gap-2">
                    <input
                      name="mobile"
                      type="tel"
                      defaultValue={profile.mobile || ''}
                      placeholder="+91 9876543210"
                      className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
                    />
                    {profile.mobileVerified ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-400">
                        <CheckCircle2 className="size-3" />
                        Verified
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleVerify('mobile')}
                        className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-white/60">Date of Birth</label>
                  <input
                    type="date"
                    defaultValue={profile.dateOfBirth || ''}
                    readOnly={isKycVerified}
                    disabled={isKycVerified}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none disabled:opacity-50 read-only:opacity-50"
                  />
                  {isKycVerified && <p className="mt-1 text-xs text-white/40">Read-only (KYC verified)</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm text-white/60">Gender</label>
                  <select
                    name="gender"
                    defaultValue={profile.gender || ''}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
                  >
                    <option value="" className="bg-slate-900">Select</option>
                    <option value="Male" className="bg-slate-900">Male</option>
                    <option value="Female" className="bg-slate-900">Female</option>
                    <option value="Other" className="bg-slate-900">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm text-white/60">Address</label>
                  <textarea
                    name="address"
                    defaultValue={profile.address || ''}
                    rows={3}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
                    placeholder="Enter your address"
                  />
                </div>

                {isKycVerified && (
                  <>
                    <div>
                      <label className="mb-1 block text-sm text-white/60">PAN</label>
                      <input
                        type="text"
                        defaultValue={profile.pan || ''}
                        readOnly
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none read-only:opacity-50"
                      />
                      <p className="mt-1 text-xs text-white/40">Read-only (KYC verified)</p>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm text-white/60">Aadhaar</label>
                      <input
                        type="text"
                        defaultValue={profile.aadhaar || ''}
                        readOnly
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none read-only:opacity-50"
                      />
                      <p className="mt-1 text-xs text-white/40">Read-only (KYC verified)</p>
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </section>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold mb-4">Security & Login Settings</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Change Login Password</h3>
                {!showPasswordForm ? (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="rounded-2xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
                  >
                    Change Password
                  </button>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div>
                      <label className="mb-1 block text-sm text-white/60">Current Password</label>
                      <div className="relative">
                        <input
                          name="oldPassword"
                          type={showPassword.old ? "text" : "password"}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 pr-10 text-white outline-none focus:border-blue-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({ ...showPassword, old: !showPassword.old })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition"
                        >
                          {showPassword.old ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-white/60">New Password</label>
                      <div className="relative">
                        <input
                          name="newPassword"
                          type={showPassword.new ? "text" : "password"}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 pr-10 text-white outline-none focus:border-blue-500"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition"
                        >
                          {showPassword.new ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-white/40">Must be at least 6 characters</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-white/60">Confirm New Password</label>
                      <div className="relative">
                        <input
                          name="confirmPassword"
                          type={showPassword.confirm ? "text" : "password"}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 pr-10 text-white outline-none focus:border-blue-500"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition"
                        >
                          {showPassword.confirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {saving ? 'Updating...' : 'Update Password'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPasswordForm(false)}
                        className="rounded-2xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              <div className="border-t border-white/10 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Two-Factor Authentication (2FA)</h3>
                    <p className="text-xs text-white/60 mt-1">Add an extra layer of security to your account</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.twoFactorEnabled || false}
                      onChange={(e) => handleTwoFactor(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
                </div>
                {profile.twoFactorEnabled && (
                  <p className="mt-2 text-xs text-emerald-400">2FA is enabled</p>
                )}
              </div>
          </div>
        </section>
        </div>
      )}

      {/* Wallet Tab */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold mb-4">Wallet Preferences</h2>
            <form onSubmit={handleWalletPreferences} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-white/60">Default Deposit Method (Optional)</label>
                <select
                  name="defaultDepositMethod"
                  defaultValue={profile.defaultDepositMethod || ''}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
                >
                  <option value="" className="bg-slate-900">None</option>
                  <option value="GW001" className="bg-slate-900">USDT (TRC20)</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-white/60">Default Withdrawal Method</label>
                <select
                  name="defaultWithdrawalMethod"
                  defaultValue={profile.defaultWithdrawalMethod || ''}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
                >
                  <option value="" className="bg-slate-900">None</option>
                  <option value="WM001" className="bg-slate-900">TRC20 USDT</option>
                  <option value="WM002" className="bg-slate-900">Bank Transfer</option>
                  <option value="WM003" className="bg-slate-900">Binance Pay</option>
                </select>
              </div>

              <div className="border-t border-white/10 pt-4">
                <h3 className="text-sm font-medium mb-3">Transaction History</h3>
                <a
                  href="/user/wallet"
                  className="text-blue-400 hover:text-blue-300 text-sm underline"
                >
                  View all deposit & withdrawal transactions →
                </a>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          </section>
        </div>
      )}

      {/* KYC Tab */}
      {activeTab === 'kyc' && (
        <div className="space-y-6">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold mb-4">KYC Verification</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 p-4">
                <div>
                  <p className="font-medium">KYC Status</p>
                  <p className="text-sm text-white/60">
                    {profile.kycStatus === 'approved' && 'Verified'}
                    {profile.kycStatus === 'pending' && 'Pending Approval'}
                    {profile.kycStatus === 'rejected' && 'Rejected'}
                  </p>
                </div>
                <span className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  profile.kycStatus === 'approved' && "bg-emerald-500/20 text-emerald-400",
                  profile.kycStatus === 'pending' && "bg-yellow-500/20 text-yellow-400",
                  profile.kycStatus === 'rejected' && "bg-rose-500/20 text-rose-400"
                )}>
                  {profile.kycStatus.toUpperCase()}
                </span>
              </div>

              {profile.kycStatus !== 'approved' && (
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                  <p className="text-sm text-blue-400 mb-3">Complete your KYC verification to unlock all features</p>
                  <a
                    href="/auth/kyc"
                    className="inline-block rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                  >
                    Submit KYC Documents
                  </a>
                </div>
              )}

              {profile.kycStatus === 'approved' && (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="size-4" />
                    <span>Identity Verified</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="size-4" />
                    <span>PAN Verified</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="size-4" />
                    <span>Address Verified</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="size-4" />
                    <span>Admin Verified</span>
                  </div>
                </div>
              )}
          </div>
        </section>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold mb-4">Notification Center</h2>
            <form onSubmit={handleNotificationPreferences} className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 cursor-pointer hover:bg-white/5 transition">
                  <div>
                    <p className="font-medium">IPO Alerts</p>
                    <p className="text-xs text-white/60">Get notified about new IPOs and allotments</p>
                  </div>
                  <input
                    type="checkbox"
                    name="ipoAlerts"
                    defaultChecked={profile.notificationPreferences?.ipoAlerts}
                    className="size-5 accent-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 cursor-pointer hover:bg-white/5 transition">
                  <div>
                    <p className="font-medium">Deposit Updates</p>
                    <p className="text-xs text-white/60">Notifications for deposit status changes</p>
                  </div>
                  <input
                    type="checkbox"
                    name="depositUpdates"
                    defaultChecked={profile.notificationPreferences?.depositUpdates}
                    className="size-5 accent-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 cursor-pointer hover:bg-white/5 transition">
                  <div>
                    <p className="font-medium">Withdrawal Updates</p>
                    <p className="text-xs text-white/60">Notifications for withdrawal status changes</p>
                  </div>
                  <input
                    type="checkbox"
                    name="withdrawalUpdates"
                    defaultChecked={profile.notificationPreferences?.withdrawalUpdates}
                    className="size-5 accent-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 cursor-pointer hover:bg-white/5 transition">
                  <div>
                    <p className="font-medium">Approval Notifications</p>
                    <p className="text-xs text-white/60">Get notified when admin approves/rejects requests</p>
                  </div>
                  <input
                    type="checkbox"
                    name="approvalNotifications"
                    defaultChecked={profile.notificationPreferences?.approvalNotifications}
                    className="size-5 accent-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 cursor-pointer hover:bg-white/5 transition">
                  <div>
                    <p className="font-medium">System Alerts</p>
                    <p className="text-xs text-white/60">Important system updates and announcements</p>
                  </div>
                  <input
                    type="checkbox"
                    name="systemAlerts"
                    defaultChecked={profile.notificationPreferences?.systemAlerts}
                    className="size-5 accent-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 cursor-pointer hover:bg-white/5 transition">
                  <div>
                    <p className="font-medium">Login Alerts</p>
                    <p className="text-xs text-white/60">Get notified when someone logs into your account</p>
                  </div>
                  <input
                    type="checkbox"
                    name="loginAlerts"
                    defaultChecked={profile.notificationPreferences?.loginAlerts}
                    className="size-5 accent-blue-600"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          </section>
        </div>
      )}

      {/* Help Center Tab */}
      {activeTab === 'help' && (
        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-lg font-semibold mb-4">Help & Support</h2>

            <div className="mb-6">
              <h3 className="text-sm font-medium mb-4">Frequently Asked Questions</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { question: 'Deposits - How to deposit funds?', answer: 'Go to Wallet → Deposit, select your preferred payment method, enter the amount, and follow the instructions to complete your deposit.' },
                  { question: 'Withdrawals - How to withdraw funds?', answer: 'Navigate to Wallet → Withdraw, choose your withdrawal method, enter the amount, and submit your withdrawal request for admin approval.' },
                  { question: 'IPO - How to apply for IPOs?', answer: 'Visit the IPO Desk, select an available IPO, choose the number of lots, and submit your application. The amount will be blocked until allotment.' },
                  { question: 'Trading - How to place orders?', answer: 'Go to Trading page, select a stock symbol, choose BUY or SELL, enter quantity and price, select timer (for timed trades), and execute your order.' },
                  { question: 'KYC - KYC verification process', answer: 'Complete your profile in Settings, upload required documents (PAN, Aadhaar), and submit for verification. Admin will review and approve your KYC.' },
                ].map((faq, idx) => (
                  <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition">
                    <h4 className="text-sm font-semibold text-white mb-2">{faq.question}</h4>
                    <p className="text-xs text-white/70 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Support Tickets</h3>
                <button
                  onClick={() => setShowTicketForm(!showTicketForm)}
                  className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
                >
                  <Plus className="size-4" />
                  Raise a Ticket
                </button>
              </div>

              {showTicketForm && (
                <form onSubmit={handleCreateTicket} className="mb-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div>
                    <label className="mb-1 block text-sm text-white/60">Subject</label>
                    <input
                      name="subject"
                      type="text"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-white/60">Category</label>
                    <select
                      name="category"
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
                      required
                    >
                      <option value="" className="bg-slate-900">Select Category</option>
                      <option value="Deposit" className="bg-slate-900">Deposit</option>
                      <option value="Withdrawal" className="bg-slate-900">Withdrawal</option>
                      <option value="IPO" className="bg-slate-900">IPO</option>
                      <option value="Trading" className="bg-slate-900">Trading</option>
                      <option value="KYC" className="bg-slate-900">KYC</option>
                      <option value="Other" className="bg-slate-900">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-white/60">Message</label>
                    <textarea
                      name="message"
                      rows={4}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {saving ? 'Submitting...' : 'Submit Ticket'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTicketForm(false)}
                      className="rounded-2xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {supportTickets.length === 0 ? (
                <p className="text-center text-white/50 py-8">No support tickets yet</p>
              ) : (
                <div className="space-y-3">
                  {supportTickets.map((ticket) => {
                    const isExpanded = expandedTickets.has(ticket.id);
                    const hasNewAdminMessage = ticket.messages?.some(m => 
                      m.senderType === 'admin' && 
                      new Date(m.createdAt) > new Date(Date.now() - 30000) // Within last 30 seconds
                    ) || (ticket.adminResponse && ticket.adminResponse.trim() !== '');
                    const hasAdminMessages = ticket.messages?.some(m => m.senderType === 'admin') || !!ticket.adminResponse;
                    return (
                      <div
                        key={ticket.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
                      >
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedTickets);
                            if (isExpanded) {
                              newExpanded.delete(ticket.id);
                            } else {
                              newExpanded.add(ticket.id);
                            }
                            setExpandedTickets(newExpanded);
                          }}
                          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="font-mono text-xs text-white/60">{ticket.id}</code>
                                {hasNewAdminMessage && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400 animate-pulse">
                                    <Bell className="size-3" />
                                    New Message
                                  </span>
                                )}
                                {hasAdminMessages && !hasNewAdminMessage && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                                    <MessageSquare className="size-3" />
                                    Replied
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium text-white truncate">{ticket.subject}</p>
                              <p className="text-xs text-white/50 mt-1">{ticket.category}</p>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-medium", 
                                ticket.status === 'Open' ? 'bg-blue-500/20 text-blue-400' :
                                ticket.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-400' :
                                ticket.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                                'bg-gray-500/20 text-gray-400'
                              )}>
                                {ticket.status}
                              </span>
                              <ChevronDown className={cn("size-4 text-white/40 transition-transform", isExpanded && "rotate-180")} />
                            </div>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-white/10 p-4">
                            {/* Chat Messages */}
                            <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto pr-2">
                              {/* Initial user message */}
                              <div className="flex justify-end">
                                <div className="max-w-[80%] rounded-2xl bg-blue-500/20 border border-blue-500/30 p-3">
                                  <p className="text-sm text-white whitespace-pre-wrap">{ticket.message}</p>
                                  <p className="text-xs text-white/50 mt-1">
                                    {new Date(ticket.createdAt).toLocaleString('en-IN')}
                                  </p>
                                </div>
                              </div>

                              {/* Chat messages */}
                              {ticket.messages && ticket.messages.length > 0 ? (
                                ticket.messages.map((msg) => (
                                  <div
                                    key={msg.id}
                                    className={cn(
                                      "flex",
                                      msg.senderType === 'user' ? "justify-end" : "justify-start"
                                    )}
                                  >
                                    <div className={cn(
                                      "max-w-[80%] rounded-2xl p-3",
                                      msg.senderType === 'user'
                                        ? "bg-blue-500/20 border border-blue-500/30"
                                        : "bg-emerald-500/20 border border-emerald-500/30"
                                    )}>
                                      <p className="text-xs text-white/60 mb-1">
                                        {msg.senderType === 'admin' ? 'Support' : 'You'}
                                      </p>
                                      <p className="text-sm text-white whitespace-pre-wrap">{msg.message}</p>
                                      <p className="text-xs text-white/50 mt-1">
                                        {new Date(msg.createdAt).toLocaleString('en-IN')}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                // Fallback to adminResponse if messages array doesn't exist
                                ticket.adminResponse && (
                                  <div className="flex justify-start">
                                    <div className="max-w-[80%] rounded-2xl bg-emerald-500/20 border border-emerald-500/30 p-3">
                                      <p className="text-xs text-white/60 mb-1">Support</p>
                                      <p className="text-sm text-white whitespace-pre-wrap">{ticket.adminResponse}</p>
                                      <p className="text-xs text-white/50 mt-1">
                                        {new Date(ticket.updatedAt).toLocaleString('en-IN')}
                                      </p>
                                    </div>
                                  </div>
                                )
                              )}

                              {(!ticket.messages || ticket.messages.length === 0) && !ticket.adminResponse && (
                                <div className="rounded-xl border border-white/5 bg-white/5 p-3 text-center">
                                  <p className="text-xs text-white/50">Waiting for support response...</p>
                                </div>
                              )}
                            </div>

                            {/* Reply Form */}
                            {ticket.status !== 'Closed' && (
                              <form
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
                                  const userId = userToken ? userToken.replace('token-', '') : undefined;
                                  const replyMessage = replyMessages[ticket.id] || '';
                                  
                                  if (!replyMessage.trim() || !userId) return;

                                  try {
                                    setSaving(true);
                                    await api.user.addSupportTicketMessage(ticket.id, userId, replyMessage);
                                    setReplyMessages({ ...replyMessages, [ticket.id]: '' });
                                    await loadData();
                                  } catch (error) {
                                    alert(error instanceof Error ? error.message : 'Failed to send message');
                                  } finally {
                                    setSaving(false);
                                  }
                                }}
                                className="flex gap-2 border-t border-white/10 pt-4"
                              >
                                <textarea
                                  value={replyMessages[ticket.id] || ''}
                                  onChange={(e) => setReplyMessages({ ...replyMessages, [ticket.id]: e.target.value })}
                                  placeholder="Type your reply..."
                                  rows={2}
                                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-blue-500 resize-none"
                                />
                                <button
                                  type="submit"
                                  disabled={saving || !replyMessages[ticket.id]?.trim()}
                                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {saving ? 'Sending...' : 'Send'}
        </button>
      </form>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </UserShell>
  );
}
