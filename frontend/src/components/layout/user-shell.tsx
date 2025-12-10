'use client';

import Link from "next/link";
import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { userNav } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { usePathname, useSearchParams } from "next/navigation";
import { LogOut, LayoutDashboard, TrendingUp, Wallet, FileText, Settings, Briefcase, Bell, Star, MessageSquare, User } from "lucide-react";
import { api } from "@/lib/api";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function UserShell({ title, subtitle, actions, children }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [greeting, setGreeting] = useState<string>('Good Day');

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else if (hour >= 17 && hour < 21) {
      return 'Good Evening';
    } else {
      return 'Good Night';
    }
  }

  useEffect(() => {
    setMounted(true);
    loadUserProfile();
    
    // Set initial greeting
    setGreeting(getGreeting());
    
    // Update greeting every minute to handle day transitions
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);
    
    // Listen for profile update events
    const handleProfileUpdate = () => {
      loadUserProfile();
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // Reload profile when navigating to settings page (in case profile was updated)
  useEffect(() => {
    if (pathname === '/user/settings') {
      loadUserProfile();
    }
  }, [pathname]);

  async function loadUserProfile() {
    try {
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      if (!userToken) return;

      const userId = userToken.replace('token-', '');
      
      try {
        const profile = await api.user.getProfile(userId);
        setUserName((profile as any)?.name || null);
        setUserEmail((profile as any)?.email || null);
        setProfilePhoto((profile as any)?.profilePhoto || null);
      } catch (error) {
        console.error('Failed to load user profile:', error);
        // Fallback: try admin users endpoint
        try {
          const users = await api.admin.users();
          const userData = (users as any[]).find((u: any) => u.id === userId);
          if (userData) {
            setUserName(userData.name || null);
            setUserEmail(userData.email || null);
            setProfilePhoto(userData.profilePhoto || null);
          }
        } catch (fallbackError) {
          console.error('Fallback profile load error:', fallbackError);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  function handleLogout() {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_refreshToken');
    localStorage.removeItem('user_role');
    router.push('/auth/login');
  }

  const getIcon = (label: string) => {
    const iconMap: Record<string, ReactNode> = {
      "Dashboard": <LayoutDashboard className="size-4" />,
      "Wallet": <Wallet className="size-4" />,
      "Trading": <TrendingUp className="size-4" />,
      "Portfolio": <Briefcase className="size-4" />,
      "Watchlist": <Star className="size-4" />,
      "IPO Apply": <FileText className="size-4" />,
      "Notifications": <Bell className="size-4" />,
      "Support Tickets": <MessageSquare className="size-4" />,
      "Settings": <Settings className="size-4" />,
    };
    return iconMap[label] || <LayoutDashboard className="size-4" />;
  };

  return (
    <div className="min-h-screen bg-slate-950/95 text-white">
      <div className="flex flex-col gap-8 px-4 py-8 lg:flex-row lg:px-8">
        <aside className="sticky top-8 h-[calc(100vh-4rem)] w-full rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg lg:w-64 flex flex-col">
          <div className="mb-6">
            <p className="text-xl font-semibold text-white">User Console</p>
            {userName || userEmail ? (
              <div className="flex items-center gap-3 mt-3">
                <div className="relative flex-shrink-0">
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto} 
                      alt={userName || userEmail || 'User'} 
                      className="size-10 rounded-full border-2 border-white/20 object-cover"
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-full border-2 border-white/20 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                      <User className="size-5 text-white/70" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/90 truncate">
                    {greeting}{userName ? `, ${userName.split(' ')[0]}` : userEmail ? `, ${userEmail.split('@')[0]}` : ''}!
                  </p>
                  {(userName || userEmail) && (
                    <p className="text-xs text-white/50 truncate">
                      {userEmail || userName}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/60 mt-1">Track, trade, and manage in one tab.</p>
            )}
          </div>
          <nav className="mt-2 space-y-1 flex-1 overflow-y-auto pr-2">
            {userNav.map((item) => {
              // Check if href has query params
              const [basePath, queryString] = item.href.split('?');
              const itemQueryParams = queryString ? new URLSearchParams(queryString) : null;
              
              // Check pathname match
              const pathMatches = mounted && pathname?.startsWith(basePath);
              
              // Check query params match if item has them
              let queryMatches = true;
              if (itemQueryParams && mounted) {
                queryMatches = Array.from(itemQueryParams.keys()).every(key => 
                  searchParams?.get(key) === itemQueryParams.get(key)
                );
              }
              
              // For Settings link, make sure it's NOT active if we're on Support Tickets (tab=help)
              let isActive = pathMatches;
              if (item.label === 'Settings' && mounted && searchParams?.get('tab') === 'help') {
                isActive = false;
              } else if (item.label === 'Support Tickets') {
                isActive = pathMatches && queryMatches;
              }
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-white text-slate-900 shadow-md"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span className={cn(isActive ? "text-slate-900" : "text-white/60")}>
                    {getIcon(item.label)}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <button
            onClick={handleLogout}
            className="mt-auto flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white hover:border-white/20"
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </aside>
        <section className="flex-1 space-y-6 rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{title}</h1>
              {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
            </div>
            {actions}
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}

