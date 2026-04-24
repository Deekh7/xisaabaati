import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { languageFlags } from '../i18n/translations'

const G = '#16a34a'
const DARK = '#0f172a'

// ── All landing page copy in 3 languages ────────────────────────────────────
const CONTENT = {
  so: {
    dir: 'ltr',
    font: "'IBM Plex Sans Arabic',system-ui,sans-serif",
    navLogin: 'Gal',
    badge: '🚀 500+ ganacsade ayaa adeegsanaya Xisaabaati Soomaaliya',
    heroH1a: 'Ma ogtahay inta aad',
    heroH1b: 'maanta faa\'iidday?',
    heroSub: 'Xisaabaati waxay kuu sheegaysaa faa\'idadaada dhabta ah — ka dib iibsi kasta, lacag kasta, kharasho kasta.',
    heroCTA: 'Bilow Bilaash — Maanta',
    heroNote: '✓ Kaarka laguma baahna  ·  ✓ 2 daqiiqo ayuu kaa qaadaa',
    dashLabel: 'Faa\'idada Maanta',
    dashSales: 'Iibka', dashExpenses: 'Kharashka', dashProfit: 'Faa\'iido',
    trust1: '500+', trust1l: 'Ganacsade',
    trust2: '7+',   trust2l: 'Magaalo',
    trust3: '$2M+', trust3l: 'La Xisaabiyay',
    trust4: '4.9★', trust4l: 'Qiimeynta',
    painTitle: 'Sidan ma tahay hadda?',
    pains: [
      { emoji: '😰', title: 'Xisaab adag', body: 'Caawa ma garanaysid meeqa aad faa\'iiday — qoraal keliya ayaa jira, nidaam la\'aan' },
      { emoji: '📝', title: 'Daftar gacanta', body: 'Kharashyada iyo iibka waa kala dhex maran, waxna kama caddaato' },
      { emoji: '😤', title: 'Faa\'iido la\'aan', body: 'Alaabta oo dhan waad iibisay — laakiin faa\'iidada dhabta ah ma garanaysid' },
      { emoji: '⏰', title: 'Waqti luminta', body: 'Xisaabta adoo gacanta ku samaynayo waa waqti lumin — ganacsigaagu u bahan yahay wax ka badan' },
    ],
    painCTA: 'Xall Hadda — Bilow Bilaash',
    simpleTitle: 'Saddex tallaabo — faa\'idada hel',
    steps: [
      { n: '1', title: 'Geli Iibsiga', body: 'Iibka ku gali — badeecad, qiimo, tirada. 10 ilbiriqsi' },
      { n: '2', title: 'Geli Kharashka', body: 'Shidaalka, kireenta, alaabta — ku dar kharashyada maalinle' },
      { n: '3', title: 'Arag Faa\'idada', body: 'Nidaamku si toos ah u xisaabiyaa — arag faa\'idada nadiifka ah ee maanta' },
    ],
    simpleNote: '✓ Tababar laguma baahna. Ganacsadayaasha 2 daqiiqo ayay bartaan.',
    featTitle: 'Waxa Xisaabaati kuu sameeyo',
    feats: [
      { emoji: '📊', title: 'Faa\'iidada Toos', body: 'Faa\'idada waxay muuqataa ka dib iibsi kasta — si toos ah' },
      { emoji: '📱', title: 'Mobile First', body: 'Taleefonkaaga ku shaqeeye — iOS iyo Android labadaba' },
      { emoji: '📦', title: 'Kaydka Badeecadaha', body: 'Raadso alaabta, qiimaha iyo kaydka si fudud' },
      { emoji: '💸', title: 'Kharashka Maalinle', body: 'Geli kharashyada — nidaamku ka jaraa faa\'idada' },
      { emoji: '📈', title: 'Warbixinnada', body: 'Warbixin usbuucle iyo bishadle — ganacsigaaga kor u qaad' },
      { emoji: '👥', title: 'Macaamiilka', body: 'Diiwaanka macaamiilkaaga — deynta iyo taariikhdooda' },
      { emoji: '🌐', title: 'Offline ayuu shaqeeyaa', body: 'Internet la\'aanteed ayuu shaqeeyaa — Soomaaliya loo sameeyay' },
      { emoji: '🔒', title: 'Ammaan', body: 'Xogaaga waa ammaan — cloud ku keydsan, mar kasta heli karo' },
    ],
    testiTitle: 'Waxa ganacsadayaashu yiraaheen',
    testimonials: [
      { name: 'Caasha Maxamed', biz: 'Dukaanka Cuntooyinka · Muqdisho', quote: 'Hore ma garaneen faa\'idada — hadda maalin kasta waxaan arkaa lacagta aan helo. Nidaamka aad ayuu ii fududeeyay.', stars: 5 },
      { name: 'Cabdirisaaq Xasan', biz: 'Farmashiyaha Al-Shifa · Hargeysa', quote: 'Diwaan xisaabeedka waa la adkaa. Xisaabaati wuxuu ii fududeeyay — 10 daqiiqo ayaan bartay.', stars: 5 },
      { name: 'Faadumo Cali', biz: 'Xafiiska Dhar · Boosaaso', quote: 'Kharashyadayda iyo iibkayga waan ku rakibay. Faa\'idada dhabta ah ayaan hadda garan karaa.', stars: 5 },
    ],
    pricingTitle: 'Dooro qorshe kuu habboon',
    pricingSub: 'Bilow bilaash. Kor u qaad marka aad u baahato.',
    monthly: '📆 Bishii', annual: '📅 Sanadkii', discount: '30% dhimi',
    perMonth: '/bil', perYear: '/sanad', popular: '⭐ Ugu Caan',
    savedLabel: 'baad badbaadisaa',
    plans: [
      { id:'free',    name:'Bilaash',  price:0,  annualPrice:0,    popular:false, color:'#475569', cta:'Bilow Bilaash',   features:['20 iibsi bishii','Diiwaanka iibka','Maamulka badeecadaha','Maamulka macaamiilka'] },
      { id:'starter', name:'Bilowga', price:9,  annualPrice:6.3,  popular:false, color:'#1d4ed8', cta:'Bilow Hadda',     features:['Iibsi aan xaddidnayn','Warbixinnada asaasiga','1 isticmaale · 1 laansho','Taageero WhatsApp'] },
      { id:'basic',   name:'Aasaasi', price:19, annualPrice:13.3, popular:true,  color:'#7c3aed', cta:'Bilow Hadda',     features:['Wax walba Bilowga','Warbixinnada horumarsan','3 isticmaale · 3 laansho','Qaansheegadaha'] },
      { id:'pro',     name:'Pro',     price:39, annualPrice:27.3, popular:false, color:G,         cta:'Bilow Hadda',     features:['Wax walba Aasaasi','7 isticmaale · 7 laansho','Dajinta Excel/PDF','Maamule gaar ah'] },
    ],
    noCreditCard: '✓ Kaarka laguma baahna  ·  ✓ EVC, Zaad, Sahal  ·  ✓ Jooji goor kasta',
    faqTitle: 'Su\'aalaha la badan yahay',
    faqs: [
      { q: 'Ma internet ayaan u baahan nahay?', a: 'Maya — Xisaabaati wuxuu ku shaqeeyaa internet la\'aanteed. Xogta waxay keydisaa taleefoonkaaga — marka internetku jiro ayaa cloud-ka la diraa.' },
      { q: 'Lacag bixinta sidee u qabanaysaa?', a: 'Waxaad ku bixin kartaa EVC Plus, Zaad, Sahal, ama Western Union. Kaarka bandhiga (credit card) laguma baahna.' },
      { q: 'Sidee baan ku bilaabi karaa?', a: 'Isdiiwaangeli — lacag la\' iyo kaad la\'. 2 daqiiqo gudahood waxaad bilaabi kartaa iibka diiwaangelinta.' },
      { q: 'Ganacsigeyga noociisa ma uu u habboon yahay?', a: 'Haa — dukaanka, makhaayada, farmashiyaha, xafiiska alaabta, xafiiska adeegyada, iyo soo-galinta — oo dhan wuu u habboon yahay.' },
      { q: 'Qiimaha miyaan bedeli karaa?', a: 'Haa, waqti kasta waad bedeli kartaa — kor ama hoos. Heshiis la\'aan.' },
      { q: 'Xogteydii ma lumaysaa haddaan joojisto?', a: 'Xogta waxay ku taallaa cloud-ka — goor kasta waad soo dajin kartaa. 90 maalmood ka dib ayaannu tirtirnaa.' },
      { q: 'Taageero miyuu leeyahay?', a: 'Haa — WhatsApp iyo email taageero. Saddexda plan ee lacagta leh waxay helaan taageero degdeg ah.' },
    ],
    ctaTitle: 'Maanta bilow — bilaash',
    ctaSub: 'Ganacsadayaasha 500+ ka badan ee Muqdisho, Hargeysa, Boosaaso iyo magaalooyinka kale ayaa maalin kasta garanaya faa\'idadooda. Adna sidaas yeelo.',
    ctaButton: 'Isdiiwaangeli Hadda — Bilaash',
    ctaNote: '✓ Kaarka laguma baahna  ·  ✓ 2 daqiiqo  ·  ✓ Jooji goor kasta',
    footerTagline: 'Nidaamka xisaabinta sahlan ee ganacsiga Soomaalida.',
    footerCompany: 'Shirkadda',
    footerAbout: 'Naga', footerContact: 'Nala Xiriir',
    footerLegal: 'Sharci', footerPrivacy: 'Xeerka Asturnaanta', footerTerms: 'Shuruudaha',
    footerSupport: 'Taageero', footerEmail: 'hello@xisaabaati.com',
    footerWhatsApp: 'WhatsApp: +252 61 000 0000',
    footerRights: `© ${new Date().getFullYear()} Xisaabaati. Xuquuqda oo dhan way xafiidan yihiin.`,
    footerCities: 'Muqdisho · Hargeysa · Boosaaso · Kismaayo · Galkacyo · Berbera · Burco',
  },

  ar: {
    dir: 'rtl',
    font: "'Noto Sans Arabic',system-ui,sans-serif",
    navLogin: 'دخول',
    badge: '🚀 أكثر من 500 تاجر يستخدمون Xisaabaati في الصومال',
    heroH1a: 'هل تعرف كم ربحت',
    heroH1b: 'اليوم؟',
    heroSub: 'Xisaabaati يخبرك بأرباحك الحقيقية — بعد كل بيعة، كل مدفوعة، كل مصروف.',
    heroCTA: 'ابدأ مجاناً — الآن',
    heroNote: '✓ بدون بطاقة ائتمان  ·  ✓ دقيقتان للبدء',
    dashLabel: 'ربح اليوم',
    dashSales: 'المبيعات', dashExpenses: 'المصاريف', dashProfit: 'الربح',
    trust1: '500+', trust1l: 'تاجر',
    trust2: '7+',   trust2l: 'مدينة',
    trust3: '$2M+', trust3l: 'تم تتبعه',
    trust4: '4.9★', trust4l: 'التقييم',
    painTitle: 'هل هذا وضعك الآن؟',
    pains: [
      { emoji: '😰', title: 'حسابات صعبة', body: 'في نهاية اليوم لا تعرف كم ربحت — ورقة وقلم وفوضى' },
      { emoji: '📝', title: 'دفتر يدوي', body: 'المصاريف والمبيعات مختلطة — لا شيء واضح' },
      { emoji: '😤', title: 'بدون ربح واضح', body: 'بعت كل بضاعتك لكن ما تعرف الربح الحقيقي' },
      { emoji: '⏰', title: 'تضييع وقت', body: 'الحسابات اليدوية وقت ضايع من التجارة' },
    ],
    painCTA: 'حل المشكلة — ابدأ مجاناً',
    simpleTitle: 'ثلاث خطوات — اعرف ربحك',
    steps: [
      { n: '1', title: 'سجّل المبيعات', body: 'أضف البيع — المنتج، السعر، الكمية. 10 ثواني' },
      { n: '2', title: 'سجّل المصاريف', body: 'وقود، إيجار، بضاعة — أضف المصاريف اليومية' },
      { n: '3', title: 'شوف الربح', body: 'النظام يحسب تلقائياً — شوف صافي ربحك اليوم' },
    ],
    simpleNote: '✓ لا تدريب مطلوب. التجار يتعلمون خلال دقيقتين.',
    featTitle: 'ماذا يفعل Xisaabaati لك',
    feats: [
      { emoji: '📊', title: 'الربح الفوري', body: 'الربح يظهر فوراً بعد كل بيعة — بشكل تلقائي' },
      { emoji: '📱', title: 'موبايل أولاً', body: 'يعمل على هاتفك — iOS و Android كليهما' },
      { emoji: '📦', title: 'إدارة البضاعة', body: 'تتبع المنتجات والأسعار والمخزون بسهولة' },
      { emoji: '💸', title: 'المصاريف اليومية', body: 'أضف المصاريف — النظام يطرحها من الربح' },
      { emoji: '📈', title: 'التقارير', body: 'تقارير أسبوعية وشهرية — طوّر تجارتك' },
      { emoji: '👥', title: 'العملاء', body: 'سجل عملاءك — الديون وتاريخهم' },
      { emoji: '🌐', title: 'يعمل بلا إنترنت', body: 'يعمل بدون إنترنت — مصمم للصومال' },
      { emoji: '🔒', title: 'آمن', body: 'بياناتك محمية — محفوظة في السحابة' },
    ],
    testiTitle: 'ماذا قال التجار',
    testimonials: [
      { name: 'عائشة محمد', biz: 'بقالة الأمل · مقديشو', quote: 'كنت ما أعرف ربحي — الآن كل يوم أشوف الأرقام الحقيقية. النظام سهّل عليّ كثير.', stars: 5 },
      { name: 'عبدالرزاق حسن', biz: 'صيدلية الشفاء · هرجيسا', quote: 'الحسابات اليدوية كانت صعبة. Xisaabaati سهّل عليّ — تعلمته في 10 دقائق.', stars: 5 },
      { name: 'فاطمة علي', biz: 'محل الملابس · بوصاصو', quote: 'ربطت مصاريفي ومبيعاتي. الآن أعرف ربحي الحقيقي كل يوم.', stars: 5 },
    ],
    pricingTitle: 'اختر الخطة المناسبة لك',
    pricingSub: 'ابدأ مجاناً. طوّر عندما تحتاج.',
    monthly: '📆 شهري', annual: '📅 سنوي', discount: '30% خصم',
    perMonth: '/شهر', perYear: '/سنة', popular: '⭐ الأكثر شيوعاً',
    savedLabel: 'توفير',
    plans: [
      { id:'free',    name:'مجاني',   price:0,  annualPrice:0,    popular:false, color:'#475569', cta:'ابدأ مجاناً',  features:['20 مبيعة شهرياً','تتبع المبيعات','إدارة المنتجات','إدارة العملاء'] },
      { id:'starter', name:'المبتدئ', price:9,  annualPrice:6.3,  popular:false, color:'#1d4ed8', cta:'ابدأ الآن',   features:['مبيعات غير محدودة','تقارير أساسية','1 مستخدم · 1 فرع','دعم واتساب'] },
      { id:'basic',   name:'الأساسي', price:19, annualPrice:13.3, popular:true,  color:'#7c3aed', cta:'ابدأ الآن',   features:['كل مميزات المبتدئ','تقارير متقدمة','3 مستخدمين · 3 فروع','فواتير وأولوية دعم'] },
      { id:'pro',     name:'Pro',     price:39, annualPrice:27.3, popular:false, color:G,         cta:'ابدأ الآن',   features:['كل مميزات الأساسي','7 مستخدمين · 7 فروع','تصدير Excel/PDF','مدير حساب مخصص'] },
    ],
    noCreditCard: '✓ بدون بطاقة ائتمان  ·  ✓ EVC أو Zaad أو Sahal  ·  ✓ إلغاء في أي وقت',
    faqTitle: 'الأسئلة الشائعة',
    faqs: [
      { q: 'هل أحتاج إنترنت؟', a: 'لا — يعمل بدون إنترنت. البيانات تُحفظ على هاتفك وتُزامن مع السحابة عند الاتصال.' },
      { q: 'كيف أدفع؟', a: 'يمكنك الدفع بـ EVC Plus أو Zaad أو Sahal أو Western Union. بطاقة الائتمان غير مطلوبة.' },
      { q: 'كيف أبدأ؟', a: 'سجّل — بدون بطاقة ائتمان. خلال دقيقتين تبدأ تسجيل مبيعاتك.' },
      { q: 'هل يناسب نوع تجارتي؟', a: 'نعم — البقالة، المطعم، الصيدلية، المستودع، الخدمات، الاستيراد — كلها مناسبة.' },
      { q: 'هل يمكنني تغيير الخطة؟', a: 'نعم، في أي وقت يمكنك الترقية أو التخفيض. بدون عقود.' },
      { q: 'هل أفقد بياناتي إذا توقفت؟', a: 'بياناتك في السحابة — يمكنك تنزيلها في أي وقت. نحذفها بعد 90 يوماً.' },
      { q: 'هل يوجد دعم؟', a: 'نعم — دعم عبر واتساب والبريد الإلكتروني. الخطط المدفوعة تحصل على دعم فوري.' },
    ],
    ctaTitle: 'ابدأ اليوم — مجاناً',
    ctaSub: 'أكثر من 500 تاجر في مقديشو وهرجيسا وبوصاصو يعرفون أرباحهم اليومية. انضم إليهم.',
    ctaButton: 'سجّل الآن — مجاناً',
    ctaNote: '✓ بدون بطاقة ائتمان  ·  ✓ دقيقتان  ·  ✓ إلغاء في أي وقت',
    footerTagline: 'نظام محاسبة بسيط للتجار الصوماليين.',
    footerCompany: 'الشركة', footerAbout: 'من نحن', footerContact: 'تواصل معنا',
    footerLegal: 'قانوني', footerPrivacy: 'سياسة الخصوصية', footerTerms: 'الشروط والأحكام',
    footerSupport: 'الدعم', footerEmail: 'hello@xisaabaati.com',
    footerWhatsApp: 'واتساب: +252 61 000 0000',
    footerRights: `© ${new Date().getFullYear()} Xisaabaati. جميع الحقوق محفوظة.`,
    footerCities: 'مقديشو · هرجيسا · بوصاصو · كيسمايو · غلقيو · بربرة · بوراو',
  },

  en: {
    dir: 'ltr',
    font: "system-ui,sans-serif",
    navLogin: 'Login',
    badge: '🚀 500+ merchants using Xisaabaati across Somalia',
    heroH1a: 'Do you know how much',
    heroH1b: 'you profited today?',
    heroSub: 'Xisaabaati tells you your real profit — after every sale, every payment, every expense.',
    heroCTA: 'Start Free — Today',
    heroNote: '✓ No credit card  ·  ✓ 2 minutes to start',
    dashLabel: "Today's Profit",
    dashSales: 'Sales', dashExpenses: 'Expenses', dashProfit: 'Profit',
    trust1: '500+', trust1l: 'Merchants',
    trust2: '7+',   trust2l: 'Cities',
    trust3: '$2M+', trust3l: 'Tracked',
    trust4: '4.9★', trust4l: 'Rating',
    painTitle: 'Sound familiar?',
    pains: [
      { emoji: '😰', title: 'Hard accounting', body: "At end of day you don't know your profit — just a piece of paper" },
      { emoji: '📝', title: 'Manual notebook', body: 'Expenses and sales all mixed — nothing is clear' },
      { emoji: '😤', title: 'No clear profit', body: "You sold everything but don't know the real profit" },
      { emoji: '⏰', title: 'Wasted time', body: 'Manual calculations waste time that could grow your business' },
    ],
    painCTA: 'Solve it now — Start free',
    simpleTitle: 'Three steps — know your profit',
    steps: [
      { n: '1', title: 'Enter Sales', body: 'Add a sale — product, price, quantity. 10 seconds' },
      { n: '2', title: 'Enter Expenses', body: 'Fuel, rent, stock — add daily expenses' },
      { n: '3', title: 'See Profit', body: "System calculates automatically — see today's net profit" },
    ],
    simpleNote: '✓ No training needed. Merchants learn in 2 minutes.',
    featTitle: 'What Xisaabaati does for you',
    feats: [
      { emoji: '📊', title: 'Instant Profit', body: 'Profit appears after every sale — automatically' },
      { emoji: '📱', title: 'Mobile First', body: 'Works on your phone — iOS and Android' },
      { emoji: '📦', title: 'Product Management', body: 'Track products, prices and stock easily' },
      { emoji: '💸', title: 'Daily Expenses', body: 'Add expenses — system deducts from profit' },
      { emoji: '📈', title: 'Reports', body: 'Weekly and monthly reports — grow your business' },
      { emoji: '👥', title: 'Customers', body: 'Track your customers — debts and history' },
      { emoji: '🌐', title: 'Works Offline', body: 'Works without internet — built for Somalia' },
      { emoji: '🔒', title: 'Secure', body: 'Your data is protected — stored in the cloud' },
    ],
    testiTitle: 'What merchants say',
    testimonials: [
      { name: 'Caasha Mohamed', biz: 'Food Shop · Mogadishu', quote: "I never knew my profit before — now every day I see real numbers. The system made it so easy for me.", stars: 5 },
      { name: 'Abdirisaq Hassan', biz: 'Al-Shifa Pharmacy · Hargeisa', quote: "Manual bookkeeping was hard. Xisaabaati made it easy — learned it in 10 minutes.", stars: 5 },
      { name: 'Fadumo Ali', biz: 'Clothing Store · Bosaso', quote: "I linked my expenses and sales. Now I know my real profit every day.", stars: 5 },
    ],
    pricingTitle: 'Choose your plan',
    pricingSub: 'Start free. Upgrade when you need.',
    monthly: '📆 Monthly', annual: '📅 Annual', discount: '30% off',
    perMonth: '/mo', perYear: '/year', popular: '⭐ Most Popular',
    savedLabel: 'saved',
    plans: [
      { id:'free',    name:'Free',    price:0,  annualPrice:0,    popular:false, color:'#475569', cta:'Start Free',   features:['20 sales/month','Sales tracking','Product management','Customer management'] },
      { id:'starter', name:'Starter', price:9,  annualPrice:6.3,  popular:false, color:'#1d4ed8', cta:'Start Now',   features:['Unlimited sales','Basic reports','1 user · 1 branch','WhatsApp support'] },
      { id:'basic',   name:'Basic',   price:19, annualPrice:13.3, popular:true,  color:'#7c3aed', cta:'Start Now',   features:['Everything in Starter','Advanced reports','3 users · 3 branches','Invoices & priority support'] },
      { id:'pro',     name:'Pro',     price:39, annualPrice:27.3, popular:false, color:G,         cta:'Start Now',   features:['Everything in Basic','7 users · 7 branches','Export Excel/PDF','Dedicated account manager'] },
    ],
    noCreditCard: '✓ No credit card  ·  ✓ Pay via EVC, Zaad, Sahal  ·  ✓ Cancel anytime',
    faqTitle: 'Frequently Asked Questions',
    faqs: [
      { q: 'Do I need internet?', a: 'No — Xisaabaati works offline. Data is saved on your phone and synced to the cloud when connected.' },
      { q: 'How do I pay?', a: 'You can pay via EVC Plus, Zaad, Sahal, or Western Union. No credit card required.' },
      { q: 'How do I start?', a: 'Register — no credit card. Within 2 minutes you can start recording sales.' },
      { q: 'Is it right for my business?', a: 'Yes — shop, restaurant, pharmacy, warehouse, services, import/export — all supported.' },
      { q: 'Can I change plans?', a: 'Yes, upgrade or downgrade anytime. No contracts.' },
      { q: 'Will I lose data if I cancel?', a: 'Your data is in the cloud — download anytime. We delete it after 90 days.' },
      { q: 'Is there support?', a: 'Yes — WhatsApp and email support. Paid plans get priority support.' },
    ],
    ctaTitle: 'Start today — free',
    ctaSub: 'Over 500 merchants in Mogadishu, Hargeisa, Bosaso and beyond know their daily profit. Join them.',
    ctaButton: 'Sign Up Now — Free',
    ctaNote: '✓ No credit card  ·  ✓ 2 minutes  ·  ✓ Cancel anytime',
    footerTagline: 'Simple accounting for Somali merchants.',
    footerCompany: 'Company', footerAbout: 'About', footerContact: 'Contact',
    footerLegal: 'Legal', footerPrivacy: 'Privacy Policy', footerTerms: 'Terms',
    footerSupport: 'Support', footerEmail: 'hello@xisaabaati.com',
    footerWhatsApp: 'WhatsApp: +252 61 000 0000',
    footerRights: `© ${new Date().getFullYear()} Xisaabaati. All rights reserved.`,
    footerCities: 'Mogadishu · Hargeisa · Bosaso · Kismayo · Galkayo · Berbera · Burco',
  },
}

