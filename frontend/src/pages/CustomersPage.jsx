import { useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import {
  useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer,
} from '../hooks/useFirestore'
import { useLang } from '../context/LangContext'

const G = '#16a34a'
const fm = (n) => `$${Number(n || 0).toFixed(2)}`

const inp = {
  width: '100%', padding: '12px 14px',
  border: '1.5px solid #e2e8f0', borderRadius: 12,
  fontSize: 14, outline: 'none', background: '#fff',
  fontFamily: 'inherit', color: '#1e293b',
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="btn-icon" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

function ConfirmDialog({ open, message, onYes, onNo, t }) {
  if (!open) return null
  return (
    <div className="confirm-overlay">
      <div className="confirm-box">
        <div className="confirm-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 20, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onNo} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#64748b' }}>{t('no')}</button>
          <button onClick={onYes} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>{t('yes')}</button>
        </div>
      </div>
    </div>
  )
}

const emptyForm = { name: '', phone: '', email: '' }

export default function CustomersPage() {
  const { t } = useLang()
  const { customers, loading } = useCustomers()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()

  const [search, setSearch]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]   = useState(null)
  const [form, setForm]       = useState(emptyForm)
  const [saving, setSaving]   = useState(false)
  const [confirm, setConfirm] = useState(null)
  const s = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (c) => { setEditId(c.id); setForm({ name: c.name || '', phone: c.phone || '', email: c.email || '' }); setShowForm(true) }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(t('required')); return }
    setSaving(true)
    try {
      if (editId) await updateCustomer(editId, form)
      else await createCustomer(form)
      toast.success(t('success'))
      setShowForm(false)
    } catch { toast.error(t('error')) }
    finally { setSaving(false) }
  }

  const handleDelete = (c) => {
    setConfirm({
      message: t('confirmDelete'),
      onYes: async () => {
        try { await deleteCustomer(c.id); toast.success(t('deleted')) }
        catch { toast.error(t('error')) }
        setConfirm(null)
      },
      onNo: () => setConfirm(null),
    })
  }

  const filtered = useMemo(() =>
    customers.filter((c) =>
      !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
    )
  , [customers, search])

  return (
    <div>
      <ConfirmDialog open={!!confirm} message={confirm?.message} onYes={confirm?.onYes} onNo={confirm?.onNo} t={t} />

      {/* Header */}
      <div className="section-header">
        <h2 className="section-title">{t('customers')}</h2>
        <button className="btn-primary" onClick={openAdd}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {t('addCustomer')}
        </button>
      </div>

      {/* Search */}
      <div className="search-wrap">
        <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="search-input"
          style={inp}
          placeholder={t('search') + '...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p className="empty-text">{t('noCustomers')}</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((c) => (
            <div key={c.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: '#f0fdf4', color: G,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 16, flexShrink: 0,
              }}>
                {(c.name || '?')[0].toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                {c.phone && (
                  <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18H6.6a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/>
                    </svg>
                    {c.phone}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-icon" onClick={() => openEdit(c)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button className="btn-danger" onClick={() => handleDelete(c)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? t('edit') : t('addCustomer')}
      >
        <div className="form-group">
          <label className="form-label">{t('customerName')}</label>
          <input style={inp} value={form.name} onChange={s('name')} placeholder={t('customerName')} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('phone')}</label>
          <input style={inp} type="tel" value={form.phone} onChange={s('phone')} placeholder="+252..." />
        </div>
        <div className="form-group">
          <label className="form-label">{t('email')}</label>
          <input style={inp} type="email" value={form.email} onChange={s('email')} placeholder="example@email.com" />
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={() => setShowForm(false)}>{t('cancel')}</button>
          <button
            className="btn-primary"
            style={{ flex: 2, padding: '13px 0', justifyContent: 'center', fontSize: 15, fontWeight: 700, opacity: saving ? 0.7 : 1 }}
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? '...' : `✓ ${t('save')}`}
          </button>
        </div>
      </Modal>
    </div>
  )
}
