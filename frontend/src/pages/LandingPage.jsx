import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

const features = [
  {
    icon: '🧾',
    title: 'فواتير احترافية',
    titleEn: 'Professional Invoices',
    desc: 'أنشئ وأرسل فواتير احترافية في ثوانٍ مع إمكانية التتبع الفوري',
    descEn: 'Create and send professional invoices in seconds with real-time tracking',
  },
  {
    icon: '👥',
    title: 'إدارة العملاء',
    titleEn: 'Customer Management',
    desc: 'احتفظ بسجل كامل لعملائك وتاريخ معاملاتهم في مكان واحد',
    descEn: 'Maintain a complete record of your clients and their transaction history in one place',
  },
  {
    icon: '📊',
    title: 'تقارير مالية',
    titleEn: 'Financial Reports',
    desc: 'تقارير واضحة وتفصيلية عن مبيعاتك وإيراداتك بلمسة واحدة',
    descEn: 'Clear, detailed reports of your sales and revenue at a single click',
  },
  {
    icon: '💳',
    title: 'مدفوعات EVC & Zaad',
    titleEn: 'EVC & Zaad Payments',
    desc: 'استقبل المدفوعات عبر EVC Plus وZaad مع تسجيل تلقائي',
    descEn: 'Accept payments via EVC Plus and Zaad with automatic recording',
  },
  {
    icon: '🔒',
    title: 'أمان تام',
    titleEn: 'Fully Secure',
    desc: 'بياناتك محمية بتشفير عالي المستوى وتسجيل دخول آمن بالرقم السري',
    descEn: 'Your data is protected with high-level encryption and secure PIN login',
  },
  {
    icon: '📱',
    title: 'يعمل على كل الأجهزة',
    titleEn: 'Works on All Devices',
    desc: 'سواء كنت على هاتفك أو جهاز الكمبيوتر، حساباتك دائماً في متناول يدك',
    descEn: 'Whether on your phone or computer, your accounts are always within reach',
  },
]

const steps = [
  { num: '١', title: 'سجّل مجاناً', desc: 'أدخل رقم هاتفك وأنشئ رقم سري — لا بريد إلكتروني ولا تعقيدات' },
  { num: '٢', title: 'أضف عملاءك', desc: 'سجّل بيانات عملائك مرة واحدة واستخدمها في كل الفواتير' },
  { num: '٣', title: 'أصدر فواتيرك', desc: 'أنشئ فاتورة واحدة أو بالجملة وتابع حالة كل دفعة فورياً' },
]

