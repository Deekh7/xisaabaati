import { createContext, useContext, useState, useEffect, useRef } from 'react'

const AuthContext = createContext()

// Firebase modules are loaded lazily so they don't block the landing page.
// We cache the resolved modules here so we only import once.
let _firebase = null
async function getFirebase() {
  if (_firebase) return _firebase
  const [
    { auth, db, isFirebaseConfigured },
    { onAuthStateChanged, createUserWithEmailAndPassword,
      signInWithEmailAndPassword, signOut, updateProfile },
    { doc, setDoc, getDoc, updateDoc },
  ] = await Promise.all([
    import('../config/firebase'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ])
  _firebase = { auth, db, isFirebaseConfigured,
    onAuthStateChanged, createUserWithEmailAndPassword,
    signInWithEmailAndPassword, signOut, updateProfile,
    doc, setDoc, getDoc, updateDoc }
  return _firebase
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const unsubRef = useRef(null)

  useEffect(() => {
    // Import Firebase AFTER first render — keeps it out of the critical path
    getFirebase().then(({ auth, db, isFirebaseConfigured, onAuthStateChanged, doc, getDoc }) => {
      if (!isFirebaseConfigured || !auth) {
        setLoading(false)
        return
      }
      unsubRef.current = onAuthStateChanged(auth, async (firebaseUser) => {
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
    }).catch(() => setLoading(false))

    return () => { unsubRef.current?.() }
  }, [])

  const signup = async (email, password, displayName, businessName, businessType = 'shop') => {
    const {
      auth, db, isFirebaseConfigured,
      createUserWithEmailAndPassword, updateProfile, doc, setDoc,
    } = await getFirebase()
    if (!isFirebaseConfigured || !auth || !db) {
      throw new Error('Firebase is not configured. Set VITE_FIREBASE_* env vars in .env.')
    }
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
    const { auth, db, isFirebaseConfigured, signInWithEmailAndPassword, doc, getDoc } = await getFirebase()
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase is not configured. Set VITE_FIREBASE_* env vars in .env.')
    }
    const cred = await signInWithEmailAndPassword(auth, email, password)
    if (db) {
      try {
        const snap = await getDoc(doc(db, 'users', cred.user.uid))
        if (snap.exists()) setProfile(snap.data())
      } catch (e) { /* ignore */ }
    }
    return cred
  }

  const updateProfileData = async (data) => {
    if (!user) return
    const { db, doc, updateDoc } = await getFirebase()
    if (!db) return
    await updateDoc(doc(db, 'users', user.uid), data)
    setProfile((prev) => ({ ...prev, ...data }))
  }

  const logout = async () => {
    const { auth, signOut } = await getFirebase()
    if (!auth) return
    return signOut(auth)
  }

  const isAdmin    = profile?.role === 'admin'
  const rawType    = profile?.businessType || 'retail'
  const businessType = rawType === 'shop' ? 'retail' : rawType
  const planKey    = profile?.planKey || profile?.plan || 'free'
  const isFirebaseConfigured = Boolean(import.meta.env.VITE_FIREBASE_API_KEY)

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      signup, login, logout,
      updateProfileData,
      isAdmin, businessType, planKey,
      isFirebaseConfigured,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
