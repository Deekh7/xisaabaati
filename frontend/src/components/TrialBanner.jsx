// ─────────────────────────────────────────────
//  TrialBanner.jsx
//  Renders inside AppLayout, below the top-nav.
//  Shows trial status, warning, or expiry notice.
// ─────────────────────────────────────────────

import { useState } from 'react';
import { useSubscription } from '../context/SubscriptionContext';

const STYLES = `
.trial-banner {
  width: 100%;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-family: 'IBM Plex Sans Arabic', system-ui, sans-serif;
  font-size: 0.82rem;
  font-weight: 500;
  line-height: 1.3;
  animation: bannerIn .3s ease;
}
@keyframes bannerIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:none; } }

.trial-banner.trial-ok      { background: #064e3b; color: #6ee7b7; border-bottom: 1px solid #065f46; }
.trial-banner.trial-warning { background: #78350f; color: #fde68a; border-bottom: 1px solid #92400e; }
.trial-banner.trial-expired { background: #1c1917; color: #d6d3d1; border-bottom: 1px solid #292524; }
.trial-banner.trial-forced  { background: #450a0a; color: #fca5a5; border-bottom: 1px solid #7f1d1d; }

.trial-banner-left  { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.trial-banner-icon  { font-size: 1.1rem; flex-shrink: 0; }
.trial-banner-text  { flex: 1; }

.trial-badge {
  font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.4px; padding: 2px 8px; border-radius: 99px;
  background: rgba(255,255,255,.12);
  white-space: nowrap;
}

.trial-upgrade-btn {
  padding: 6px 14px; border-radius: 8px; border: none;
  font-family: inherit; font-size: 0.8rem; font-weight: 700;
  cursor: pointer; white-space: nowrap; transition: opacity .15s;
  flex-shrink: 0;
}
.trial-upgrade-btn:hover { opacity: .85; }
.trial-upgrade-btn.btn-green  { background: #22c55e; color: #052e16; }
.trial-upgrade-btn.btn-amber  { background: #fbbf24; color: #451a03; }
.trial-upgrade-btn.btn-white  { background: #fff;    color: #1c1917; }
.trial-upgrade-btn.btn-red    { background: #ef4444; color: #fff; }

.trial-dismiss {
  background: none; border: none; cursor: pointer;
  color: inherit; opacity: .5; font-size: 1.1rem; padding: 0 2px;
  flex-shrink: 0;
}
.trial-dismiss:hover { opacity: 1; }
`;

export default function TrialBanner({ onUpgradeClick }) {
  const {
    isTrialActive, trialDaysLeft, trialExpired,
    trialForceEnded, effectivePlan,
  } = useSubscription();

  const [dismissed, setDismissed] = useState(false);

  // Nothing to show for paid plans with no trial state
  if (!isTrialActive && !trialExpired && !trialForceEnded) return null;
  if (dismissed) return null;

  // ── State: trial force-ended (50 invoice bonus rule) ──
  if (trialForceEnded) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="trial-banner trial-forced">
          <div className="trial-banner-left">
            <span className="trial-banner-icon">🚫</span>
            <span className="trial-banner-text">
              Your trial ended — you reached 50 invoices. You're now on the{' '}
              <strong>Free plan</strong> (20 invoice limit).
            </span>
          </div>
          <button className="trial-upgrade-btn btn-red" onClick={onUpgradeClick}>
            Upgrade Now
          </button>
        </div>
      </>
    );
  }

  // ── State: trial expired naturally ──
  if (trialExpired) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="trial-banner trial-expired">
          <div className="trial-banner-left">
            <span className="trial-banner-icon">⏰</span>
            <span className="trial-banner-text">
              Your trial ended — you're now on the <strong>Free plan</strong>.
            </span>
          </div>
          <button className="trial-upgrade-btn btn-white" onClick={onUpgradeClick}>
            Upgrade
          </button>
          <button className="trial-dismiss" onClick={() => setDismissed(true)}>✕</button>
        </div>
      </>
    );
  }

  // ── State: warning (≤ 3 days left) ──
  if (isTrialActive && trialDaysLeft <= 3) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="trial-banner trial-warning">
          <div className="trial-banner-left">
            <span className="trial-banner-icon">⚠️</span>
            <span className="trial-banner-text">
              <strong>{trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left</strong> in your Pro trial.
              Upgrade before it ends to keep your features.
            </span>
          </div>
          <button className="trial-upgrade-btn btn-amber" onClick={onUpgradeClick}>
            Upgrade Now
          </button>
          <button className="trial-dismiss" onClick={() => setDismissed(true)}>✕</button>
        </div>
      </>
    );
  }

  // ── State: healthy trial ──
  return (
    <>
      <style>{STYLES}</style>
      <div className="trial-banner trial-ok">
        <div className="trial-banner-left">
          <span className="trial-banner-icon">✦</span>
          <span className="trial-banner-text">
            Free Pro trial — <strong>{trialDaysLeft} days</strong> remaining
          </span>
          <span className="trial-badge">Pro</span>
        </div>
        <button className="trial-upgrade-btn btn-green" onClick={onUpgradeClick}>
          See Plans
        </button>
        <button className="trial-dismiss" onClick={() => setDismissed(true)}>✕</button>
      </div>
    </>
  );
}
