// ─────────────────────────────────────────────
//  SubscriptionContext.jsx
//  Provides plan status to all components.
//  Drop this in alongside AuthContext.
// ─────────────────────────────────────────────

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const SubscriptionContext = createContext(null);

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function SubscriptionProvider({ children }) {
  const { user } = useAuth();

  const [sub, setSub] = useState(null);      // raw API response
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    if (!user) { setSub(null); setLoading(false); return; }
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const res = await fetch(`${API}/api/subscription/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch subscription');
      const data = await res.json();
      setSub(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // ── Derived helpers ──────────────────────────

  /** Effective plan id ("pro" during trial, else "free"|"basic"|"pro") */
  const effectivePlan = sub?.effectivePlan || 'free';

  /** Is the trial currently running? */
  const isTrialActive = sub?.isTrialActive || false;

  /** Days left in trial (0 if not in trial) */
  const trialDaysLeft = sub?.trialDaysLeft || 0;

  /** Did the trial expire without upgrading? */
  const trialExpired = sub?.trialExpired || false;

  /** Was the trial force-ended (50 invoice bonus rule)? */
  const trialForceEnded = sub?.trialForceEnded || false;

  /** Can the user create more invoices? */
  const canCreateInvoice = (() => {
    if (!sub) return true; // optimistic
    const limit = sub.features?.invoiceLimit;       // null = unlimited
    if (limit === null) return true;
    return (sub.invoicesCount || 0) < limit;
  })();

  /** Can the user access reports? */
  const canViewReports = sub?.features?.reports || false;

  /** Upgrade helper — calls backend */
  const upgradePlan = async (plan) => {
    const token = await user.getIdToken();
    const res = await fetch(`${API}/api/subscription/upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upgrade failed');
    await fetchStatus(); // refresh
    return data;
  };

  return (
    <SubscriptionContext.Provider value={{
      sub, loading, error, fetchStatus,
      effectivePlan, isTrialActive, trialDaysLeft,
      trialExpired, trialForceEnded,
      canCreateInvoice, canViewReports,
      upgradePlan,
      invoicesCount: sub?.invoicesCount || 0,
      invoiceLimit: sub?.features?.invoiceLimit ?? null,
      availablePlans: sub?.availablePlans || [],
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be inside SubscriptionProvider');
  return ctx;
};
