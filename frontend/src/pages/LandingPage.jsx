import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { languageFlags } from '../i18n/translations'

const G = '#16a34a'

const PLANS = [
  {
    id:'free', name:'Free', price:0, annualPrice:0, popular:false,
    features:['20 فاتورة شهرياً','تتبع المبيعات','إدارة المنتجات','إدارة العملاء'],
    cta:'ابدأ مجاناً', color:'#475569',
  },
  {
    id:'starter', name:'Starter', price:9, annualPrice:6.3, popular:false,
    features:['مبيعات غير محدودة','تتبع المصروفات','تقارير أساسية','مستخدم واحد'],
    cta:'اشترك الآن', color:'#1d4ed8',
  },
  {
    id:'basic', name:'Basic', price:19, annualPrice:13.3, popular:true,
    features:['كل مميزات Starter','فواتير غير محدودة','تقارير متقدمة','أولوية الدعم'],
    cta:'اشترك الآن', color:'#7c3aed',
  },
  {
    id:'pro', name:'Pro', price:39, annualPrice:27.3, popular:false,
    features:['كل مميزات Basic','متعدد المستخدمين','تصدير Excel/PDF','مدير حساب مخصص'],
    cta:'اشترك الآن', color:G,
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { t, lang, changeLang } = useLang()
  const [billing, setBilling] = useState('monthly')

  const go = () => navigate('/login')

  return (
    <div
      dir={t('dir')}
      style={{
        fontFamily: lang === 'ar'
          ? "'Noto Sans Arabic',system-ui,sans-serif"
          : "'IBM Plex Sans Arabic',system-ui,sans-serif",
        overflowX:'hidden', background:'#fff',
      }}
    >
      {/* ── NAV ───────────────────────────────────── */}
      <nav className="landing-nav">
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{
            width:34, height:34, background:G, borderRadius:10,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
          <span style={{ fontWeight:800, fontSize:17, color:'#0f172a' }}>Xisaabaati</span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {Object.entries(languageFlags).map(([k, flag]) => (
            <button key={k} onClick={() => changeLang(k)} style={{
              background:lang===k ? G : 'transparent',
              border:`1.5px solid ${lang===k ? G : '#e2e8f0'}`,
              borderRadius:8, padding:'4px 10px', cursor:'pointer',
              fontSize:12, fontWeight:600,
              color:lang===k ? '#fff' : '#64748b',
            }}>
              {flag} {k.toUpperCase()}
            </button>
          ))}
          <button onClick={go} style={{
            background:G, color:'#fff', border:'none', borderRadius:10,
            padding:'8px 18px', fontWeight:700, fontSize:13, cursor:'pointer',
          }}>
            {t('login')} →
          </button>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────── */}
      <section className="landing-hero">
        <div style={{ maxWidth:600, margin:'0 auto', textAlign:'center' }}>
          <div style={{
            display:'inline-block', background:'#f0fdf4', color:G,
            fontSize:12, fontWeight:700, padding:'5px 16px', borderRadius:20,
            marginBottom:20, border:'1px solid #bbf7d0',
          }}>
            🚀 مخصص للسوق الصومالي وشرق أفريقيا
          </div>
          <h1 style={{
            fontSize:'clamp(1.8rem,5vw,2.8rem)', fontWeight:900,
            lineHeight:1.2, marginBottom:16, color:'#0f172a',
          }}>
            {t('heroHeadline').split('\n').map((l,i) => (
              <span key={i}>{l}{i===0 && <br/>}</span>
            ))}
          </h1>
          <p style={{ fontSize:16, color:'#64748b', marginBottom:28 }}>{t('heroSub')}</p>
          <button onClick={go} style={{
            background:G, color:'#fff', border:'none', borderRadius:14,
            padding:'15px 40px', fontWeight:700, fontSize:17, cursor:'pointer',
            boxShadow:'0 4px 20px rgba(22,163,74,.35)',
          }}>
            {t('heroCTA')} →
          </button>
          <p style={{ fontSize:12, color:'#94a3b8', marginTop:10 }}>{t('heroSub2')}</p>

          {/* Preview card */}
          <div style={{
            margin:'40px auto 0', maxWidth:300, background:'#fff', borderRadius:20,
            padding:24, boxShadow:'0 8px 32px rgba(0,0,0,.08)',
            textAlign:lang==='ar'?'right':'left',
          }}>
            <div style={{ fontSize:12, color:'#94a3b8', marginBottom:6 }}>{t('todayProfit')}</div>
            <div style={{ fontSize:42, fontWeight:800, color:G, lineHeight:1 }}>$17.40</div>
            <div style={{ display:'flex', gap:8, marginTop:14 }}>
              {[{l:t('salesCount'),v:'5'},{l:t('totalSales'),v:'$42'}].map(s=>(
                <div key={s.l} style={{ flex:1, background:'#f8fafc', borderRadius:10, padding:'8px 6px', textAlign:'center' }}>
                  <div style={{ fontWeight:700, fontSize:15 }}>{s.v}</div>
                  <div style={{ fontSize:10, color:'#94a3b8' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────── */}
      <section className="landing-features">
        <h2 style={{ textAlign:'center', fontSize:'clamp(1.3rem,3vw,1.7rem)', fontWeight:800, marginBottom:40 }}>
          {t('features')}
        </h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
          {[
            { title:t('feat1'),  desc:t('feat1d'),  emoji:'📊' },
            { title:t('feat2'),  desc:t('feat2d'),  emoji:'⚡' },
            { title:t('feat3'),  desc:t('feat3d'),  emoji:'🌍' },
            { title:'طرق دفع محلية', desc:'EVC Plus · Zaad · Sahal · WhatsApp', emoji:'📱' },
            { title:'تقارير ذكية',   desc:'اعرف أفضل منتجاتك وأوقات الذروة',  emoji:'📈' },
            { title:'آمن وسريع',     desc:'بيانات محمية، تحديثات فورية',        emoji:'🔒' },
          ].map((f,i) => (
            <div key={i} style={{ background:'#fff', borderRadius:18, padding:24, border:'1px solid #f1f5f9' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>{f.emoji}</div>
              <h3 style={{ fontWeight:700, marginBottom:6, fontSize:15 }}>{f.title}</h3>
              <p style={{ color:'#64748b', fontSize:13, lineHeight:1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────── */}
      <section className="landing-how">
        <div style={{ maxWidth:600, margin:'0 auto', textAlign:'center' }}>
          <h2 style={{ fontSize:'clamp(1.3rem,3vw,1.7rem)', fontWeight:800, marginBottom:40 }}>
            {t('howTitle')}
          </h2>
          <div style={{ display:'flex', justifyContent:'center', gap:24, flexWrap:'wrap' }}>
            {[t('step1'),t('step2'),t('step3')].map((s,i) => (
              <div key={i} style={{ textAlign:'center', minWidth:140 }}>
                <div style={{
                  width:48, height:48, background:G, borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  margin:'0 auto 10px', fontSize:20, fontWeight:800, color:'#fff',
                }}>{i+1}</div>
                <p style={{ fontWeight:600, fontSize:14 }}>{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────── */}
      <section style={{ background:'#f8fafc', padding:'64px 24px' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <h2 style={{ textAlign:'center', fontSize:'clamp(1.3rem,3vw,1.8rem)', fontWeight:800, marginBottom:8 }}>
            {t('pricing')}
          </h2>
          <p style={{ textAlign:'center', color:'#64748b', marginBottom:32 }}>
            ابدأ مجاناً. طوّر عندما تحتاج. لا بطاقة ائتمان مطلوبة.
          </p>

          {/* Billing toggle */}
          <div style={{ display:'flex', justifyContent:'center', marginBottom:32 }}>
            <div style={{
              display:'inline-flex', background:'#fff', borderRadius:14, padding:4,
              border:'1.5px solid #e2e8f0', gap:4,
            }}>
              {['monthly','annual'].map(b => (
                <button key={b} onClick={()=>setBilling(b)} style={{
                  padding:'10px 24px', borderRadius:10, border:'none',
                  background:billing===b ? G : 'transparent',
                  color:billing===b ? '#fff' : '#64748b',
                  fontWeight:700, fontSize:14, cursor:'pointer', whiteSpace:'nowrap',
                }}>
                  {b==='monthly' ? '📆 شهري' : (
                    <span>
                      📅 سنوي{' '}
                      <span style={{
                        background:billing==='annual'?'rgba(255,255,255,.3)':'#dcfce7',
                        color:billing==='annual'?'#fff':'#15803d',
                        fontSize:10, padding:'2px 6px', borderRadius:20, marginRight:4,
                      }}>30% خصم</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Plan cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16 }}>
            {PLANS.map(p => (
              <div key={p.id} style={{
                background:'#fff', borderRadius:20, padding:24, position:'relative',
                border:`2px solid ${p.popular ? p.color : '#f1f5f9'}`,
                boxShadow:p.popular ? `0 8px 32px ${p.color}22` : '0 1px 4px rgba(0,0,0,.04)',
                transform:p.popular ? 'scale(1.02)' : 'scale(1)',
              }}>
                {p.popular && (
                  <div style={{
                    position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)',
                    background:p.color, color:'#fff', fontSize:10, fontWeight:700,
                    padding:'4px 14px', borderRadius:20, whiteSpace:'nowrap',
                  }}>⭐ الأكثر شيوعاً</div>
                )}
                <div style={{ fontWeight:800, fontSize:16, color:p.color, marginBottom:4 }}>{p.name}</div>
                <div style={{ marginBottom:16 }}>
                  <span style={{ fontSize:32, fontWeight:900, color:'#0f172a' }}>
                    ${billing==='annual' ? p.annualPrice : p.price}
                  </span>
                  <span style={{ fontSize:12, color:'#94a3b8' }}>/شهر</span>
                  {billing==='annual' && p.price>0 && (
                    <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>
                      ${+(p.annualPrice*12).toFixed(0)}/سنة · <s style={{ color:'#94a3b8' }}>${p.price*12}</s>
                    </div>
                  )}
                </div>
                <ul style={{ listStyle:'none', padding:0, margin:'0 0 20px' }}>
                  {p.features.map((f,i) => (
                    <li key={i} style={{ fontSize:12, color:'#475569', marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ color:p.price===0?'#94a3b8':G, fontWeight:700 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={go} style={{
                  width:'100%', padding:'11px 0', borderRadius:12,
                  border:p.popular ? 'none' : `1.5px solid #e2e8f0`,
                  background:p.popular ? p.color : '#f8fafc',
                  color:p.popular ? '#fff' : '#374151',
                  fontWeight:700, fontSize:13, cursor:'pointer',
                }}>{p.cta}</button>
              </div>
            ))}
          </div>
          <p style={{ textAlign:'center', marginTop:24, fontSize:12, color:'#94a3b8' }}>
            ✅ بدون بطاقة ائتمان · طرق دفع صومالية محلية · إلغاء في أي وقت
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────── */}
      <section className="landing-cta">
        <h2 style={{ fontSize:'clamp(1.4rem,4vw,2rem)', fontWeight:800, color:'#fff', marginBottom:12 }}>
          {t('finalCTA')}
        </h2>
        <p style={{ color:'#a7f3d0', marginBottom:28 }}>{t('finalSub')}</p>
        <button onClick={go} style={{
          background:'#fff', color:G, border:'none', borderRadius:14,
          padding:'15px 40px', fontWeight:700, fontSize:16, cursor:'pointer',
        }}>{t('heroCTA')} →</button>
      </section>

      {/* ── FOOTER ────────────────────────────────── */}
      <footer style={{ background:'#0f172a', color:'#94a3b8', padding:'48px 24px 28px' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',
            gap:32, marginBottom:36,
          }}>
            {/* Brand */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <div style={{ width:32, height:32, background:G, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                  </svg>
                </div>
                <span style={{ fontWeight:800, fontSize:16, color:'#fff' }}>Xisaabaati</span>
              </div>
              <p style={{ fontSize:12, lineHeight:1.7, color:'#64748b' }}>
                نظام محاسبة مُصمَّم للتجار الصغار في الصومال وشرق أفريقيا.
              </p>
            </div>

            <div>
              <div style={{ fontWeight:700, color:'#fff', marginBottom:12, fontSize:13 }}>الشركة</div>
              {[{to:'/about',label:'من نحن'},{to:'/vision',label:'رؤيتنا'},{to:'/contact',label:'تواصل معنا'}].map(l => (
                <div key={l.to} style={{ marginBottom:8 }}>
                  <Link to={l.to} style={{ color:'#64748b', textDecoration:'none', fontSize:13,
                    transition:'color .15s' }}
                    onMouseOver={e=>e.target.style.color='#fff'}
                    onMouseOut={e=>e.target.style.color='#64748b'}
                  >{l.label}</Link>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontWeight:700, color:'#fff', marginBottom:12, fontSize:13 }}>قانوني</div>
              {[{to:'/privacy',label:'سياسة الخصوصية'},{to:'/terms',label:'الشروط والأحكام'}].map(l => (
                <div key={l.to} style={{ marginBottom:8 }}>
                  <Link to={l.to} style={{ color:'#64748b', textDecoration:'none', fontSize:13 }}
                    onMouseOver={e=>e.target.style.color='#fff'}
                    onMouseOut={e=>e.target.style.color='#64748b'}
                  >{l.label}</Link>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontWeight:700, color:'#fff', marginBottom:12, fontSize:13 }}>الدعم</div>
              <div style={{ fontSize:12, color:'#64748b', lineHeight:2 }}>
                📧 hello@xisaabaati.com<br/>
                💬 واتساب: +252 61 000 0000
              </div>
            </div>
          </div>

          <div style={{
            borderTop:'1px solid #1e293b', paddingTop:20,
            display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:8,
            fontSize:12, color:'#475569', alignItems:'center',
          }}>
            <span>© {new Date().getFullYear()} Xisaabaati. جميع الحقوق محفوظة.</span>
            <div style={{ display:'flex', gap:12 }}>
              {Object.entries(languageFlags).map(([k,flag]) => (
                <button key={k} onClick={()=>changeLang(k)} style={{
                  background:'transparent', border:'none', cursor:'pointer',
                  fontSize:12, color:'#475569',
                }}>{flag} {k.toUpperCase()}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
