'use client';

import Link from "next/link";
import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminNav } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { LogOut, LayoutDashboard, Users, FileCheck, Wallet, CreditCard, Settings, TrendingUp, FileText, Clock, BarChart3, ChevronDown } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminShell({ title, subtitle, actions, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-open dropdown if a child route is active
  useEffect(() => {
    if (mounted && pathname) {
      adminNav.forEach((item) => {
        if (item.children) {
          const hasActiveChild = item.children.some(child => pathname.startsWith(child.href));
          if (hasActiveChild && openDropdown !== item.label) {
            setOpenDropdown(item.label);
          }
        }
      });
    }
  }, [pathname, mounted]);

  function handleLogout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refreshToken');
    localStorage.removeItem('user_role');
    router.push('/auth/admin/login');
  }

  const getIcon = (label: string) => {
    const iconMap: Record<string, ReactNode> = {
      "Overview": <LayoutDashboard className="size-4" />,
      "Users": <Users className="size-4" />,
      "KYC Desk": <FileCheck className="size-4" />,
      "Deposits": <Wallet className="size-4" />,
      "Withdrawals": <CreditCard className="size-4" />,
      "Payment Gateway": <Settings className="size-4" />,
      "Withdrawal Methods": <Settings className="size-4" />,
      "Wallet Ops": <Wallet className="size-4" />,
      "IPO Desk": <TrendingUp className="size-4" />,
      "IPO Applications": <FileText className="size-4" />,
      "Trading": <Settings className="size-4" />,
      "Trading Settings": <Settings className="size-4" />,
      "Timed Trades": <Clock className="size-4" />,
      "Stocks": <BarChart3 className="size-4" />,
    };
    return iconMap[label] || <LayoutDashboard className="size-4" />;
  };

  return (
    <div className="min-h-screen bg-[#010514] text-white">
      <div className="grid gap-6 px-4 py-8 lg:grid-cols-[280px_1fr] lg:px-10">
        <aside className="sticky top-8 h-[calc(100vh-4rem)] rounded-3xl border border-white/10 bg-slate-900/60 p-6 flex flex-col shadow-lg">
          <div className="mb-6">
            <p className="text-xl font-semibold text-white">Admin Control</p>
            <p className="text-sm text-white/60 mt-1">Supervise operations in real time.</p>
          </div>

          <nav className="mt-2 space-y-1 flex-1 overflow-y-auto pr-2">
            {adminNav.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isActive = mounted && pathname?.startsWith(item.href);
              const isDropdownOpen = openDropdown === item.label;
              const isChildActive = hasChildren && item.children?.some(child => pathname?.startsWith(child.href));

              return (
                <div key={item.href} className="space-y-1">
                  {hasChildren ? (
                    <>
                      <div className="flex items-center gap-1">
                        <Link
                          href={item.href}
                          className={cn(
                            "flex flex-1 items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                            (isActive || isChildActive)
                              ? "bg-white text-slate-900 shadow-md" 
                              : "text-white/70 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <span className={cn((isActive || isChildActive) ? "text-slate-900" : "text-white/60")}>
                            {getIcon(item.label)}
                          </span>
                          <span>{item.label}</span>
                        </Link>
                        <button
                          onClick={() => setOpenDropdown(isDropdownOpen ? null : item.label)}
                          className={cn(
                            "p-2 rounded-lg transition-all duration-200",
                            (isActive || isChildActive)
                              ? "text-slate-900 hover:bg-slate-200" 
                              : "text-white/60 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <ChevronDown 
                            className={cn(
                              "size-4 transition-transform duration-200",
                              isDropdownOpen ? "rotate-180" : ""
                            )} 
                          />
                        </button>
                      </div>
                      {isDropdownOpen && (
                        <div className="ml-4 space-y-1 border-l border-white/10 pl-4">
                          {item.children?.map((child) => {
                            const isChildActive = mounted && pathname?.startsWith(child.href);
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                  "flex items-center gap-3 rounded-xl px-4 py-2 text-sm transition-all duration-200",
                                  isChildActive
                                    ? "bg-white/20 text-white font-medium"
                                    : "text-white/60 hover:bg-white/10 hover:text-white/80"
                                )}
                              >
                                <span className="text-xs">•</span>
                                <span>{child.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
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
                  )}
                </div>
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

        <section className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.02] p-6 shadow-2xl shadow-brand/10">
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

