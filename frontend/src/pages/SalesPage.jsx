import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useSales, useCreateSale, useDeleteSale, useProducts } from '../hooks/useFirestore'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../context/SubscriptionContext'
import { useLang } from '../context/LangContext'

const G = '#16a34a'
const GL = '#f0fdf4'
const fm = (n) => `$${Number(n || 0).toFixed(2)}`
const today = () => new Date().toISOString().split('T')[0]

const inp = {
  width: '100%', padding: '12px 14px',
  border: '1.5px solid #e2e8f0', borderRadius: 12,
  fontSize: 14, outline: 'none', background: '#fff',
  fontFamily: 'inherit', color: '#1e293b',
  WebkitAppearance: 'none', appearance: 'none',
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
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

export default function SalesPage() {
  const navigate = useNavigate()
  const { businessType } = useAuth()
  const { effectivePlan, canCreateInvoice } = useSubscription()
  const { t } = useLang()
  const { sales, loading } = useSales()
  const { products } = useProducts()
  const createSale = useCreateSale()
  const deleteSale = useDeleteSale()

  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ productId: '', qty: 1, customName: '', customPrice: '' })
  const [liveProfit, setLiveProfit] = useState(null)

  const set = (k) => (v) => {
    const val = typeof v === 'string' ? v : v?.target?.value ?? v
    const next = { ...form, [k]: val }
    setForm(next)
    const selP = products.find((p) => p.id === next.productId)
    const sp = selP ? selP.price : Number(next.customPrice) || 0
    const sc = selP ? selP.cost : 0
    const q = Number(next.qty) || 1
    const profit = (sp - sc) * q
    setLiveProfit(sp ? { total: sp * q, profit, sp, sc } : null)
  }

  const handleAdd = async () => {
    if (!canCreateInvoice) { navigate('/app/payment'); return }
    const selP = products.find((p) => p.id === form.productId)
    const sp = selP ? selP.price : Number(form.customPrice) || 0
    const sc = selP ? selP.cost : 0
    const q = Number(form.qty) || 1
    const name = selP ? selP.name : form.customName
    if (!name || !sp) { toast.error(t('required')); return }

    setSubmitting(true)
    try {
      await createSale({
        product: name,
        productId: form.productId || null,
        qty: q,
        price: sp,
        cost: sc,
        profit: (sp - sc) * q,
      })
      toast.success(t('saleAdded'))
      setShowAdd(false)
      setForm({ productId: '', qty: 1, customName: '', customPrice: '' })
      setLiveProfit(null)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const quickSale = async (p) => {
    if (!canCreateInvoice) { navigate('/app/payment'); return }
    try {
      await createSale({ product: p.name, productId: p.id, qty: 1, price: p.price, cost: p.cost, profit: p.price - p.cost })
      toast.success(t('saleAdded'))
    } catch (e) { toast.error(e.message) }
  }

  const handleDelete = async (id) => {
    try { await deleteSale(id); toast.success(t('deleted')) }
    catch (e) { toast.error(e.message) }
  }

  const todaySales = useMemo(() => sales.filter((s) => s.date === today()), [sales])
  const filtered = useMemo(() =>
    todaySales.filter((s) => s.product?.toLowerCase().includes(search.toLowerCase()))
  , [todaySales, search])

  const totSales  = todaySales.reduce((a, s) => a + (s.price || 0) * (s.qty || 1), 0)
  const totProfit = todaySales.reduce((a, s) => a + (s.profit || 0), 0)

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <h2 className="section-title">{t('sales')}</h2>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {t('addSale')}
        </button>
      </div>

      {/* Summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">{t('totalSales')}</div>
          <div className="stat-value">{fm(totSales)}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">{t('todayProfit')}</div>
          <div className="stat-value green">{fm(totProfit)}</div>
        </div>
      </div>

      {/* Quick tap grid for restaurant */}
      {businessType === 'restaurant' && products.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('quickSale')}
          </div>
          <div className="quick-sale-grid">
            {products.slice(0, 8).map((p) => (
              <button key={p.id} className="quick-sale-btn" onClick={() => quickSale(p)}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name?.split('/')[0]?.trim()}
                </div>
                <div style={{ fontSize: 12, color: G, fontWeight: 600 }}>{fm(p.price)}</div>
              </button>
            ))}
          </div>
        </div>
      )}

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
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={G} strokeWidth="1.5">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                </svg>
              </div>
              <p className="empty-text">{t('noData')}</p>
              <p className="empty-hint">{t('startSelling')}</p>
            </div>
          ) : (
            filtered.map((s) => (
              <div key={s.id} className="list-item">
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{s.product}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    {s.time} · ×{s.qty || 1}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{fm((s.price || 0) * (s.qty || 1))}</div>
                    <div style={{ fontWeight: 700, color: G, fontSize: 14 }}>{fm(s.profit)}</div>
                  </div>
                  <button className="btn-danger" onClick={() => handleDelete(s.id)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={t('addSale')}>
        {/* Product select */}
        <div className="form-group">
          <label className="form-label">{t('selectProduct')}</label>
          <select style={inp} value={form.productId} onChange={set('productId')}>
            <option value="">{t('selectProduct')}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} — {fm(p.price)}</option>
            ))}
          </select>
        </div>

        {/* Custom fields if no product selected */}
        {!form.productId && (
          <>
            <div className="form-group">
              <label className="form-label">{t('product')}</label>
              <input style={inp} value={form.customName} onChange={set('customName')} placeholder={t('product')} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('price')}</label>
              <input style={inp} type="number" step="0.01" value={form.customPrice} onChange={set('customPrice')} placeholder="0.00" />
            </div>
          </>
        )}

        {/* Qty stepper */}
        <div className="form-group">
          <label className="form-label">{t('qty')}</label>
          <div className="qty-stepper">
            <button className="qty-btn" onClick={() => set('qty')(Math.max(1, Number(form.qty) - 1))}>−</button>
            <input className="qty-input" style={inp} type="number" value={form.qty} onChange={set('qty')} />
            <button className="qty-btn plus" onClick={() => set('qty')(Number(form.qty) + 1)}>+</button>
          </div>
        </div>

        {/* Live profit preview */}
        {liveProfit && (
          <div className="profit-preview">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>{t('totalSales')}</span>
              <span style={{ fontWeight: 600 }}>{fm(liveProfit.total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>{t('profit')}</span>
              <span style={{ fontWeight: 800, color: G, fontSize: 20 }}>{fm(liveProfit.profit)}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>{t('cancel')}</button>
          <button
            className="btn-primary"
            style={{ flex: 2, padding: '13px 0', justifyContent: 'center', fontSize: 15, fontWeight: 700, opacity: submitting ? 0.7 : 1 }}
            disabled={submitting}
            onClick={handleAdd}
          >
            {submitting ? '...' : `✓ ${t('save')}`}
          </button>
        </div>
      </Modal>
    </div>
  )
}
