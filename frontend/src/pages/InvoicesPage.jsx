import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useInvoices, useDeleteInvoice } from '../hooks/useFirestore'
import { useLang }         from '../context/LangContext'
import { useSubscription } from '../context/SubscriptionContext'
import { useLimitGuard }   from '../hooks/useLimitGuard'
import { formatCurrency, formatDate, getStatusColor } from '../utils/helpers'
import InvoiceModal    from '../components/InvoiceModal'
import SendViaWhatsApp from '../components/SendViaWhatsApp'

export default function InvoicesPage() {
  const { t, lang }   = useLang()
  const { invoices, loading } = useInvoices()
  const deleteInvoice = useDeleteInvoice()
  const location      = useLocation()
  const { invoicesCount, invoiceLimit } = useSubscription()
  const { guard, PaywallGate } = useLimitGuard()

  const [search, setSearch]         = useState('')
  const [showModal, setShowModal]   = useState(false)
  const [editInvoice, setEditInvoice] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [statusFilter, setStatusFilter]   = useState('all')
  const [waInvoice, setWaInvoice]   = useState(null) // WhatsApp preview

  useEffect(() => {
    if (location.state?.create) guard('invoice', () => setShowModal(true))
  }, [location.state])

  const filtered = invoices.filter(inv => {
    const matchSearch = !search ||
      inv.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNo?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerPhone?.includes(search)
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchSearch && matchStatus
  })

  const handleDelete = async (id) => {
    try { await deleteInvoice(id); toast.success(t('deleted')) }
    catch { toast.error(t('error')) }
    setConfirmDelete(null)
  }

  const openEdit = (inv) => { setEditInvoice(inv); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditInvoice(null) }

  const statusFilters = ['all', 'paid', 'unpaid', 'partial']

  // Usage progress bar (only visible on Free plan)
  const showUsage = invoiceLimit !== null
  const usagePct  = showUsage ? Math.min((invoicesCount / invoiceLimit) * 100, 100) : 0

  return (
    <div>
      <div className="page-header">
        <h2>{t('invoices')}</h2>
        {showUsage && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--ink-3)', marginBottom: 4 }}>
              <span>{invoicesCount} / {invoiceLimit} invoices used</span>
              {invoicesCount >= invoiceLimit && (
                <span style={{ color: 'var(--red)', fontWeight: 700 }}>Limit reached</span>
              )}
            </div>
            <div style={{ height: 6, background: 'var(--paper-3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3, transition: 'width 0.4s',
                width: `${usagePct}%`,
                background: usagePct >= 100 ? 'var(--red)' : usagePct >= 80 ? '#f59e0b' : 'var(--green-light)',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="search-bar">
        <Search />
        <input className="form-input" value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('search')} />
      </div>

      {/* Status pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {statusFilters.map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} style={{
            padding: '6px 14px', borderRadius: 20, border: '1.5px solid',
            borderColor: statusFilter === f ? 'var(--green-dark)' : 'var(--paper-3)',
            background:  statusFilter === f ? 'var(--green-dark)' : '#fff',
            color:       statusFilter === f ? '#fff' : 'var(--ink-3)',
            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            fontFamily: 'var(--font-body)',
          }}>
            {f === 'all' ? '— All' : t(f)}
          </button>
        ))}
      </div>

      {/* Invoice list */}
      {loading ? (
        <div className="spinner" />
      ) : filtered.length === 0 ? (
        <div className="empty-state"><p>{t('noInvoices')}</p></div>
      ) : (
        <div className="card-large" style={{ padding: '4px 16px' }}>
          {filtered.map(inv => (
            <div key={inv.id} className="invoice-item">
              <div className="invoice-status-dot" style={{ background: getStatusColor(inv.status) }} />
              <div className="invoice-info">
                <div className="invoice-customer">{inv.customerName || '—'}</div>
                <div className="invoice-meta">{inv.invoiceNo} · {formatDate(inv.createdAt, lang)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <div className="invoice-amount">{formatCurrency(inv.total)}</div>
                <span className={`badge badge-${inv.status}`}>{t(inv.status)}</span>
              </div>
              {/* Row actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button className="btn btn-icon btn-ghost btn-sm" onClick={() => openEdit(inv)} title={t('edit')}>
                  <Pencil size={15} />
                </button>
                {/* WhatsApp button */}
                <button className="btn btn-icon btn-sm" title="Send via WhatsApp"
                  style={{ background: '#dcfce7', color: '#15803d', border: '1.5px solid #bbf7d0' }}
                  onClick={() => setWaInvoice(inv)}>
                  <svg width="15" height="15" viewBox="0 0 32 32" fill="none">
                    <path d="M16 3C9.4 3 4 8.4 4 15c0 2.4.7 4.6 1.8 6.5L4 29l7.7-1.8A13 13 0 0 0 16 28c6.6 0 12-5.4 12-12S22.6 3 16 3z" fill="currentColor" fillOpacity=".3"/>
                    <path d="M20.6 18.5c-.2.6-1.1 1.1-1.6 1.1-.4 0-.9.1-1.4-.1-.3-.1-.7-.2-1.3-.5-2.3-1-3.7-3.2-3.8-3.4-.1-.1-.9-1.2-.9-2.3 0-1.1.6-1.7.8-1.9.2-.2.4-.3.6-.3h.4c.1 0 .3-.1.5.4.2.5.6 1.6.7 1.7.1.1.1.2 0 .4-.1.1-.1.2-.2.4-.1.1-.2.3-.3.4-.1.1-.2.2-.1.5.1.2.6 1 1.3 1.6.9.8 1.6 1 1.8 1.1.2.1.4.1.5-.1.1-.1.6-.7.7-.9.2-.2.3-.2.5-.1.2.1 1.3.6 1.5.7.2.1.4.2.4.3.1.1.1.5-.1 1.1z" fill="currentColor"/>
                  </svg>
                </button>
                <button className="btn btn-icon btn-sm" title={t('delete')}
                  style={{ background: 'var(--red-pale)', color: 'var(--red)', border: 'none' }}
                  onClick={() => setConfirmDelete(inv)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB — guarded by limit */}
      <button className="fab" onClick={() => guard('invoice', () => setShowModal(true))}>
        <Plus size={26} />
      </button>

      {/* Invoice form modal */}
      {showModal && <InvoiceModal invoice={editInvoice} onClose={closeModal} />}

      {/* WhatsApp sheet */}
      {waInvoice && <SendViaWhatsApp invoice={waInvoice} onClose={() => setWaInvoice(null)} />}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="confirm-dialog">
              <h3 style={{ color: 'var(--red)' }}>🗑️ {t('delete')}</h3>
              <p>{t('deleteConfirm')}</p>
              <p style={{ fontWeight: 700 }}>{confirmDelete.invoiceNo} — {confirmDelete.customerName}</p>
              <div className="btn-row" style={{ marginTop: 20 }}>
                <button className="btn btn-ghost btn-full" onClick={() => setConfirmDelete(null)}>{t('cancel')}</button>
                <button className="btn btn-danger btn-full" onClick={() => handleDelete(confirmDelete.id)}>{t('delete')}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paywall gate — renders when guard blocks */}
      <PaywallGate />
    </div>
  )
}
