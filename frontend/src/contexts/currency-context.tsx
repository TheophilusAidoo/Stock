'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { setCurrencySettings } from '@/lib/utils';

type CurrencySettings = {
  currencyCode: string;
  currencySymbol: string;
  locale: string;
};

type CurrencyContextType = {
  currency: CurrencySettings;
  loading: boolean;
  refreshCurrency: () => Promise<void>;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const defaultCurrency: CurrencySettings = {
  currencyCode: 'INR',
  currencySymbol: '₹',
  locale: 'en-IN',
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencySettings>(defaultCurrency);
  const [loading, setLoading] = useState(false);

  async function loadCurrency() {
    // Currency settings can be loaded from API later if needed
    // For now, just use defaults to avoid any fetch errors
    setLoading(true);
    setCurrency(defaultCurrency);
    setCurrencySettings(defaultCurrency);
    setLoading(false);
  }

  useEffect(() => {
    // Initialize with default currency immediately
    setCurrencySettings(defaultCurrency);
    setCurrency(defaultCurrency);
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, loading, refreshCurrency: loadCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

