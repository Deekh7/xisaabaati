import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import { useCustomers, useCreateInvoice, useUpdateInvoice, useCreateCustomer } from '../hooks/useFirestore'
import { generateInvoiceNumber, calcInvoiceTotal, formatCurrency, getBizConfig } from '../utils/helpers'

const emptyItem = () => ({ id: Date.now(), name: '', quantity: 1, price: '' })

export default function InvoiceModal({ invoice, onClose }) {
  const { t } = useLang()
  const { profile } = useAuth()
  const biz = getBizConfig(profile?.bizType)
  const { customers } = useCustomers()
  const createInvoice = useCreateInvoice()
  const updateInvoice = useUpdateInvoice()
  const createCustomer = useCreateCustomer()

  const isEdit = !!invoice

  const [form, setForm] = useState({
    invoiceNo: invoice?.invoiceNo || generateInvoiceNumber(),
    customerId: invoice?.customerId || '',
    customerName: invoice?.customerName || '',
    newCustomerName: '',
    newCustomerPhone: '',
    isNewCustomer: false,
    status: invoice?.status || 'unpaid',
    amountPaid: invoice?.amountPaid || 0,
    notes: invoice?.notes || '',
    items: invoice?.items?.length ? invoice.items : [emptyItem()],
  })

  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const setItem = (idx, field, value) => {
    setForm(f => {
      const items = [...f.items]
      items[idx] = { ...items[idx], [field]: value }
      return { ...f, items }
    })
  }

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, emptyItem()] }))

  const removeItem = (idx) =>
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))

  const total = calcInvoiceTotal(form.items)

  const handleCustomerChange = (e) => {
    const val = e.target.value
    if (val === '__new__') {
      setForm(f => ({ ...f, isNewCustomer: true, customerId: '', customerName: '' }))
    } else {
      const cust = customers.find(c => c.id === val)
      setForm(f => ({
        ...f,
        isNewCustomer: false,
        customerId: val,
        customerName: cust?.name || '',
      }))
    }
  }

  const handleSave = async () => {
    if (!form.customerName && !form.newCustomerName) {
      toast.error(t('required'))
      return
    }
    setSaving(true)
    try {
      let customerId = form.customerId
      let customerName = form.customerName

      if (form.isNewCustomer && form.newCustomerName) {
        const ref = await createCustomer({
          name: form.newCustomerName,
          phone: form.newCustomerPhone,
        })
        customerId = ref.id
        customerName = form.newCustomerName
      }

      const data = {
        invoiceNo: form.invoiceNo,
        customerId,
        customerName,
        status: form.status,
        amountPaid: parseFloat(form.amountPaid) || 0,
        notes: form.notes,
        items: form.items.filter(i => i.name || i.price),
        total,
      }

      if (isEdit) {
        await updateInvoice(invoice.id, data)
      } else {
        await createInvoice(data)
      }

      toast.success(t('success'))
      onClose()
    } catch (err) {
      console.error(err)
      toast.error(t('error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-header">
          <h3>{isEdit ? `Edit ${biz.docLabel}` : `Create ${biz.docLabel}`}</h3>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Invoice number */}
          <div className="form-group">
            <label className="form-label">{t('invoiceNo')}</label>
            <input
              className="form-input mono"
              value={form.invoiceNo}
              onChange={set('invoiceNo')}
            />
          </div>

          {/* Customer */}
          <div className="form-group">
            <label className="form-label">{biz.clientLabel}</label>
            <select
              className="form-select"
              value={form.isNewCustomer ? '__new__' : form.customerId}
              onChange={handleCustomerChange}
            >
              <option value="">{t('selectCustomer')}</option>
              <option value="__new__">+ {t('newCustomer')}</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.phone ? `· ${c.phone}` : ''}</option>
              ))}
            </select>
          </div>

          {form.isNewCustomer && (
            <div style={{ background: 'var(--green-ghost)', borderRadius: 'var(--radius)', padding: '14px', marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 10 }}>
                <label className="form-label">{t('customerName')}</label>
                <input
                  className="form-input"
                  value={form.newCustomerName}
                  onChange={set('newCustomerName')}
                  placeholder={t('customerName')}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('phone')}</label>
                <input
                  className="form-input"
                  value={form.newCustomerPhone}
                  onChange={set('newCustomerPhone')}
                  type="tel"
                  inputMode="tel"
                  placeholder="+252..."
                />
              </div>
            </div>
          )}

          {/* Items */}
          <div className="form-group">
            <label className="form-label">{biz.itemLabel}</label>

            {/* Quick Items — only when creating */}
            {!isEdit && biz.quickItems?.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>
                  Quick Add:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {biz.quickItems.map((qi) => (
                    <button
                      key={qi}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, items: [...f.items, { id: Date.now() + Math.random(), name: qi, quantity: 1, price: '' }] }))}
                      style={{
                        padding: '4px 10px', borderRadius: 99, border: `1.5px solid ${biz.color}22`,
                        background: biz.bg, color: biz.color, fontSize: '0.74rem', fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'var(--font-body)',
                      }}
                    >
                      + {qi}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>{t('itemName')}</th>
                  <th style={{ width: '20%' }}>{t('quantity')}</th>
                  <th style={{ width: '25%' }}>{t('price')}</th>
                  <th style={{ width: '10%' }}></th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        value={item.name}
                        onChange={e => setItem(idx, 'name', e.target.value)}
                        placeholder={t('itemName')}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => setItem(idx, 'quantity', e.target.value)}
                        min="1"
                        inputMode="numeric"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.price}
                        onChange={e => setItem(idx, 'price', e.target.value)}
                        placeholder="0"
                        inputMode="decimal"
                      />
                    </td>
                    <td>
                      {form.items.length > 1 && (
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 4 }}
                          onClick={() => removeItem(idx)}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 8 }}
              onClick={addItem}
            >
              <Plus size={16} /> {t('addItem')}
            </button>
          </div>

          {/* Total */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="total-row final">
              <span className="total-label">{t('total')}</span>
              <span className="total-value">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Status */}
          <div className="form-group">
            <label className="form-label">{t('status')}</label>
            <select className="form-select" value={form.status} onChange={set('status')}>
              <option value="unpaid">{t('unpaid')}</option>
              <option value="paid">{t('paid')}</option>
              <option value="partial">{t('partial')}</option>
            </select>
          </div>

          {form.status === 'partial' && (
            <div className="form-group">
              <label className="form-label">{t('amountPaid')}</label>
              <input
                className="form-input mono"
                type="number"
                value={form.amountPaid}
                onChange={set('amountPaid')}
                inputMode="decimal"
              />
              <div style={{ fontSize: '0.8rem', color: 'var(--red)', marginTop: 4 }}>
                {t('remaining')}: {formatCurrency(total - (parseFloat(form.amountPaid) || 0))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">{t('notes')}</label>
            <textarea
              className="form-textarea"
              value={form.notes}
              onChange={set('notes')}
              rows={2}
            />
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
