// ContactPage.jsx — Contact form → Firestore messages collection
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import toast from 'react-hot-toast'

const G = '#16a34a'

const inp = {
  width:'100%', padding:'13px 16px', border:'1.5px solid #e2e8f0', borderRadius:12,
  fontSize:14, outline:'none', background:'#fff', fontFamily:"'Noto Sans Arabic',system-ui,sans-serif",
  color:'#1e293b', boxSizing:'border-box',
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
    <Link to="/" style={{ color:G, textDecoration:'none', fontSize:13, fontWeight:600 }}>← الرئيسية</Link>
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

export default function ContactPage() {
  const [form, setForm]       = useState({ name:'', phone:'', email:'', subject:'', body:'' })
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async e => {
    e.preventDefault()
    if (!form.name.trim())  return toast.error('أدخل اسمك')
    if (!form.body.trim())  return toast.error('أدخل رسالتك')
    if (!form.phone.trim() && !form.email.trim()) return toast.error('أدخل رقم هاتف أو بريد إلكتروني')
    setSending(true)
    try {
      await addDoc(collection(db,'messages'), {
        name:    form.name.trim(),
        phone:   form.phone.trim(),
        email:   form.email.trim(),
        subject: form.subject.trim(),
        body:    form.body.trim(),
        read:    false,
        createdAt: serverTimestamp(),
      })
      setSent(true)
      toast.success('✅ تم إرسال رسالتك!')
    } catch(e) { toast.error('فشل الإرسال. حاول مرة أخرى.') }
    finally { setSending(false) }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#fff', fontFamily:"'Noto Sans Arabic',system-ui,sans-serif" }} dir="rtl">
      <NavBar />

      <main style={{ maxWidth:600, margin:'0 auto', padding:'48px 24px 80px' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:48, marginBottom:16 }}>✉️</div>
          <h1 style={{ fontWeight:900, fontSize:'clamp(1.6rem,4vw,2.2rem)', color:'#0f172a', marginBottom:8 }}>
            تواصل معنا
          </h1>
          <div style={{ width:60, height:4, background:G, borderRadius:4, margin:'0 auto' }} />
          <p style={{ color:'#64748b', marginTop:16, lineHeight:1.7 }}>
            نحن هنا للمساعدة. أرسل لنا رسالتك وسنرد في أقرب وقت.
          </p>
        </div>

        {sent ? (
          <div style={{
            background:'#f0fdf4', border:'2px solid #bbf7d0', borderRadius:20,
            padding:32, textAlign:'center',
          }}>
            <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
            <h2 style={{ fontWeight:800, color:G, marginBottom:8 }}>تم إرسال رسالتك!</h2>
            <p style={{ color:'#166534', marginBottom:24 }}>
              شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن.
            </p>
            <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
              <button onClick={() => { setSent(false); setForm({name:'',phone:'',email:'',subject:'',body:''}) }} style={{
                background:'#fff', color:G, border:`1.5px solid ${G}`,
                padding:'11px 24px', borderRadius:12, fontWeight:700, cursor:'pointer',
              }}>إرسال رسالة أخرى</button>
              <Link to="/" style={{
                background:G, color:'#fff', padding:'11px 24px',
                borderRadius:12, fontWeight:700, textDecoration:'none', display:'inline-block',
              }}>← الرئيسية</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} style={{
            background:'#fff', border:'1.5px solid #f1f5f9', borderRadius:20, padding:28,
          }}>
            {/* Row: Name + Phone */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
              <div>
                <label style={{ fontSize:13, fontWeight:600, display:'block', marginBottom:6 }}>
                  الاسم <span style={{ color:'#dc2626' }}>*</span>
                </label>
                <input style={inp} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="اسمك الكامل" />
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:600, display:'block', marginBottom:6 }}>رقم الهاتف</label>
                <input style={inp} value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+252 61 000 0000" />
              </div>
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:13, fontWeight:600, display:'block', marginBottom:6 }}>البريد الإلكتروني</label>
              <input style={inp} type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="example@email.com" />
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:13, fontWeight:600, display:'block', marginBottom:6 }}>الموضوع</label>
              <input style={inp} value={form.subject} onChange={e=>set('subject',e.target.value)} placeholder="موضوع رسالتك" />
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={{ fontSize:13, fontWeight:600, display:'block', marginBottom:6 }}>
                الرسالة <span style={{ color:'#dc2626' }}>*</span>
              </label>
              <textarea
                style={{ ...inp, minHeight:140, resize:'vertical', lineHeight:1.7 }}
                value={form.body}
                onChange={e=>set('body',e.target.value)}
                placeholder="اكتب رسالتك هنا..."
              />
            </div>

            <button type="submit" disabled={sending} style={{
              width:'100%', padding:'14px 0', borderRadius:12, border:'none',
              background:G, color:'#fff', fontWeight:700, fontSize:15,
              cursor:sending?'wait':'pointer', opacity:sending?0.7:1,
            }}>
              {sending ? '⏳ جاري الإرسال...' : '✉️ إرسال الرسالة'}
            </button>

            {/* WhatsApp alternative */}
            <div style={{ textAlign:'center', marginTop:16 }}>
              <p style={{ fontSize:12, color:'#94a3b8', marginBottom:8 }}>أو تواصل معنا مباشرة</p>
              <a
                href="https://wa.me/252610000000"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:'inline-flex', alignItems:'center', gap:8,
                  background:'#22c55e', color:'#fff', padding:'10px 20px',
                  borderRadius:12, fontWeight:700, fontSize:13, textDecoration:'none',
                }}
              >
                💬 واتساب
              </a>
            </div>
          </form>
        )}

        {/* Contact info cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginTop:32 }}>
          {[
            { icon:'📧', title:'البريد الإلكتروني', value:'hello@xisaabaati.com' },
            { icon:'💬', title:'واتساب',            value:'+252 61 000 0000'     },
            { icon:'🕐', title:'وقت الرد',          value:'خلال 2-4 ساعات'       },
          ].map(c => (
            <div key={c.title} style={{
              background:'#f8fafc', borderRadius:14, padding:16, textAlign:'center',
            }}>
              <div style={{ fontSize:28, marginBottom:6 }}>{c.icon}</div>
              <div style={{ fontWeight:700, fontSize:12, color:'#374151', marginBottom:4 }}>{c.title}</div>
              <div style={{ fontSize:12, color:'#64748b' }}>{c.value}</div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
