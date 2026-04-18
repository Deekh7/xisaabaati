import { useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { useProducts, useUpsertProduct, useDeleteProduct } from '../hooks/useFirestore'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'

const G = '#16a34a'
const fm = (n) => `$${Number(n || 0).toFixed(2)}`

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

const emptyForm = { name: '', cost: '', price: '', stock: '', category: '' }

export default function ProductsPage() {
  const { businessType } = useAuth()
  const { t } = useLang()
  const { products, loading } = useProducts()
  const upsertProduct = useUpsertProduct()
  const deleteProduct = useDeleteProduct()

  const [showForm, setShowForm]  = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm]           = useState(emptyForm)
  const [search, setSearch]       = useState('')
  const [saving, setSaving]       = useState(false)
  const [confirm, setConfirm]     = useState(null)

  const showStock = businessType !== 'services'
  const s = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setShowForm(true) }
  const openEdit = (p) => {
    setEditingId(p.id)
    setForm({ name: p.name, cost: p.cost, price: p.price, stock: p.stock ?? 0, category: p.category ?? '' })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error(t('required')); return }
    setSaving(true)
    try {
      await upsertProduct(form, editingId)
      toast.success(t('productSaved'))
      setShowForm(false)
    } catch (e) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = (id) => {
    setConfirm({
      message: t('confirmDelete'),
      onYes: async () => {
        try { await deleteProduct(id); toast.success(t('deleted')) }
        catch (e) { toast.error(e.message) }
        setConfirm(null)
      },
      onNo: () => setConfirm(null),
    })
  }

  const filtered = useMemo(() =>
    products.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()))
  , [products, search])

  const margin = (p) => p.price > 0 ? Math.round(((p.price - p.cost) / p.price) * 100) : 0

  const marginPreview = form.price && form.cost && Number(form.price) > 0
    ? { diff: Number(form.price) - Number(form.cost), pct: Math.round(((form.price - form.cost) / form.price) * 100) }
    : null

  return (
    <div>
      <ConfirmDialog open={!!confirm} message={confirm?.message} onYes={confirm?.onYes} onNo={confirm?.onNo} t={t} />

      {/* Header */}
      <div className="section-header">
        <h2 className="section-title">{t('products')}</h2>
        <button className="btn-primary" onClick={openAdd}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {t('addProduct')}
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
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </div>
            <p className="empty-text">{t('noData')}</p>
            <p className="empty-hint">{t('addFirstProduct')}</p>
            <button className="btn-primary" onClick={openAdd}>{t('addProduct')}</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((p) => (
            <div key={p.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</span>
                    {p.category && (
                      <span className="badge badge-gray">{p.category}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13, marginBottom: showStock ? 8 : 0 }}>
                    <span style={{ color: '#94a3b8' }}>{t('cost')}: <b style={{ color: '#64748b' }}>{fm(p.cost)}</b></span>
                    <span>{t('price')}: <b>{fm(p.price)}</b></span>
                    <span style={{ color: G, fontWeight: 700 }}>{margin(p)}%</span>
                  </div>
                  {showStock && (
                    <div className="stock-bar-wrap">
                      <span style={{ fontSize: 12, color: '#64748b' }}>{t('stock')}: <b>{p.stock ?? 0}</b></span>
                      <div className="stock-bar-bg">
                        <div
                          className={`stock-bar-fill${(p.stock ?? 0) < 10 ? ' low' : ''}`}
                          style={{ width: `${Math.min(((p.stock ?? 0) / 100) * 100, 100)}%` }}
                        />
                      </div>
                      {(p.stock ?? 0) < 10 && (
                        <span className="badge badge-amber" style={{ fontSize: 10 }}>Low</span>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                  <button className="btn-icon" onClick={() => openEdit(p)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button className="btn-danger" onClick={() => handleDelete(p.id)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? t('edit') : t('addProduct')}
      >
        <div className="form-group">
          <label className="form-label">{t('product')}</label>
          <input style={inp} value={form.name} onChange={s('name')} placeholder={t('product')} />
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">{t('cost')}</label>
            <input style={inp} type="number" step="0.01" value={form.cost} onChange={s('cost')} placeholder="0.00" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('price')}</label>
            <input style={inp} type="number" step="0.01" value={form.price} onChange={s('price')} placeholder="0.00" />
          </div>
        </div>

        {/* Margin preview */}
        {marginPreview && (
          <div className="profit-preview">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>{t('profitMargin')}</span>
              <span style={{ fontWeight: 700, color: G }}>
                {fm(marginPreview.diff)} ({marginPreview.pct}%)
              </span>
            </div>
          </div>
        )}

        <div className="form-grid-2">
          {showStock && (
            <div className="form-group">
              <label className="form-label">{t('stock')}</label>
              <input style={inp} type="number" value={form.stock} onChange={s('stock')} placeholder="0" />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">{t('category')}</label>
            <input style={inp} value={form.category} onChange={s('category')} placeholder={t('category')} />
          </div>
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
