import { useLang } from '../context/LangContext'
import { languageNames } from '../i18n/translations'

export default function LangSwitcher() {
  const { lang, changeLang } = useLang()

  return (
    <div className="lang-switcher">
      {Object.entries(languageNames).map(([code, name]) => (
        <button
          key={code}
          className={`lang-btn ${lang === code ? 'active' : ''}`}
          onClick={() => changeLang(code)}
        >
          {code === 'en' ? 'EN' : code === 'so' ? 'SO' : 'ع'}
        </button>
      ))}
    </div>
  )
}
