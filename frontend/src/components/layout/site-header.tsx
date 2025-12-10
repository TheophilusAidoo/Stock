'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, ShieldCheck, User, UserPlus, LogOut, X } from "lucide-react";
import { primaryNav } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const ctas = [
  { label: "Log in", href: "/auth/login", variant: "ghost" as const, icon: User },
  { label: "Register", href: "/auth/register", variant: "primary" as const, icon: UserPlus },
];

export function SiteHeader() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const userToken = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
      
      if (!userToken) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      const userId = userToken.replace('token-', '');
      
      try {
        const profile = await api.user.getProfile(userId);
        setIsLoggedIn(true);
        setUserName((profile as any)?.name || null);
        setUserEmail((profile as any)?.email || null);
      } catch (error) {
        // If profile fetch fails, still check if token exists
        setIsLoggedIn(!!userToken);
      }
    } catch (error) {
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_refreshToken');
    localStorage.removeItem('user_role');
    setIsLoggedIn(false);
    setUserName(null);
    setUserEmail(null);
    router.push('/');
    window.location.reload();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 backdrop-blur bg-[#020817]/70">
      <div className="container flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-white tracking-tight">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand text-white shadow-card">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-base leading-none">StockMart</p>
            <p className="text-xs text-white/60">Invest with conviction</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-white/80 lg:flex">
          {primaryNav.map((item, index) => (
            <Link
              key={`nav-${index}-${item.href}`}
              href={item.href}
              className="transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {loading ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/60">
              Loading...
            </div>
          ) : isLoggedIn ? (
            <>
              <Link
                href="/user/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
              >
                <User className="size-4" />
                <span>{userName || userEmail || 'Dashboard'}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </>
          ) : (
            ctas.map(({ label, href, variant, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                  variant === "primary"
                    ? "bg-white text-slate-900 hover:bg-slate-200"
                    : "bg-white/5 text-white hover:bg-white/10"
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))
          )}
        </div>

        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="inline-flex size-10 items-center justify-center rounded-full bg-white/5 text-white lg:hidden"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[#020817]/95 backdrop-blur lg:hidden">
          <nav className="container py-4 space-y-3">
            {primaryNav.map((item, index) => (
              <Link
                key={`mobile-nav-${index}-${item.href}`}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-2 text-sm text-white/80 transition hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-white/10 pt-3 mt-3 space-y-3">
              {loading ? (
                <div className="px-4 py-2 text-sm text-white/60">Loading...</div>
              ) : isLoggedIn ? (
                <>
                  <Link
                    href="/user/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
                  >
                    <User className="size-4" />
                    <span>{userName || userEmail || 'Dashboard'}</span>
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
                  >
                    <LogOut className="size-4" />
                    Logout
                  </button>
                </>
              ) : (
                ctas.map(({ label, href, variant, icon: Icon }) => (
                  <Link
                    key={`mobile-${label}`}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
                      variant === "primary"
                        ? "bg-white text-slate-900 hover:bg-slate-200"
                        : "bg-white/5 text-white hover:bg-white/10"
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </Link>
                ))
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}


