// SendViaWhatsApp.jsx — drop-in WhatsApp share sheet
// Usage: <SendViaWhatsApp invoice={inv} onClose={() => ...} />
import { useState, useMemo } from 'react'

function buildMessage(invoice, lang) {
  const USD = n => `$${Number(n || 0).toLocaleString()}`
  const itemLines = (invoice.items || []).filter(it => it.name).map(it => {
    const qty   = parseFloat(it.quantity || it.qty || 1)
    const price = parseFloat(it.price || 0)
    return `  • ${it.name} × ${qty}  →  ${USD(price * qty)}`
  }).join('\n')

  const statusLabels = {
    en: { paid: '✅ Paid', unpaid: '⏳ Unpaid', partial: '⚠️ Partial' },
    so: { paid: '✅ La bixiyay', unpaid: '⏳ La ma bixin', partial: '⚠️ Qayb' },
    ar: { paid: '✅ مدفوع', unpaid: '⏳ غير مدفوع', partial: '⚠️ جزئي' },
  }
  const st  = statusLabels[lang]?.[invoice.status] || invoice.status
  const biz = invoice.businessName || 'Xisaabaati'
  const no  = invoice.invoiceNo || invoice.no || '—'
  const name = invoice.customerName || invoice.customer || 'Customer'
  const note = invoice.notes

  const lines = {
    en: [`Hi ${name}! 👋`, ``, `Invoice from *${biz}*:`, ``, `🧾 *${no}*`, itemLines, `─────────────────`, `💰 *Total: ${USD(invoice.total)}*`, `📋 Status: ${st}`, note ? `📝 ${note}` : null, ``, `Thank you! 🙏`],
    so: [`Salaan ${name}! 👋`, ``, `Qaansheegad *${biz}*:`, ``, `🧾 *${no}*`, itemLines, `─────────────────`, `💰 *Wadarta: ${USD(invoice.total)}*`, `📋 Xaaladda: ${st}`, note ? `📝 ${note}` : null, ``, `Mahadsanid! 🙏`],
    ar: [`مرحباً ${name}! 👋`, ``, `فاتورة من *${biz}*:`, ``, `🧾 *${no}*`, itemLines, `─────────────────`, `💰 *الإجمالي: ${USD(invoice.total)}*`, `📋 الحالة: ${st}`, note ? `📝 ${note}` : null, ``, `شكراً لك! 🙏`],
  }
  return (lines[lang] || lines.en).filter(l => l !== null).join('\n')
}

const STYLES = `
.wa-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:700;display:flex;align-items:flex-end;justify-content:center;animation:waFade .2s ease}
@keyframes waFade{from{opacity:0}to{opacity:1}}
.wa-sheet{background:#fff;border-radius:22px 22px 0 0;width:100%;max-width:480px;max-height:92dvh;overflow-y:auto;padding-bottom:max(env(safe-area-inset-bottom,0px),24px);animation:waUp .28s cubic-bezier(.32,.72,0,1)}
@keyframes waUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.wa-handle{width:36px;height:4px;border-radius:2px;background:#e5e7eb;margin:13px auto 0}
.wa-hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 20px 12px;border-bottom:1px solid #f3f4f6}
.wa-hdr h3{font-size:.93rem;font-weight:800;color:#075e54;display:flex;align-items:center;gap:8px}
.wa-x{width:30px;height:30px;border-radius:8px;border:1.5px solid #e5e7eb;background:#f9fafb;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#6b7280;font-size:.85rem}
.wa-x:hover{background:#e5e7eb}
.wa-body{padding:18px}
.wa-langs{display:flex;gap:6px;margin-bottom:13px}
.wa-lang{padding:5px 13px;border-radius:99px;border:1.5px solid #e5e7eb;background:#fff;font-size:.76rem;font-weight:600;color:#6b7280;cursor:pointer;transition:all .15s;font-family:inherit}
.wa-lang.active{background:#075e54;border-color:#075e54;color:#fff}
.wa-field{margin-bottom:12px}
.wa-label{display:block;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af;margin-bottom:5px}
.wa-input{width:100%;padding:10px 13px;border:1.5px solid #e5e7eb;border-radius:10px;font-family:inherit;font-size:.9rem;color:#111;-webkit-appearance:none}
.wa-input:focus{outline:none;border-color:#25D366}
.wa-bubble{background:#e9fce9;border-radius:12px 12px 2px 12px;padding:12px 14px;border:1px solid #c9f0c9;margin-bottom:13px;max-height:220px;overflow-y:auto}
.wa-text{font-size:.82rem;line-height:1.55;color:#111;white-space:pre-wrap;word-break:break-word}
.wa-time{text-align:end;font-size:.62rem;color:#9cba9c;margin-top:5px;font-family:monospace}
.wa-send{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:14px;border-radius:13px;border:none;background:#25D366;color:#fff;font-family:inherit;font-size:.98rem;font-weight:800;cursor:pointer;margin-bottom:9px;box-shadow:0 3px 14px rgba(37,211,102,.3);transition:all .15s}
.wa-send:hover{background:#1ebe5d}
.wa-copy{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;padding:12px;border-radius:12px;border:1.5px solid #e5e7eb;background:#fff;font-family:inherit;font-size:.87rem;font-weight:700;color:#555;cursor:pointer;transition:all .15s}
.wa-copy.copied{border-color:#22c55e;color:#166534;background:#f0fdf4}
`

