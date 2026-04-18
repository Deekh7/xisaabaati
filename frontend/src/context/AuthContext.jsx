import { createContext, useContext, useState, useEffect } from 'react'

export function phoneToEmail(phone) {
  return phone.replace(/\D/g, '') + '@xisaabaati.app'
}
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../config/firebase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false)
      return
    }
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser && db) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
          if (snap.exists()) setProfile(snap.data())
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[auth] profile fetch failed:', err)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const requireFirebase = () => {
    if (!isFirebaseConfigured || !auth || !db) {
      throw new Error(
        'Firebase is not configured. Set VITE_FIREBASE_* env vars in .env.'
      )
    }
  }

  const signup = async (email, password, businessName, bizType = 'other') => {
    requireFirebase()
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: businessName })

    // 14-day trial starts NOW
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    // First registered account in an empty deployment becomes admin via
    // the VITE_BOOTSTRAP_ADMIN_EMAIL allowlist (set this in Vercel env to
    // your founding admin's email, e.g. you@xisaabaati.com).
    const bootstrapAdmin = (import.meta.env.VITE_BOOTSTRAP_ADMIN_EMAIL || '')
      .toLowerCase()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    const role = bootstrapAdmin.includes(email.toLowerCase()) ? 'admin' : 'user'

    const profileData = {
      businessName,
      email,
      bizType,
      role,
      currency: 'USD',
      plan: 'free',
      isTrialActive: true,
      trialEndsAt: trialEndsAt.toISOString(),
      invoicesCount: 0,
      extraUsers: 0,
      createdAt: new Date().toISOString(),
    }
    await setDoc(doc(db, 'users', cred.user.uid), profileData)
    setProfile(profileData)
    return cred.user
  }

  const login = (email, password) => {
    requireFirebase()
    return signInWithEmailAndPassword(auth, email, password)
  }

  // Firebase requires passwords of at least 6 characters.
  // A 4-digit PIN is padded to 6 chars by prepending zeros.
  const pinToPassword = (pin) => String(pin).padStart(6, '0')

  const phoneSignup = (phone, pin, businessName, bizType) => {
    return signup(phoneToEmail(phone), pinToPassword(pin), businessName, bizType)
  }

  const phoneLogin = (phone, pin) => {
    return login(phoneToEmail(phone), pinToPassword(pin))
  }

  const logout = () => {
    if (!auth) return Promise.resolve()
    return signOut(auth)
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signup, login, phoneSignup, phoneLogin, logout, isAdmin, isFirebaseConfigured }}
    >
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
