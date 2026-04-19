import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, where, onSnapshot, getDocs,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

const today = () => new Date().toISOString().split('T')[0];
const tnow = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// Sort by createdAt descending (client-side — avoids composite index requirement)
const byCreatedDesc = (a, b) => {
  const ta = a.createdAt?.seconds ?? 0;
  const tb = b.createdAt?.seconds ?? 0;
  return tb - ta;
};

// Fallback: if onSnapshot fails (e.g. network error / 503), do a one-time getDocs read
async function fallbackGetDocs(q) {
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── SALES ────────────────────────────────────────────────────
export function useSales(limitCount = null) {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) return;
    const q = query(
      collection(db, 'sales'),
      where('uid', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort(byCreatedDesc);
      if (limitCount) docs = docs.slice(0, limitCount);
      setSales(docs);
      setLoading(false);
    }, async () => {
      // Listener failed — fall back to one-time read
      try {
        let docs = await fallbackGetDocs(q);
        docs.sort(byCreatedDesc);
        if (limitCount) docs = docs.slice(0, limitCount);
        setSales(docs);
      } catch {}
      setLoading(false);
    });
    return unsub;
  }, [user, limitCount]);

  return { sales, loading };
}

export function useCreateSale() {
  const { user } = useAuth();
  return useCallback(async (data) => {
    return addDoc(collection(db, 'sales'), {
      ...data,
      uid: user.uid,
      date: today(),
      time: tnow(),
      createdAt: serverTimestamp(),
    });
  }, [user]);
}

export function useDeleteSale() {
  return useCallback(async (id) => deleteDoc(doc(db, 'sales', id)), []);
}

// ─── PRODUCTS ─────────────────────────────────────────────────
export function useProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) return;
    const q = query(
      collection(db, 'products'),
      where('uid', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort(byCreatedDesc);
      setProducts(docs);
      setLoading(false);
    }, async () => {
      // Listener failed — fall back to one-time read
      try {
        const docs = await fallbackGetDocs(q);
        docs.sort(byCreatedDesc);
        setProducts(docs);
      } catch {}
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return { products, loading };
}

export function useUpsertProduct() {
  const { user } = useAuth();
  return useCallback(async (data, editingId = null) => {
    const payload = {
      name: data.name,
      cost: Number(data.cost) || 0,
      price: Number(data.price) || 0,
      stock: Number(data.stock) || 0,
      category: data.category || '',
      uid: user.uid,
    };
    if (editingId) {
      await updateDoc(doc(db, 'products', editingId), { ...payload, updatedAt: serverTimestamp() });
      return { id: editingId, ...payload };
    } else {
      const ref = await addDoc(collection(db, 'products'), { ...payload, createdAt: serverTimestamp() });
      return { id: ref.id, ...payload };
    }
  }, [user]);
}

export function useUpdateProductStock() {
  return useCallback(async (productId, newStock) => {
    await updateDoc(doc(db, 'products', productId), { stock: newStock, updatedAt: serverTimestamp() });
  }, []);
}

export function useDeleteProduct() {
  return useCallback(async (id) => deleteDoc(doc(db, 'products', id)), []);
}

// ─── EXPENSES ─────────────────────────────────────────────────
export function useExpenses(limitCount = null) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) return;
    const q = query(
      collection(db, 'expenses'),
      where('uid', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort(byCreatedDesc);
      if (limitCount) docs = docs.slice(0, limitCount);
      setExpenses(docs);
      setLoading(false);
    }, async () => {
      try {
        let docs = await fallbackGetDocs(q);
        docs.sort(byCreatedDesc);
        if (limitCount) docs = docs.slice(0, limitCount);
        setExpenses(docs);
      } catch {}
      setLoading(false);
    });
    return unsub;
  }, [user, limitCount]);

  return { expenses, loading };
}

export function useCreateExpense() {
  const { user } = useAuth();
  return useCallback(async (data) => {
    return addDoc(collection(db, 'expenses'), {
      description: data.description,
      amount: Number(data.amount) || 0,
      uid: user.uid,
      date: today(),
      time: tnow(),
      createdAt: serverTimestamp(),
    });
  }, [user]);
}

export function useDeleteExpense() {
  return useCallback(async (id) => deleteDoc(doc(db, 'expenses', id)), []);
}

// ─── CUSTOMERS ────────────────────────────────────────────────
export function useCustomers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) return;
    const q = query(
      collection(db, 'customers'),
      where('uid', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setCustomers(docs);
      setLoading(false);
    }, async () => {
      try {
        const docs = await fallbackGetDocs(q);
        docs.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setCustomers(docs);
      } catch {}
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return { customers, loading };
}

export function useCreateCustomer() {
  const { user } = useAuth();
  return useCallback(async (data) => {
    return addDoc(collection(db, 'customers'), {
      ...data,
      uid: user.uid,
      createdAt: serverTimestamp(),
    });
  }, [user]);
}

export function useUpdateCustomer() {
  return useCallback(async (id, data) => updateDoc(doc(db, 'customers', id), data), []);
}

export function useDeleteCustomer() {
  return useCallback(async (id) => deleteDoc(doc(db, 'customers', id)), []);
}

// ─── INVOICES (legacy — kept for backward compat) ─────────────
export function useInvoices(limitCount = null) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) return;
    const q = query(
      collection(db, 'invoices'),
      where('uid', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort(byCreatedDesc);
      if (limitCount) docs = docs.slice(0, limitCount);
      setInvoices(docs);
      setLoading(false);
    }, async () => {
      try {
        let docs = await fallbackGetDocs(q);
        docs.sort(byCreatedDesc);
        if (limitCount) docs = docs.slice(0, limitCount);
        setInvoices(docs);
      } catch {}
      setLoading(false);
    });
    return unsub;
  }, [user, limitCount]);

  return { invoices, loading };
}

export function useCreateInvoice() {
  const { user } = useAuth();
  return useCallback(async (data) => {
    return addDoc(collection(db, 'invoices'), {
      ...data,
      uid: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }, [user]);
}

export function useUpdateInvoice() {
  return useCallback(async (id, data) => {
    return updateDoc(doc(db, 'invoices', id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }, []);
}

export function useDeleteInvoice() {
  return useCallback(async (id) => deleteDoc(doc(db, 'invoices', id)), []);
}
