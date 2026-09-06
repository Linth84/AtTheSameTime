import { useState } from 'react'
import { Link } from 'react-router-dom'
import CreateEventForm from '../components/CreateEventForm'
import NixieClock from '../components/NixieClock'
import ClockworkGlobe from '../components/ClockworkGlobe'
import LanguageSwitch from '../components/LanguageSwitch'
import { useLanguage } from '../i18n'

export default function HomePage() {
  const { t } = useLanguage()
  const [infoPanel, setInfoPanel] = useState<'how' | 'about' | null>(null)

  return (
    <main className="app-shell machine-viewport">
      <div className="reference-machine-page final-machine-page">
      <div className="single-machine-frame" aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}machine-frame-clean.png`} alt="" />
      </div>

      <div className="machine-content-shell">
        <header className="topbar machine-topbar reference-topbar final-topbar">
          <Link className="brand" to="/" aria-label="AtTheSameTime home">
            <NixieClock />
            <span className="brand-copy">
              <span className="brand-name">AtTheSameTime</span>
              <small>{t('tagline')}</small>
            </span>
          </Link>
        <LanguageSwitch />
        </header>

        <section className="machine-hero reference-hero final-hero" id="home">
          <div className="hero-copy">
            <h1>{t('hero1')}<span className="headline-accent">{t('hero2')}</span></h1>
            <p className="lead">{t('heroLead')}</p>
          </div>
          <ClockworkGlobe />
          <aside className="reference-side-plates" aria-hidden="true">
            <div><span>DIFFERENT</span><span>TIME ZONES</span><b>SAME</b><span>POSSIBILITIES</span></div>
            <div><span>A MORE</span><span>CONNECTED</span><span>WORLD</span><i /></div>
          </aside>
        </section>

        <section className="creation-console reference-console final-console" id="create">
          <CreateEventForm />
        </section>

        <nav className="machine-nav machine-nav-bottom" aria-label={t('mainNav')}>
          <a href="#home">{t('home')}</a>
          <button type="button" onClick={() => setInfoPanel('how')}>{t('how')}</button>
          <button type="button" onClick={() => setInfoPanel('about')}>{t('about')}</button>
        </nav>

        {infoPanel && (
          <div className="machine-info-backdrop" role="presentation" onClick={() => setInfoPanel(null)}>
            <section
              className="machine-info-panel"
              role="dialog"
              aria-modal="true"
              aria-label={infoPanel === 'how' ? t('how') : t('about')}
              onClick={(event) => event.stopPropagation()}
            >
              <button className="machine-info-close" type="button" onClick={() => setInfoPanel(null)} aria-label={t('close')}>×</button>
              {infoPanel === 'how' ? (
                <>
                  <span className="eyebrow">{t('how')}</span>
                  <h2>{t('howTitle')}</h2>
                  <div className="machine-info-steps">
                    <div><b>01</b><strong>{t('step1')}</strong><p>{t('step1p')}</p></div>
                    <div><b>02</b><strong>{t('step2')}</strong><p>{t('step2p')}</p></div>
                    <div><b>03</b><strong>{t('step3')}</strong><p>{t('step3p')}</p></div>
                  </div>
                </>
              ) : (
                <>
                  <span className="eyebrow">{t('about')}</span>
                  <h2>{t('aboutTitle')}</h2>
                  <p className="machine-info-copy">{t('aboutCopy')}</p>
                </>
              )}
            </section>
          </div>
        )}

        <footer className="machine-footer reference-footer final-footer">
          <strong>AtTheSameTime</strong>
          <span>A MORE CONNECTED WORLD</span>
          <small>Built for humans in different time zones.</small>
        </footer>
      </div>
      </div>
    </main>
  )
}
