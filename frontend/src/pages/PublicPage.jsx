// PublicPage.jsx — Dynamic CMS-powered public page (About / Vision / Privacy / Terms)
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../config/firebase'

const G = '#16a34a'

const PAGE_DEFAULTS = {
  about: {
    title: 'من نحن',
    icon: '🏢',
    body: `Xisaabaati هو نظام محاسبة بسيط وعملي مُصمَّم خصيصاً للتجار الصغار في الصومال وشرق أفريقيا.

نحن نؤمن بأن كل تاجر — سواء كان يدير دكاناً صغيراً أو مطعماً أو صيدلية — يستحق أدوات مالية تُساعده على معرفة أرباحه بوضوح.

مهمتنا هي تبسيط المحاسبة وجعلها في متناول الجميع، بغض النظر عن المستوى التعليمي أو الخلفية التقنية.`,
    extra: '',
  },
  vision: {
    title: 'رؤيتنا',
    icon: '🎯',
    body: `رؤيتنا هي أن يكون لكل تاجر في أفريقيا أداة رقمية تُساعده على النمو واتخاذ قرارات مالية صحيحة.

نسعى إلى بناء مستقبل تجاري أفضل من خلال:

• تمكين التجار الصغار من فهم أرباحهم
• توفير أدوات محاسبية باللغات المحلية
• دعم طرق الدفع الصومالية المحلية
• الحفاظ على البساطة في كل خطوة

معاً نبني اقتصاداً رقمياً أقوى.`,
    extra: '',
  },
  privacy: {
    title: 'سياسة الخصوصية',
    icon: '🔒',
    body: `آخر تحديث: 2025

نحن في Xisaabaati نأخذ خصوصيتك بجدية تامة. هذه السياسة توضح كيف نجمع ونستخدم ونحمي معلوماتك.

**البيانات التي نجمعها:**
- معلومات الحساب (الاسم، البريد الإلكتروني، نوع النشاط)
- بيانات المبيعات والمنتجات التي تُدخلها
- بيانات الدفع (أرقام المعاملات، لا نجمع أرقام البطاقات)

**كيف نستخدم البيانات:**
- تقديم خدمات التطبيق
- تحسين تجربة المستخدم
- التواصل بشأن حسابك

**حماية البيانات:**
- نستخدم Firebase من Google للتخزين الآمن
- بياناتك مشفرة ومحمية
- لا نبيع بياناتك لأي طرف ثالث

**تواصل معنا:**
لأي استفسار حول الخصوصية، راسلنا على hello@xisaabaati.com`,
    extra: 'hello@xisaabaati.com',
  },
  terms: {
    title: 'الشروط والأحكام',
    icon: '📋',
    body: `آخر تحديث: 2025

باستخدامك لـ Xisaabaati، فإنك توافق على هذه الشروط:

**1. استخدام الخدمة**
- يجب أن يكون عمرك 18 عاماً أو أكثر
- تحمل مسؤولية دقة البيانات التي تُدخلها
- لا تستخدم الخدمة لأغراض غير مشروعة

**2. الاشتراك والدفع**
- الخطة المجانية متاحة دائماً
- الخطط المدفوعة تُفعَّل بعد التحقق من الدفع
- لا يوجد استرداد للمبالغ المدفوعة

**3. البيانات**
- أنت تمتلك بياناتك
- يحق لنا حذف الحسابات غير النشطة بعد 12 شهراً

**4. التغييرات**
- نحتفظ بحق تعديل هذه الشروط مع إشعار مسبق

**التواصل:**
hello@xisaabaati.com`,
    extra: 'hello@xisaabaati.com',
  },
}

const NavBar = () => (
  <nav style={{
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'16px 24px', background:'#fff', borderBottom:'1px solid #f1f5f9',
    position:'sticky', top:0, zIndex:100,
  }}>
    <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
      <div style={{ width:32, height:32, background:G, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
      </div>
      <span style={{ fontWeight:800, fontSize:16, color:'#0f172a' }}>Xisaabaati</span>
    </Link>
    <Link to="/" style={{ color:G, textDecoration:'none', fontSize:13, fontWeight:600 }}>
      ← الرئيسية
    </Link>
  </nav>
)

const Footer = () => (
  <footer style={{ background:'#f8fafc', borderTop:'1px solid #f1f5f9', padding:'32px 24px', textAlign:'center' }}>
    <div style={{ display:'flex', justifyContent:'center', gap:24, flexWrap:'wrap', marginBottom:12, fontSize:13 }}>
      {[{to:'/about',l:'من نحن'},{to:'/vision',l:'رؤيتنا'},{to:'/privacy',l:'سياسة الخصوصية'},{to:'/terms',l:'الشروط'},{to:'/contact',l:'تواصل معنا'}].map(x => (
        <Link key={x.to} to={x.to} style={{ color:'#64748b', textDecoration:'none' }}>{x.l}</Link>
      ))}
    </div>
    <p style={{ fontSize:12, color:'#94a3b8' }}>© {new Date().getFullYear()} Xisaabaati</p>
  </footer>
)

export default function PublicPage() {
  const { slug } = useParams()
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    const unsub = onSnapshot(doc(db,'pages',slug), snap => {
      if (snap.exists()) {
        setContent(snap.data())
      } else {
        setContent(PAGE_DEFAULTS[slug] || { title:'الصفحة', body:'لا يوجد محتوى بعد.', icon:'📄' })
      }
      setLoading(false)
    }, () => {
      setContent(PAGE_DEFAULTS[slug] || { title:'الصفحة', body:'', icon:'📄' })
      setLoading(false)
    })
    return unsub
  }, [slug])

  const defaults = PAGE_DEFAULTS[slug] || {}
  const title  = content?.title  || defaults.title  || 'الصفحة'
  const body   = content?.body   || defaults.body   || ''
  const icon   = content?.icon   || defaults.icon   || '📄'
  const extra  = content?.extra  || defaults.extra  || ''

  return (
    <div style={{ minHeight:'100vh', background:'#fff', fontFamily:"'Noto Sans Arabic',system-ui,sans-serif" }} dir="rtl">
      <NavBar />

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'80px 0' }}>
          <div className="spinner" />
        </div>
      ) : (
        <main style={{ maxWidth:720, margin:'0 auto', padding:'48px 24px 80px' }}>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div style={{ fontSize:48, marginBottom:16 }}>{icon}</div>
            <h1 style={{ fontWeight:900, fontSize:'clamp(1.6rem,4vw,2.2rem)', color:'#0f172a', marginBottom:8 }}>
              {title}
            </h1>
            <div style={{ width:60, height:4, background:G, borderRadius:4, margin:'0 auto' }} />
          </div>

          <div style={{
            fontSize:15, lineHeight:2, color:'#374151',
            whiteSpace:'pre-wrap',
          }}>
            {body}
          </div>

          {extra && (
            <div style={{
              marginTop:32, background:'#f0fdf4', border:'1.5px solid #bbf7d0',
              borderRadius:14, padding:16, fontSize:13, color:'#166534',
            }}>
              <strong>تواصل معنا:</strong> {extra}
            </div>
          )}

          <div style={{ marginTop:48, textAlign:'center' }}>
            <Link to="/" style={{
              display:'inline-block', background:G, color:'#fff', padding:'12px 28px',
              borderRadius:12, textDecoration:'none', fontWeight:700, fontSize:14,
            }}>← العودة للرئيسية</Link>
          </div>
        </main>
      )}

      <Footer />
    </div>
  )
}
