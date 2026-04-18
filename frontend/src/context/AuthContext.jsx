import { createContext, useContext, useState, useEffect } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
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
      throw new Error('Firebase is not configured. Set VITE_FIREBASE_* env vars in .env.')
    }
  }

  const signup = async (email, password, displayName, businessName, businessType = 'shop') => {
    requireFirebase()
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: displayName || businessName })

    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    const bootstrapAdmin = (import.meta.env.VITE_BOOTSTRAP_ADMIN_EMAIL || '')
      .toLowerCase().split(',').map((s) => s.trim()).filter(Boolean)
    const role = bootstrapAdmin.includes(email.toLowerCase()) ? 'admin' : 'user'

    const profileData = {
      displayName: displayName || businessName,
      businessName,
      businessType,
      email,
      role,
      currency: 'USD',
      plan: 'free',
      planKey: 'free',
      isTrialActive: true,
      trialEndsAt: trialEndsAt.toISOString(),
      salesCount: 0,
      invoicesCount: 0,
      createdAt: new Date().toISOString(),
    }
    await setDoc(doc(db, 'users', cred.user.uid), profileData)
    setProfile(profileData)
    return cred.user
  }

  const login = async (email, password) => {
    requireFirebase()
    const cred = await signInWithEmailAndPassword(auth, email, password)
    // refresh profile after login
    if (db) {
      try {
        const snap = await getDoc(doc(db, 'users', cred.user.uid))
        if (snap.exists()) setProfile(snap.data())
      } catch (e) { /* ignore */ }
    }
    return cred
  }

  const updateProfileData = async (data) => {
    if (!user || !db) return
    await updateDoc(doc(db, 'users', user.uid), data)
    setProfile((prev) => ({ ...prev, ...data }))
  }

  const logout = () => {
    if (!auth) return Promise.resolve()
    return signOut(auth)
  }

  const isAdmin = profile?.role === 'admin'
  const businessType = profile?.businessType || 'shop'
  const planKey = profile?.planKey || profile?.plan || 'free'

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      signup, login, logout,
      updateProfileData,
      isAdmin, businessType, planKey,
      isFirebaseConfigured,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