export default function LandingPage() {
  const [lang, setLang] = useState('ar')
  const isAr = lang === 'ar'

  useEffect(() => {
    document.documentElement.dir = isAr ? 'rtl' : 'ltr'
    return () => { document.documentElement.dir = 'rtl' }
  }, [isAr])

  return (
    <div style={{ fontFamily: isAr ? "'Segoe UI', Tahoma, sans-serif" : "'Inter', sans-serif", background: '#fafaf7', color: '#0e1a14', minHeight: '100vh' }}>

      {/* ── NAVBAR ── */}
      <nav style={{ background: '#0f4c35', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28, lineHeight: 1 }}>📒</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 22, letterSpacing: isAr ? 0 : -0.5 }}>
            {isAr ? 'حسابات' : 'Xisaabaati'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setLang(isAr ? 'en' : 'ar')}
            style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#d4f0e3', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            {isAr ? 'EN' : 'عربي'}
          </button>
          <Link to="/login" style={{ color: '#d4f0e3', textDecoration: 'none', fontSize: 14, fontWeight: 500, padding: '8px 16px' }}>
            {isAr ? 'تسجيل الدخول' : 'Login'}
          </Link>
          <Link to="/signup" style={{ background: '#2d9e6e', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700, padding: '9px 20px', borderRadius: 10 }}>
            {isAr ? 'ابدأ مجاناً' : 'Start Free'}
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ background: 'linear-gradient(160deg, #0f4c35 0%, #1a6b4a 60%, #2d9e6e 100%)', padding: '80px 24px 100px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'rgba(212,240,227,0.15)', border: '1px solid rgba(212,240,227,0.3)', color: '#d4f0e3', padding: '6px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
            {isAr ? '🇸🇴 صُنع خصيصاً للتجار الصوماليين' : '🇸🇴 Built for Somali Merchants'}
          </div>

          <h1 style={{ color: '#fff', fontSize: 'clamp(36px, 7vw, 60px)', fontWeight: 800, lineHeight: 1.2, margin: '0 0 20px', textShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
            {isAr ? (
              <>نظام حسابات تجارية<br /><span style={{ color: '#a7e8c8' }}>بسيط وذكي</span></>
            ) : (
              <>Smart Business Accounting<br /><span style={{ color: '#a7e8c8' }}>Made Simple</span></>
            )}
          </h1>

          <p style={{ color: '#c8eadb', fontSize: 'clamp(16px, 2.5vw, 20px)', lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
            {isAr
              ? 'أدر فواتيرك وعملاءك ومدفوعاتك بكل سهولة. بدون بريد إلكتروني — فقط رقم هاتفك ورقم سري.'
              : 'Manage your invoices, clients, and payments effortlessly. No email needed — just your phone number and PIN.'}
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" style={{ background: '#fff', color: '#0f4c35', textDecoration: 'none', fontWeight: 800, fontSize: 17, padding: '14px 36px', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.2)', transition: 'transform 0.2s' }}>
              {isAr ? 'ابدأ مجاناً الآن →' : 'Start Free Now →'}
            </Link>
            <Link to="/login" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 16, padding: '14px 32px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.25)' }}>
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </Link>
          </div>

          {/* Stats bar */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 56, flexWrap: 'wrap' }}>
            {[
              { n: '١٠٠٪', label: isAr ? 'مجاني للبدء' : '100% Free to Start' },
              { n: '٣٠ ث', label: isAr ? 'وقت الإعداد' : 'Setup Time' },
              { n: '٢٤/٧', label: isAr ? 'وصول مستمر' : 'Always Available' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ color: '#fff', fontSize: 26, fontWeight: 800 }}>{s.n}</div>
                <div style={{ color: '#a7e8c8', fontSize: 13, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 800, color: '#0f4c35', margin: '0 0 14px' }}>
            {isAr ? 'كل ما تحتاجه لإدارة أعمالك' : 'Everything You Need to Run Your Business'}
          </h2>
          <p style={{ color: '#5a7066', fontSize: 17, maxWidth: 500, margin: '0 auto' }}>
            {isAr ? 'أدوات مصممة خصيصاً للتاجر الصومالي' : 'Tools designed specifically for the Somali merchant'}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: '#fff', border: '1px solid #e8e8e0', borderRadius: 18, padding: '28px 24px', boxShadow: '0 2px 12px rgba(15,26,20,0.06)', transition: 'box-shadow 0.2s, transform 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(15,76,53,0.12)'; e.currentTarget.style.transform = 'translateY(-4px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,26,20,0.06)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ fontSize: 38, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ color: '#0f4c35', fontWeight: 700, fontSize: 19, margin: '0 0 8px' }}>
                {isAr ? f.title : f.titleEn}
              </h3>
              <p style={{ color: '#5a7066', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                {isAr ? f.desc : f.descEn}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: 'linear-gradient(135deg, #f0faf5 0%, #e8f5ef 100%)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, color: '#0f4c35', margin: '0 0 52px' }}>
            {isAr ? 'كيف يعمل النظام؟' : 'How It Works'}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
            {steps.map((s, i) => (
              <div key={s.num} style={{ display: 'flex', alignItems: 'flex-start', gap: 24, textAlign: isAr ? 'right' : 'left', padding: '0 0 40px', position: 'relative' }}>
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div style={{ position: 'absolute', [isAr ? 'right' : 'left']: 31, top: 64, bottom: 0, width: 2, background: '#c8eadb' }} />
                )}
                <div style={{ width: 64, height: 64, minWidth: 64, background: '#0f4c35', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 800, boxShadow: '0 4px 16px rgba(15,76,53,0.25)', flexShrink: 0 }}>
                  {s.num}
                </div>
                <div style={{ paddingTop: 12 }}>
                  <h3 style={{ color: '#0f4c35', fontWeight: 700, fontSize: 20, margin: '0 0 6px' }}>{s.title}</h3>
                  <p style={{ color: '#5a7066', fontSize: 15, lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ── */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 800, color: '#0f4c35', marginBottom: 16 }}>
          {isAr ? 'لوحة تحكم واضحة ومرتبة' : 'A Clear, Organized Dashboard'}
        </h2>
        <p style={{ color: '#5a7066', fontSize: 16, marginBottom: 40 }}>
          {isAr ? 'كل أرقامك في نظرة واحدة' : 'All your numbers at a glance'}
        </p>

        {/* Mockup dashboard */}
        <div style={{ background: '#0f4c35', borderRadius: 20, padding: 20, boxShadow: '0 20px 60px rgba(15,76,53,0.3)', maxWidth: 800, margin: '0 auto' }}>
          {/* Fake browser bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28ca41' }} />
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 6, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>xisaabaati-fixed.vercel.app</span>
            </div>
          </div>

          {/* Fake app UI */}
          <div style={{ background: '#fafaf7', borderRadius: 12, padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, direction: 'ltr' }}>
            {[
              { label: isAr ? 'إجمالي الإيرادات' : 'Total Revenue', value: '$12,450', color: '#0f4c35', bg: '#d4f0e3' },
              { label: isAr ? 'فواتير معلقة' : 'Pending Invoices', value: '8', color: '#d97706', bg: '#fef3c7' },
              { label: isAr ? 'العملاء النشطون' : 'Active Clients', value: '34', color: '#059669', bg: '#d1fae5' },
            ].map(c => (
              <div key={c.label} style={{ background: c.bg, borderRadius: 10, padding: '16px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
                <div style={{ fontSize: 11, color: '#5a7066', marginTop: 4 }}>{c.label}</div>
              </div>
            ))}
            {/* Fake table rows */}
            <div style={{ gridColumn: '1 / -1', background: '#fff', borderRadius: 10, padding: '12px 16px' }}>
              {[
                { name: 'محمد يوسف', amount: '$350', status: isAr ? 'مدفوع' : 'Paid', statusColor: '#059669', statusBg: '#d1fae5' },
                { name: 'Faadumo Cali', amount: '$1,200', status: isAr ? 'معلق' : 'Pending', statusColor: '#d97706', statusBg: '#fef3c7' },
                { name: 'Axmed Nuur', amount: '$780', status: isAr ? 'مدفوع' : 'Paid', statusColor: '#059669', statusBg: '#d1fae5' },
              ].map(r => (
                <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f2f2ed' }}>
                  <span style={{ fontSize: 13, color: '#2d3d35', fontWeight: 500 }}>{r.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f4c35' }}>{r.amount}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: r.statusColor, background: r.statusBg, padding: '3px 10px', borderRadius: 12 }}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: 'linear-gradient(135deg, #0f4c35, #1a6b4a)', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ color: '#fff', fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, margin: '0 0 16px' }}>
          {isAr ? 'ابدأ إدارة أعمالك اليوم' : 'Start Managing Your Business Today'}
        </h2>
        <p style={{ color: '#c8eadb', fontSize: 17, marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
          {isAr ? 'مجاني تماماً. لا بطاقة ائتمان. لا بريد إلكتروني.' : 'Completely free. No credit card. No email required.'}
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/signup" style={{ background: '#fff', color: '#0f4c35', textDecoration: 'none', fontWeight: 800, fontSize: 18, padding: '16px 44px', borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            {isAr ? 'سجّل الآن مجاناً' : 'Register Free Now'}
          </Link>
        </div>
        <p style={{ color: '#a7e8c8', fontSize: 13, marginTop: 20 }}>
          {isAr ? '📞 الدعم: +252 61 500 0000' : '📞 Support: +252 61 500 0000'}
        </p>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0a3226', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 24 }}>📒</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>
            {isAr ? 'حسابات' : 'Xisaabaati'}
          </span>
        </div>
        <p style={{ color: '#5a7066', fontSize: 13, margin: '0 0 8px' }}>
          {isAr ? 'نظام حسابات تجارية مصمم للتاجر الصومالي' : 'Business accounting system designed for the Somali merchant'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16 }}>
          <Link to="/login" style={{ color: '#5a7066', textDecoration: 'none', fontSize: 13 }}>{isAr ? 'تسجيل الدخول' : 'Login'}</Link>
          <Link to="/signup" style={{ color: '#5a7066', textDecoration: 'none', fontSize: 13 }}>{isAr ? 'التسجيل' : 'Sign Up'}</Link>
        </div>
        <p style={{ color: '#3d5248', fontSize: 12, marginTop: 20 }}>
          © {new Date().getFullYear()} Xisaabaati · {isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
        </p>
      </footer>
    </div>
  )
}
