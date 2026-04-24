// SubscriptionContext.jsx — Firestore-based (no backend API)
import { createContext, useContext, useMemo } from 'react'
import { useAuth } from './AuthContext'

const SubscriptionContext = createContext(null)

// Plan definitions — single source of truth on the client
export const PLAN_DEFS = {
  free:    { id:'free',    name:'Free',    price:0,  annualPrice:0,    features:{ reports:false, expenses:false, invoiceLimit:20,   multiUser:false } },
  starter: { id:'starter', name:'Starter', price:9,  annualPrice:6.3,  features:{ reports:true,  expenses:true,  invoiceLimit:null, multiUser:false } },
  basic:   { id:'basic',   name:'Basic',   price:19, annualPrice:13.3, features:{ reports:true,  expenses:true,  invoiceLimit:null, multiUser:false } },
  pro:     { id:'pro',     name:'Pro',     price:39, annualPrice:27.3, features:{ reports:true,  expenses:true,  invoiceLimit:null, multiUser:true  } },
}

function resolveUserPlan(profile) {
  const plan = profile?.plan || 'free'
  const trialEndsAt = profile?.trialEndsAt
  const now = new Date()

  let isTrialActive = false
  let trialDaysLeft = 0
  let trialExpired  = false

  if (trialEndsAt) {
    const end = new Date(trialEndsAt)
    if (end > now) {
      isTrialActive = true
      trialDaysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    } else if (plan === 'free') {
      trialExpired = true
    }
  }

  const effectivePlan = isTrialActive ? 'pro' : plan
  const features = PLAN_DEFS[effectivePlan]?.features || PLAN_DEFS.free.features

  return { effectivePlan, isTrialActive, trialDaysLeft, trialExpired, features }
}

export function SubscriptionProvider({ children }) {
  const { profile } = useAuth()

  const sub = useMemo(() => {
    if (!profile) return null
    return resolveUserPlan(profile)
  }, [profile])

  const effectivePlan    = sub?.effectivePlan   || 'free'
  const isTrialActive    = sub?.isTrialActive   || false
  const trialDaysLeft    = sub?.trialDaysLeft   || 0
  const trialExpired     = sub?.trialExpired    || false
  const canViewReports   = sub?.features?.reports  || false
  const canViewExpenses  = sub?.features?.expenses || false
  const invoiceLimit     = sub?.features?.invoiceLimit ?? 20
  const canCreateInvoice = invoiceLimit === null || (profile?.invoicesCount || 0) < invoiceLimit

  return (
    <SubscriptionContext.Provider value={{
      sub, loading: !profile, error: null,
      effectivePlan, isTrialActive, trialDaysLeft,
      trialExpired, canCreateInvoice, canViewReports, canViewExpenses,
      invoicesCount: profile?.invoicesCount || 0,
      invoiceLimit,
    }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) throw new Error('useSubscription must be inside SubscriptionProvider')
  return ctx
}
