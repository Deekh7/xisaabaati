import { useState, useEffect } from 'react';
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp, limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

// ---- INVOICES ----
export function useInvoices(limitCount = null) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let q = query(
      collection(db, 'invoices'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    if (limitCount) q = query(q, limit(limitCount));

    const unsub = onSnapshot(q, (snap) => {
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user, limitCount]);

  return { invoices, loading };
}

export function useCreateInvoice() {
  const { user } = useAuth();
  return async (data) => {
    return addDoc(collection(db, 'invoices'), {
      ...data,
      uid: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };
}

export function useUpdateInvoice() {
  return async (id, data) => {
    return updateDoc(doc(db, 'invoices', id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  };
}

export function useDeleteInvoice() {
  return async (id) => deleteDoc(doc(db, 'invoices', id));
}

// ---- CUSTOMERS ----
export function useCustomers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'customers'),
      where('uid', '==', user.uid),
      orderBy('name', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return { customers, loading };
}

export function useCreateCustomer() {
  const { user } = useAuth();
  return async (data) => {
    return addDoc(collection(db, 'customers'), {
      ...data,
      uid: user.uid,
      createdAt: serverTimestamp(),
    });
  };
}

export function useUpdateCustomer() {
  return async (id, data) => updateDoc(doc(db, 'customers', id), data);
}

export function useDeleteCustomer() {
  return async (id) => deleteDoc(doc(db, 'customers', id));
}
