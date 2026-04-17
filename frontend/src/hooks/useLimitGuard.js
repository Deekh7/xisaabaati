// ─────────────────────────────────────────────
//  useLimitGuard.js
//  Call this hook in any component that needs
//  to enforce plan limits before an action.
//
//  Usage:
//    const { guard, PaywallGate } = useLimitGuard();
//    <button onClick={() => guard('invoice', () => createInvoice())}>
//      New Invoice
//    </button>
//    <PaywallGate />   ← render this once near the bottom of the component
// ─────────────────────────────────────────────

import { useState } from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import PaywallModal from '../components/PaywallModal';

export function useLimitGuard() {
  const { canCreateInvoice, canViewReports } = useSubscription();
  const [paywallTrigger, setPaywallTrigger] = useState(null); // null | 'limit' | 'reports'

  /**
   * Guard an action.
   * @param {'invoice'|'reports'} resource  what is being accessed
   * @param {Function}           action    the function to run if allowed
   */
  const guard = (resource, action) => {
    if (resource === 'invoice' && !canCreateInvoice) {
      setPaywallTrigger('limit');
      return;
    }
    if (resource === 'reports' && !canViewReports) {
      setPaywallTrigger('reports');
      return;
    }
    action();
  };

  /** Render this anywhere in the component tree that uses guard() */
  const PaywallGate = () =>
    paywallTrigger ? (
      <PaywallModal
        triggeredBy={paywallTrigger}
        onClose={() => setPaywallTrigger(null)}
      />
    ) : null;

  return { guard, PaywallGate, openPaywall: setPaywallTrigger };
}