export default function SendViaWhatsApp({ invoice, onClose }) {
  const [lang, setLang]     = useState('en')
  const [phone, setPhone]   = useState(invoice.customerPhone || invoice.phone || '')
  const [copied, setCopied] = useState(false)

  const message = useMemo(() => buildMessage(invoice, lang), [invoice, lang])

  const send = () => {
    const cleaned = phone.replace(/[\s\-()]/g, '')
    const url = cleaned
      ? `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(message) } catch (_) {}
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <style>{STYLES}</style>
      <div className="wa-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="wa-sheet">
          <div className="wa-handle" />
          <div className="wa-hdr">
            <h3>
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <path d="M16 3C9.4 3 4 8.4 4 15c0 2.4.7 4.6 1.8 6.5L4 29l7.7-1.8A13 13 0 0 0 16 28c6.6 0 12-5.4 12-12S22.6 3 16 3z" fill="currentColor" fillOpacity=".3"/>
                <path d="M20.6 18.5c-.2.6-1.1 1.1-1.6 1.1-.4 0-.9.1-1.4-.1-.3-.1-.7-.2-1.3-.5-2.3-1-3.7-3.2-3.8-3.4-.1-.1-.9-1.2-.9-2.3 0-1.1.6-1.7.8-1.9.2-.2.4-.3.6-.3h.4c.1 0 .3-.1.5.4.2.5.6 1.6.7 1.7.1.1.1.2 0 .4-.1.1-.1.2-.2.4-.1.1-.2.3-.3.4-.1.1-.2.2-.1.5.1.2.6 1 1.3 1.6.9.8 1.6 1 1.8 1.1.2.1.4.1.5-.1.1-.1.6-.7.7-.9.2-.2.3-.2.5-.1.2.1 1.3.6 1.5.7.2.1.4.2.4.3.1.1.1.5-.1 1.1z" fill="currentColor"/>
              </svg>
              Send via WhatsApp
            </h3>
            <button className="wa-x" onClick={onClose}>✕</button>
          </div>
          <div className="wa-body">
            {/* Language */}
            <div className="wa-langs">
              {[['en','English'],['so','Soomaali'],['ar','عربي']].map(([code, label]) => (
                <button key={code} className={`wa-lang ${lang === code ? 'active' : ''}`} onClick={() => setLang(code)}>
                  {label}
                </button>
              ))}
            </div>
            {/* Phone */}
            <div className="wa-field">
              <label className="wa-label">Customer Phone (optional)</label>
              <input className="wa-input" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+252 61 234 5678" type="tel" inputMode="tel" />
            </div>
            {/* Message preview */}
            <label className="wa-label" style={{ display: 'block', marginBottom: 7 }}>Preview</label>
            <div className="wa-bubble">
              <div className="wa-text">{message}</div>
              <div className="wa-time">{timeStr} ✓✓</div>
            </div>
            {/* Actions */}
            <button className="wa-send" onClick={send}>
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <path d="M16 3C9.4 3 4 8.4 4 15c0 2.4.7 4.6 1.8 6.5L4 29l7.7-1.8A13 13 0 0 0 16 28c6.6 0 12-5.4 12-12S22.6 3 16 3z" fill="currentColor" fillOpacity=".3"/>
                <path d="M20.6 18.5c-.2.6-1.1 1.1-1.6 1.1-.4 0-.9.1-1.4-.1-.3-.1-.7-.2-1.3-.5-2.3-1-3.7-3.2-3.8-3.4-.1-.1-.9-1.2-.9-2.3 0-1.1.6-1.7.8-1.9.2-.2.4-.3.6-.3h.4c.1 0 .3-.1.5.4.2.5.6 1.6.7 1.7.1.1.1.2 0 .4-.1.1-.1.2-.2.4-.1.1-.2.3-.3.4-.1.1-.2.2-.1.5.1.2.6 1 1.3 1.6.9.8 1.6 1 1.8 1.1.2.1.4.1.5-.1.1-.1.6-.7.7-.9.2-.2.3-.2.5-.1.2.1 1.3.6 1.5.7.2.1.4.2.4.3.1.1.1.5-.1 1.1z" fill="currentColor"/>
              </svg>
              Open WhatsApp
            </button>
            <button className={`wa-copy ${copied ? 'copied' : ''}`} onClick={copy}>
              {copied ? '✅ Copied!' : '📋 Copy Message'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
