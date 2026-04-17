// TeamPage.jsx — Multi-user invite management
// Accessible when plan === 'pro' with extraUsers > 0
import { useState } from 'react'
import { useSubscription } from '../context/SubscriptionContext'
import { useLimitGuard }   from '../hooks/useLimitGuard'
import toast from 'react-hot-toast'

export default function TeamPage() {
  const { effectivePlan, sub, upgradePlan } = useSubscription()
  const { openPaywall } = useLimitGuard()

  const extraUsers = sub?.extraUsers || 0
  const canMultiUser = effectivePlan === 'pro' && extraUsers > 0

  const [members, setMembers] = useState([])
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole]   = useState('staff')
  const [sending, setSending] = useState(false)

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return
    setSending(true)
    await new Promise(r => setTimeout(r, 800))
    setMembers(p => [...p, { id: Date.now(), email: inviteEmail, role: inviteRole, status: 'pending' }])
    toast.success(`Invite sent to ${inviteEmail}`)
    setInviteEmail(''); setInviteRole('staff'); setShowInvite(false)
    setSending(false)
  }

  const removeMember = (id) => { setMembers(p => p.filter(m => m.id !== id)); toast.success('Member removed') }

  if (!canMultiUser) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 20px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>👥</div>
        <h2 style={{ marginBottom: 8, color: 'var(--green-dark)' }}>Multi-User — Pro Only</h2>
        <p style={{ color: 'var(--ink-3)', fontSize: '.88rem', marginBottom: 10 }}>
          Invite your team members to collaborate on invoices and customers.
        </p>
        <p style={{ color: 'var(--ink-3)', fontSize: '.83rem', marginBottom: 28 }}>
          Extra users are <strong>$2.5 / user / month</strong> on the Pro plan.
        </p>
        <button className="btn btn-primary btn-lg btn-full" onClick={() => openPaywall('reports')}>
          ✦ Upgrade to Pro — $25/mo
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row' }}>
        <h2>Team</h2>
        <div style={{ fontSize: '.75rem', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
          {members.length} / {extraUsers} seats used
        </div>
      </div>

      {/* Seats bar */}
      <div style={{ background: '#fff', border: '1.5px solid var(--paper-3)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: 8 }}>
          <span style={{ color: 'var(--ink-3)' }}>Team seats</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{members.length}/{extraUsers}</span>
        </div>
        <div style={{ height: 6, background: 'var(--paper-3)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 3, background: members.length >= extraUsers ? 'var(--red)' : 'var(--green-light)', width: `${Math.min((members.length / extraUsers) * 100, 100)}%`, transition: 'width .3s' }} />
        </div>
        {members.length >= extraUsers && (
          <p style={{ fontSize: '.75rem', color: 'var(--red)', marginTop: 6 }}>
            All seats used. Upgrade to add more users.
          </p>
        )}
      </div>

      {/* Member list */}
      {members.length > 0 && (
        <div className="card-large" style={{ padding: '4px 16px', marginBottom: 16 }}>
          {members.map(m => (
            <div key={m.id} className="invoice-item">
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--green-pale)', color: 'var(--green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.85rem', flexShrink: 0 }}>
                {m.email[0].toUpperCase()}
              </div>
              <div className="invoice-info">
                <div className="invoice-customer" style={{ fontFamily: 'var(--font-mono)', fontSize: '.82rem' }}>{m.email}</div>
                <div className="invoice-meta">{m.role} · {m.status}</div>
              </div>
              <span className="badge" style={m.status === 'pending' ? { background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' } : { background: 'var(--green-pale)', color: 'var(--green-dark)', border: '1px solid var(--green-light)' }}>
                {m.status}
              </span>
              <button className="btn btn-sm" style={{ background: '#fef2f2', color: 'var(--red)', border: '1.5px solid #fecaca', padding: '6px 10px' }}
                onClick={() => removeMember(m.id)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {members.length === 0 && !showInvite && (
        <div className="empty-state" style={{ marginBottom: 16 }}>
          <p>No team members yet. Invite someone to get started.</p>
        </div>
      )}

      {/* Invite form */}
      {showInvite ? (
        <div className="card" style={{ padding: 16 }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@example.com" inputMode="email" />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
              <option value="staff">Staff — view & create invoices</option>
              <option value="manager">Manager — full access except admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost btn-full" onClick={() => setShowInvite(false)}>Cancel</button>
            <button className="btn btn-primary btn-full" onClick={sendInvite} disabled={sending || !inviteEmail.trim()}>
              {sending ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </div>
      ) : (
        <button className="btn btn-primary btn-full" onClick={() => setShowInvite(true)} disabled={members.length >= extraUsers}>
          + Invite Team Member
        </button>
      )}
    </div>
  )
}