// ── Reusable helpers ─────────────────────────────────────────────────────────
const sectionStyle = (bg = '#fff') => ({
  background: bg,
  padding: '72px 24px',
})

const Stars = ({ n }) => (
  <span style={{ color: '#f59e0b', fontSize: 15 }}>{'★'.repeat(n)}</span>
)

// ── Main component ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate()
  const { lang, changeLang } = useLang()
  const [billing, setBilling] = useState('monthly')
  const [openFaq, setOpenFaq] = useState(null)

  const c = CONTENT[lang] || CONTENT.so
  const isRTL = c.dir === 'rtl'
  const go = () => navigate('/login')

  // ── SEO: dynamic title + schema.org JSON-LD ────────────────────────────────
  useEffect(() => {
    const titles = {
      so: "Xisaabaati — Ma ogtahay faa'idadaada maanta? | Nidaamka Ganacsiga",
      ar: 'Xisaabaati — هل تعرف ربحك اليوم؟ | نظام المحاسبة',
      en: 'Xisaabaati — Do you know your profit today? | Business Accounting',
    }
    document.title = titles[lang] || titles.so

    const prev = document.getElementById('xb-schema')
    if (prev) prev.remove()
    const s = document.createElement('script')
    s.id = 'xb-schema'
    s.type = 'application/ld+json'
    s.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          name: 'Xisaabaati',
          url: 'https://www.xisaabaati.com',
          contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', email: 'hello@xisaabaati.com' },
          areaServed: ['SO', 'ET', 'KE', 'DJ'],
        },
        {
          '@type': 'SoftwareApplication',
          name: 'Xisaabaati',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'iOS, Android, Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          description: 'Simple profit tracking app for Somali merchants. Track sales, expenses and profit in real time.',
          aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '500' },
        },
        {
          '@type': 'FAQPage',
          mainEntity: c.faqs.map(f => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
      ],
    })
    document.head.appendChild(s)
    return () => { const el = document.getElementById('xb-schema'); if (el) el.remove() }
  }, [lang, c.faqs])

  return (
    <div
      dir={c.dir}
      style={{ fontFamily: c.font, overflowX: 'hidden', background: '#fff', color: DARK }}
    >

      {/* ══════════════════════════════════════════════════════════════
          NAV
      ══════════════════════════════════════════════════════════════ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #f1f5f9',
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{ width: 34, height: 34, background: G, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 17 }}>Xisaabaati</span>
        </div>

        {/* Lang + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {Object.entries(languageFlags).map(([k, flag]) => (
            <button key={k} onClick={() => changeLang(k)} style={{
              background: lang === k ? G : 'transparent',
              border: `1.5px solid ${lang === k ? G : '#e2e8f0'}`,
              borderRadius: 8, padding: '4px 9px', cursor: 'pointer',
              fontSize: 11, fontWeight: 700,
              color: lang === k ? '#fff' : '#64748b',
            }}>
              {flag} {k.toUpperCase()}
            </button>
          ))}
          <button onClick={go} style={{
            background: G, color: '#fff', border: 'none', borderRadius: 10,
            padding: '8px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            marginInlineStart: 4,
          }}>
            {c.navLogin} →
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(160deg, #f0fdf4 0%, #ffffff 60%)',
        padding: '80px 24px 64px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-block', background: '#f0fdf4', color: G,
            fontSize: 12, fontWeight: 700, padding: '6px 18px',
            borderRadius: 20, marginBottom: 24, border: '1px solid #bbf7d0',
          }}>
            {c.badge}
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2rem, 6vw, 3.2rem)', fontWeight: 900,
            lineHeight: 1.15, marginBottom: 20,
            background: `linear-gradient(135deg, ${DARK} 0%, #166534 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            {c.heroH1a}<br />{c.heroH1b}
          </h1>

          <p style={{ fontSize: 18, color: '#475569', marginBottom: 32, lineHeight: 1.7, maxWidth: 500, margin: '0 auto 32px' }}>
            {c.heroSub}
          </p>

          <button onClick={go} style={{
            background: G, color: '#fff', border: 'none', borderRadius: 14,
            padding: '16px 44px', fontWeight: 800, fontSize: 18, cursor: 'pointer',
            boxShadow: '0 6px 28px rgba(22,163,74,.4)',
            transition: 'transform .15s',
          }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {c.heroCTA}
          </button>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12 }}>{c.heroNote}</p>

          {/* Dashboard preview card */}
          <div style={{
            margin: '44px auto 0', maxWidth: 320,
            background: '#fff', borderRadius: 24, padding: 28,
            boxShadow: '0 20px 60px rgba(0,0,0,.1)',
            textAlign: isRTL ? 'right' : 'left',
            border: '1px solid #f0fdf4',
          }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, letterSpacing: .5, textTransform: 'uppercase' }}>
              {c.dashLabel}
            </div>
            <div style={{ fontSize: 48, fontWeight: 900, color: G, lineHeight: 1, marginBottom: 20 }}>
              $17.40
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { l: c.dashSales,    v: '$62', sub: '5 ' + c.dashSales.toLowerCase() },
                { l: c.dashExpenses, v: '$44', sub: '3 ' + c.dashExpenses.toLowerCase() },
                { l: c.dashProfit,   v: '$18', c: G },
              ].map((s, i) => (
                <div key={i} style={{
                  flex: 1, background: i === 2 ? '#f0fdf4' : '#f8fafc',
                  borderRadius: 12, padding: '10px 8px', textAlign: 'center',
                }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: i === 2 ? G : DARK }}>{s.v}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
            {/* Mini sparkline */}
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-end', gap: 4, height: 36 }}>
              {[30, 50, 40, 70, 60, 85, 75].map((h, i) => (
                <div key={i} style={{
                  flex: 1, height: `${h}%`,
                  background: i === 6 ? G : '#dcfce7',
                  borderRadius: 3,
                }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TRUST BAR
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: DARK, padding: '28px 24px' }}>
        <div style={{
          maxWidth: 800, margin: '0 auto',
          display: 'flex', justifyContent: 'center',
          flexWrap: 'wrap', gap: '8px 40px',
        }}>
          {[
            [c.trust1, c.trust1l],
            [c.trust2, c.trust2l],
            [c.trust3, c.trust3l],
            [c.trust4, c.trust4l],
          ].map(([val, lbl], i) => (
            <div key={i} style={{ textAlign: 'center', minWidth: 80 }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#4ade80' }}>{val}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PAIN SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section style={sectionStyle('#fafafa')}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.4rem,4vw,2rem)', fontWeight: 900, marginBottom: 48 }}>
            {c.painTitle}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
            gap: 20,
          }}>
            {c.pains.map((p, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 20, padding: 24,
                border: '1px solid #fee2e2',
                boxShadow: '0 2px 12px rgba(239,68,68,.06)',
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{p.emoji}</div>
                <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 8, color: '#dc2626' }}>{p.title}</h3>
                <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.7 }}>{p.body}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <button onClick={go} style={{
              background: '#dc2626', color: '#fff', border: 'none', borderRadius: 12,
              padding: '14px 36px', fontWeight: 700, fontSize: 15, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(220,38,38,.3)',
            }}>{c.painCTA}</button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SIMPLE MODE — 3 STEPS
      ══════════════════════════════════════════════════════════════ */}
      <section style={sectionStyle('#fff')}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.4rem,4vw,2rem)', fontWeight: 900, marginBottom: 16 }}>
            {c.simpleTitle}
          </h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 52, fontSize: 14 }}>{c.simpleNote}</p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
            gap: 24,
          }}>
            {c.steps.map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '8px 16px' }}>
                <div style={{
                  width: 64, height: 64, background: G, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: 26, fontWeight: 900, color: '#fff',
                  boxShadow: '0 6px 24px rgba(22,163,74,.35)',
                }}>{s.n}</div>
                <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════════════ */}
      <section style={sectionStyle('#f8fafc')}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.4rem,4vw,2rem)', fontWeight: 900, marginBottom: 48 }}>
            {c.featTitle}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
            gap: 18,
          }}>
            {c.feats.map((f, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 20, padding: 24,
                border: '1px solid #f1f5f9',
                boxShadow: '0 2px 12px rgba(0,0,0,.04)',
                transition: 'box-shadow .2s',
              }}
                onMouseOver={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(22,163,74,.12)'}
                onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.04)'}
              >
                <div style={{ fontSize: 34, marginBottom: 12 }}>{f.emoji}</div>
                <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{f.title}</h3>
                <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════════════ */}
      <section style={sectionStyle('#fff')}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.4rem,4vw,2rem)', fontWeight: 900, marginBottom: 48 }}>
            {c.testiTitle}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
            gap: 24,
          }}>
            {c.testimonials.map((t, i) => (
              <div key={i} style={{
                background: '#f8fafc', borderRadius: 20, padding: 28,
                border: '1px solid #f1f5f9',
                display: 'flex', flexDirection: 'column', gap: 16,
              }}>
                <Stars n={t.stars} />
                <p style={{ color: '#374151', fontSize: 14, lineHeight: 1.8, fontStyle: 'italic', flex: 1 }}>
                  "{t.quote}"
                </p>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{t.biz}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════════════════ */}
      <section style={sectionStyle('#f8fafc')}>
        <div style={{ maxWidth: 940, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.4rem,4vw,2rem)', fontWeight: 900, marginBottom: 8 }}>
            {c.pricingTitle}
          </h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 36 }}>{c.pricingSub}</p>

          {/* Billing toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
            <div style={{
              display: 'inline-flex', background: '#fff', borderRadius: 14, padding: 4,
              border: '1.5px solid #e2e8f0', gap: 4,
            }}>
              {['monthly', 'annual'].map(b => (
                <button key={b} onClick={() => setBilling(b)} style={{
                  padding: '10px 22px', borderRadius: 10, border: 'none',
                  background: billing === b ? G : 'transparent',
                  color: billing === b ? '#fff' : '#64748b',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                  {b === 'monthly' ? c.monthly : (
                    <span>{c.annual}{' '}
                      <span style={{
                        background: billing === 'annual' ? 'rgba(255,255,255,.25)' : '#dcfce7',
                        color: billing === 'annual' ? '#fff' : '#15803d',
                        fontSize: 10, padding: '2px 7px', borderRadius: 20,
                      }}>{c.discount}</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Plan cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))',
            gap: 16, alignItems: 'start',
          }}>
            {c.plans.map(p => (
              <div key={p.id} style={{
                background: '#fff', borderRadius: 22, padding: '28px 22px', position: 'relative',
                border: `2px solid ${p.popular ? p.color : '#f1f5f9'}`,
                boxShadow: p.popular ? `0 12px 40px ${p.color}22` : '0 2px 8px rgba(0,0,0,.04)',
                transform: p.popular ? 'scale(1.03)' : 'scale(1)',
              }}>
                {p.popular && (
                  <div style={{
                    position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
                    background: p.color, color: '#fff', fontSize: 10, fontWeight: 700,
                    padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap',
                  }}>{c.popular}</div>
                )}
                <div style={{ fontWeight: 900, fontSize: 18, color: p.color, marginBottom: 6 }}>{p.name}</div>
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 38, fontWeight: 900 }}>
                    ${billing === 'annual' ? p.annualPrice : p.price}
                  </span>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>{c.perMonth}</span>
                  {billing === 'annual' && p.price > 0 && (
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                      ${+(p.annualPrice * 12).toFixed(0)}{c.perYear} ·{' '}
                      <s style={{ color: '#94a3b8' }}>${p.price * 12}</s>
                    </div>
                  )}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px' }}>
                  {p.features.map((f, i) => (
                    <li key={i} style={{
                      fontSize: 13, color: '#475569', marginBottom: 8,
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                    }}>
                      <span style={{ color: G, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={go} style={{
                  width: '100%', padding: '12px 0', borderRadius: 12,
                  border: p.popular ? 'none' : `1.5px solid #e2e8f0`,
                  background: p.popular ? p.color : '#f8fafc',
                  color: p.popular ? '#fff' : '#374151',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  transition: 'opacity .15s',
                }}
                  onMouseOver={e => e.currentTarget.style.opacity = '.85'}
                  onMouseOut={e => e.currentTarget.style.opacity = '1'}
                >{p.cta}</button>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: 28, fontSize: 12, color: '#94a3b8' }}>
            {c.noCreditCard}
          </p>
          {/* Add-ons */}
          <div style={{ textAlign:'center', marginTop:12, display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
            <span style={{ background:'#f0fdf4', color:G, fontSize:12, fontWeight:700, padding:'5px 14px', borderRadius:20 }}>
              + {lang==='ar'?'مستخدم إضافي':lang==='so'?'Isticmaale dheeraad ah':'Extra user'} $3/mo
            </span>
            <span style={{ background:'#eff6ff', color:'#1d4ed8', fontSize:12, fontWeight:700, padding:'5px 14px', borderRadius:20 }}>
              + {lang==='ar'?'فرع إضافي':lang==='so'?'Laansho dheeraad ah':'Extra branch'} $5/mo
            </span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════════ */}
      <section style={sectionStyle('#fff')}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.4rem,4vw,2rem)', fontWeight: 900, marginBottom: 44 }}>
            {c.faqTitle}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {c.faqs.map((f, i) => (
              <div key={i} style={{
                border: `1.5px solid ${openFaq === i ? G : '#f1f5f9'}`,
                borderRadius: 16, overflow: 'hidden',
                transition: 'border-color .2s',
              }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{
                  width: '100%', background: openFaq === i ? '#f0fdf4' : '#fff',
                  border: 'none', padding: '18px 22px', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  gap: 12, textAlign: isRTL ? 'right' : 'left',
                  transition: 'background .2s',
                }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: DARK }}>{f.q}</span>
                  <span style={{
                    fontSize: 20, color: G, fontWeight: 300, flexShrink: 0,
                    transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)',
                    transition: 'transform .2s',
                  }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '4px 22px 20px', background: '#f0fdf4' }}>
                    <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.8, margin: 0 }}>{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════ */}
      <section style={{
        background: `linear-gradient(135deg, #14532d 0%, ${G} 100%)`,
        padding: '80px 24px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🚀</div>
          <h2 style={{ fontSize: 'clamp(1.6rem,5vw,2.4rem)', fontWeight: 900, color: '#fff', marginBottom: 16 }}>
            {c.ctaTitle}
          </h2>
          <p style={{ color: '#a7f3d0', fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>
            {c.ctaSub}
          </p>
          <button onClick={go} style={{
            background: '#fff', color: G, border: 'none', borderRadius: 14,
            padding: '18px 48px', fontWeight: 800, fontSize: 18, cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(0,0,0,.2)',
            transition: 'transform .15s',
          }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {c.ctaButton}
          </button>
          <p style={{ fontSize: 12, color: '#6ee7b7', marginTop: 16 }}>{c.ctaNote}</p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════ */}
      <footer style={{ background: DARK, color: '#94a3b8', padding: '52px 24px 28px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
            gap: 36, marginBottom: 40,
          }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, background: G, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                    <polyline points="17 6 23 6 23 12"/>
                  </svg>
                </div>
                <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>Xisaabaati</span>
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.8, color: '#64748b' }}>{c.footerTagline}</p>
              <p style={{ fontSize: 11, color: '#475569', marginTop: 10, lineHeight: 1.9 }}>{c.footerCities}</p>
            </div>

            {/* Company */}
            <div>
              <div style={{ fontWeight: 700, color: '#fff', marginBottom: 14, fontSize: 13 }}>{c.footerCompany}</div>
              {[
                { to: '/about',   label: c.footerAbout },
                { to: '/contact', label: c.footerContact },
              ].map(l => (
                <div key={l.to} style={{ marginBottom: 10 }}>
                  <Link to={l.to} style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}
                    onMouseOver={e => e.target.style.color = '#fff'}
                    onMouseOut={e => e.target.style.color = '#64748b'}
                  >{l.label}</Link>
                </div>
              ))}
            </div>

            {/* Legal */}
            <div>
              <div style={{ fontWeight: 700, color: '#fff', marginBottom: 14, fontSize: 13 }}>{c.footerLegal}</div>
              {[
                { to: '/privacy', label: c.footerPrivacy },
                { to: '/terms',   label: c.footerTerms },
              ].map(l => (
                <div key={l.to} style={{ marginBottom: 10 }}>
                  <Link to={l.to} style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}
                    onMouseOver={e => e.target.style.color = '#fff'}
                    onMouseOut={e => e.target.style.color = '#64748b'}
                  >{l.label}</Link>
                </div>
              ))}
            </div>

            {/* Support */}
            <div>
              <div style={{ fontWeight: 700, color: '#fff', marginBottom: 14, fontSize: 13 }}>{c.footerSupport}</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 2.2 }}>
                📧 {c.footerEmail}<br />
                💬 {c.footerWhatsApp}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: '1px solid #1e293b', paddingTop: 22,
            display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
            fontSize: 12, color: '#475569', alignItems: 'center',
          }}>
            <span>{c.footerRights}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {Object.entries(languageFlags).map(([k, flag]) => (
                <button key={k} onClick={() => changeLang(k)} style={{
                  background: lang === k ? '#1e293b' : 'transparent',
                  border: `1px solid ${lang === k ? '#334155' : 'transparent'}`,
                  borderRadius: 6, padding: '3px 8px',
                  cursor: 'pointer', fontSize: 11, color: '#64748b',
                }}>
                  {flag} {k.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
