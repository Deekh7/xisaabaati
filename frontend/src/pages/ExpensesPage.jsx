import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useExpenses, useCreateExpense, useDeleteExpense } from '../hooks/useFirestore'
import { useSubscription } from '../context/SubscriptionContext'
import { useLang } from '../context/LangContext'

const G = '#16a34a'
const fm = (n) => `$${Number(n || 0).toFixed(2)}`
const today = () => new Date().toISOString().split('T')[0]

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

export default function ExpensesPage() {
  const navigate = useNavigate()
  const { t } = useLang()
  const { effectivePlan } = useSubscription()
  const { expenses, loading } = useExpenses()
  const createExpense = useCreateExpense()
  const deleteExpense = useDeleteExpense()

  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '' })
  const [saving, setSaving] = useState(false)
  const s = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // Feature gate: only starter+ can track expenses
  const canUse = effectivePlan !== 'free'

  if (!canUse) {
    return (
      <div className="lock-screen">
        <div className="lock-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: 18 }}>{t('expenses')}</h3>
        <p style={{ color: '#64748b', marginBottom: 22, maxWidth: 280, margin: '0 auto 22px', lineHeight: 1.6 }}>
          {t('upgradeMsg')}
        </p>
        <button
          className="btn-primary"
          style={{ padding: '11px 28px' }}
          onClick={() => navigate('/app/payment')}
        >
          {t('upgrade')}
        </button>
      </div>
    )
  }

  const handleSave = async () => {
    if (!form.description || !form.amount) { toast.error(t('required')); return }
    setSaving(true)
    try {
      await createExpense(form)
      toast.success(t('expenseAdded'))
      setShowAdd(false)
      setForm({ description: '', amount: '' })
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    try { await deleteExpense(id); toast.success(t('deleted')) }
    catch (e) { toast.error(e.message) }
  }

  const todayExp = useMemo(() => expenses.filter((e) => e.date === today()), [expenses])
  const total = todayExp.reduce((a, e) => a + (e.amount || 0), 0)

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <h2 className="section-title">{t('expenses')}</h2>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {t('addExpense')}
        </button>
      </div>

      {/* Today total */}
      <div className="card card-amber" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#92400e', marginBottom: 4 }}>{t('expenses_today_full')}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#c2410c' }}>{fm(total)}</div>
      </div>

      {/* List */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : todayExp.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.5">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <p className="empty-text">{t('noData')}</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {todayExp.map((e) => (
            <div key={e.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{e.description}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{e.time}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 700, color: '#c2410c', fontSize: 15 }}>{fm(e.amount)}</span>
                <button className="btn-danger" onClick={() => handleDelete(e.id)}>
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

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={t('addExpense')}>
        <div className="form-group">
          <label className="form-label">{t('description')}</label>
          <input style={inp} value={form.description} onChange={s('description')} placeholder={t('description')} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('amount')}</label>
          <input style={inp} type="number" step="0.01" value={form.amount} onChange={s('amount')} placeholder="0.00" />
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>{t('cancel')}</button>
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
