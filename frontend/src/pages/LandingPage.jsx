import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { languageFlags } from '../i18n/translations'

const G = '#16a34a'

export default function LandingPage() {
  const navigate = useNavigate()
  const { t, lang, changeLang } = useLang()

  const go = () => navigate('/login')

  return (
    <div
      dir={t('dir')}
      style={{
        fontFamily: lang === 'ar'
          ? "'Noto Sans Arabic',system-ui,sans-serif"
          : 'system-ui,-apple-system,sans-serif',
        overflowX: 'hidden',
        background: '#fff',
      }}
    >
      {/* ── NAV ───────────────────────────────────── */}
      <nav className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 34, height: 34, background: G, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 18 }}>{t('appName')}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {Object.keys(languageFlags).map((k) => (
              <button
                key={k}
                onClick={() => changeLang(k)}
                style={{
                  padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: lang === k ? G : 'transparent',
                  color: lang === k ? '#fff' : '#94a3b8',
                  fontSize: 12, fontWeight: 700,
                }}
              >
                {languageFlags[k]}
              </button>
            ))}
          </div>
          <button
            onClick={go}
            style={{
              background: G, color: '#fff', border: 'none',
              borderRadius: 10, padding: '8px 18px',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            {t('heroCTA')}
          </button>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────── */}
      <section className="landing-hero">
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 800,
            lineHeight: 1.2, color: '#0f172a', marginBottom: 16,
            whiteSpace: 'pre-line',
          }}>
            {t('heroHeadline')}
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.1rem)', color: '#64748b', marginBottom: 32 }}>
            {t('heroSub')}
          </p>
          <button
            onClick={go}
            style={{
              background: G, color: '#fff', border: 'none',
              borderRadius: 14, padding: '15px 40px',
              fontWeight: 700, fontSize: 17, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(22,163,74,.35)',
            }}
          >
            {t('heroCTA')} →
          </button>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 10 }}>{t('heroSub2')}</p>

          {/* Preview card */}
          <div style={{
            margin: '40px auto 0', maxWidth: 300,
            background: '#fff', borderRadius: 20, padding: 24,
            boxShadow: '0 8px 32px rgba(0,0,0,.08)',
            textAlign: lang === 'ar' ? 'right' : 'left',
          }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{t('todayProfit')}</div>
            <div style={{ fontSize: 42, fontWeight: 800, color: G, lineHeight: 1 }}>$17.40</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              {[
                { l: t('salesCount'), v: '5' },
                { l: t('totalSales'), v: '$42' },
              ].map((s) => (
                <div key={s.l} style={{ flex: 1, background: '#f8fafc', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{s.v}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────── */}
      <section className="landing-features">
        <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.3rem, 3vw, 1.7rem)', fontWeight: 800, marginBottom: 40 }}>
          {t('features')}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            { title: t('feat1'), desc: t('feat1d'), emoji: '📊' },
            { title: t('feat2'), desc: t('feat2d'), emoji: '⚡' },
            { title: t('feat3'), desc: t('feat3d'), emoji: '🌍' },
          ].map((f, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 18, padding: 24, border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{f.emoji}</div>
              <h3 style={{ fontWeight: 700, marginBottom: 6, fontSize: 15 }}>{f.title}</h3>
              <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────── */}
      <section className="landing-how">
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.7rem)', fontWeight: 800, marginBottom: 40 }}>
            {t('howTitle')}
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
            {[t('step1'), t('step2'), t('step3')].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', minWidth: 140 }}>
                <div style={{
                  width: 48, height: 48, background: G, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 10px', fontSize: 20, fontWeight: 800, color: '#fff',
                }}>
                  {i + 1}
                </div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────── */}
      <section className="landing-cta">
        <h2 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 800, color: '#fff', marginBottom: 12 }}>
          {t('finalCTA')}
        </h2>
        <p style={{ color: '#94a3b8', marginBottom: 28 }}>{t('finalSub')}</p>
        <button
          onClick={go}
          style={{
            background: G, color: '#fff', border: 'none',
            borderRadius: 14, padding: '15px 40px',
            fontWeight: 700, fontSize: 16, cursor: 'pointer',
          }}
        >
          {t('heroCTA')} →
        </button>
      </section>

      {/* ── FOOTER ────────────────────────────────── */}
      <footer className="landing-footer">
        <span style={{ fontWeight: 800, color: G }}>{t('appName')}</span> · © {new Date().getFullYear()}
      </footer>
    </div>
  )
}
