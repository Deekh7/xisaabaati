import { useState } from 'react'
import { Plus, Search, Pencil, Trash2, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer,
  useInvoices
} from '../hooks/useFirestore'
import { useLang } from '../context/LangContext'
import { formatCurrency } from '../utils/helpers'

function CustomerModal({ customer, onClose }) {
  const { t } = useLang()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const isEdit = !!customer

  const [form, setForm] = useState({ name: customer?.name || '', phone: customer?.phone || '' })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(t('required')); return }
    setSaving(true)
    try {
      if (isEdit) await updateCustomer(customer.id, form)
      else await createCustomer(form)
      toast.success(t('success'))
      onClose()
    } catch { toast.error(t('error')) }
    finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-header">
          <h3>{isEdit ? t('edit') : t('addCustomer')}</h3>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">{t('customerName')}</label>
            <input className="form-input" value={form.name} onChange={set('name')} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('phone')}</label>
            <input className="form-input" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} placeholder="+252..." />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost btn-full" onClick={onClose}>{t('cancel')}</button>
            <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}>
              {saving ? t('loading') : t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CustomersPage() {
  const { t } = useLang()
  const { customers, loading } = useCustomers()
  const { invoices } = useInvoices()
  const deleteCustomer = useDeleteCustomer()

  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editCustomer, setEditCustomer] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  // Compute per-customer stats from invoices
  const customerStats = customers.reduce((map, c) => {
    const custInvoices = invoices.filter(inv => inv.customerId === c.id)
    const total = custInvoices.reduce((s, inv) => s + (inv.total || 0), 0)
    const outstanding = custInvoices
      .filter(inv => inv.status !== 'paid')
      .reduce((s, inv) => s + ((inv.total || 0) - (inv.amountPaid || 0)), 0)
    map[c.id] = { total, outstanding }
    return map
  }, {})

  const filtered = customers.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  )

  const handleDelete = async (id) => {
    try {
      await deleteCustomer(id)
      toast.success(t('deleted'))
      setConfirmDelete(null)
    } catch { toast.error(t('error')) }
  }

  return (
    <div>
      <div className="page-header">
        <h2>{t('customers')}</h2>
      </div>

      <div className="search-bar">
        <Search />
        <input
          className="form-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('search')}
        />
      </div>

      {loading ? (
        <div className="spinner" />
      ) : filtered.length === 0 ? (
        <div className="empty-state"><p>{t('noCustomers')}</p></div>
      ) : (
        <div className="card-large" style={{ padding: '4px 16px' }}>
          {filtered.map(c => {
            const stats = customerStats[c.id] || {}
            return (
              <div key={c.id} className="invoice-item">
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: 'var(--green-pale)', color: 'var(--green-dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '1rem', flexShrink: 0
                }}>
                  {c.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="invoice-info">
                  <div className="invoice-customer">{c.name}</div>
                  {c.phone && (
                    <div className="invoice-meta" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Phone size={11} /> {c.phone}
                    </div>
                  )}
                  {stats.outstanding > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--red)', fontWeight: 600 }}>
                      ↑ {formatCurrency(stats.outstanding)} {t('outstanding')}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem' }}>
                    {formatCurrency(stats.total || 0)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--ink-4)' }}>{t('totalBusiness')}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button className="btn btn-icon btn-ghost btn-sm" onClick={() => { setEditCustomer(c); setShowModal(true) }}>
                    <Pencil size={15} />
                  </button>
                  <button
                    className="btn btn-icon btn-sm"
                    style={{ background: 'var(--red-pale)', color: 'var(--red)', border: 'none' }}
                    onClick={() => setConfirmDelete(c)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button className="fab" onClick={() => { setEditCustomer(null); setShowModal(true) }}>
        <Plus size={26} />
      </button>

      {showModal && (
        <CustomerModal customer={editCustomer} onClose={() => { setShowModal(false); setEditCustomer(null) }} />
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="confirm-dialog">
              <h3 style={{ color: 'var(--red)' }}>🗑️ {t('delete')}</h3>
              <p>{confirmDelete.name}</p>
              <div className="btn-row" style={{ marginTop: 20 }}>
                <button className="btn btn-ghost btn-full" onClick={() => setConfirmDelete(null)}>{t('cancel')}</button>
                <button className="btn btn-danger btn-full" onClick={() => handleDelete(confirmDelete.id)}>{t('delete')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
