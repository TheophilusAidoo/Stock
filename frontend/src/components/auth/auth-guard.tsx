'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

type AuthGuardProps = {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin';
  redirectTo?: string;
};

export function AuthGuard({ children, requiredRole = 'user', redirectTo }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only run on client side after mount
    if (!mounted || typeof window === 'undefined') return;

    // Check authentication status
    const token = requiredRole === 'admin' 
      ? localStorage.getItem('admin_token')
      : localStorage.getItem('user_token');
    
    const role = localStorage.getItem('user_role');

    if (!token) {
      // Not authenticated, redirect to appropriate login
      const loginPath = requiredRole === 'admin' 
        ? '/auth/admin/login'
        : '/auth/login';
      
      router.push(redirectTo || loginPath);
      return;
    }

    // Check role if admin is required
    if (requiredRole === 'admin' && role !== 'admin') {
      router.push('/auth/admin/login');
      return;
    }

    if (requiredRole === 'user' && role === 'admin') {
      // Admin trying to access user routes - allow or redirect based on your logic
      // For now, we'll allow it but you can change this
    }

    setIsAuthenticated(true);
  }, [router, pathname, requiredRole, redirectTo, mounted]);

  // Show loading state while checking auth or not mounted
  if (!mounted || isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#010514] text-white">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="text-sm text-white/60">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Only render children if authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  return null;
}

