import { useLanguage } from '../i18n'

export default function LanguageSwitch() {
  const { language, setLanguage } = useLanguage()
  const toggle = () => setLanguage(language === 'en' ? 'es' : 'en')

  return (
    <>
      <div className={`language-switch mechanical-language-switch desktop-language-switch is-${language}`} aria-label="Language / Idioma">
        <span className="panel-screw screw-tl" aria-hidden="true" />
        <span className="panel-screw screw-tr" aria-hidden="true" />
        <span className="panel-screw screw-bl" aria-hidden="true" />
        <span className="panel-screw screw-br" aria-hidden="true" />

        <button
          type="button"
          className="language-choice language-choice-en"
          onClick={() => setLanguage('en')}
          aria-pressed={language === 'en'}
        >
          <span className="language-label">EN</span>
          <i className="language-lamp" aria-hidden="true"><span /></i>
        </button>

        <button
          type="button"
          className="language-toggle"
          onClick={toggle}
          aria-label={language === 'en' ? 'Cambiar a español' : 'Switch to English'}
        >
          <span className="toggle-bezel" aria-hidden="true">
            <span className="toggle-socket">
              <span className="toggle-lever">
                <span className="toggle-knob" />
              </span>
            </span>
          </span>
        </button>

        <button
          type="button"
          className="language-choice language-choice-es"
          onClick={() => setLanguage('es')}
          aria-pressed={language === 'es'}
        >
          <span className="language-label">ES</span>
          <i className="language-lamp" aria-hidden="true"><span /></i>
        </button>
      </div>

      <div className="mobile-language-switch" aria-label="Language / Idioma">
        <button
          type="button"
          className={language === 'en' ? 'active' : ''}
          onClick={() => setLanguage('en')}
          aria-pressed={language === 'en'}
        >
          EN
        </button>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          className={language === 'es' ? 'active' : ''}
          onClick={() => setLanguage('es')}
          aria-pressed={language === 'es'}
        >
          ES
        </button>
      </div>
    </>
  )
}
