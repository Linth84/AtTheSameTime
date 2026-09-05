import { useState } from 'react'
import { Link } from 'react-router-dom'
import CreateEventForm from '../components/CreateEventForm'
import NixieClock from '../components/NixieClock'
import ClockworkGlobe from '../components/ClockworkGlobe'

export default function HomePage() {
  const [infoPanel, setInfoPanel] = useState<'how' | 'about' | null>(null)

  return (
    <main className="app-shell reference-machine-page final-machine-page">
      <div className="single-machine-frame" aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}machine-frame-clean.png`} alt="" />
      </div>

      <div className="machine-content-shell">
        <header className="topbar machine-topbar reference-topbar final-topbar">
          <Link className="brand" to="/" aria-label="AtTheSameTime home">
            <NixieClock />
            <span className="brand-copy">
              <span className="brand-name">AtTheSameTime</span>
              <small>Find the perfect time. Anywhere.</small>
            </span>
          </Link>
        </header>

        <section className="machine-hero reference-hero final-hero" id="home">
          <div className="hero-copy">
            <h1>Different time zones.<span className="headline-accent"> Same possibilities.</span></h1>
            <p className="lead">Create a poll, show your availability and let AtTheSameTime find the best moments for everyone, no matter where they are in the world.</p>
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

        <nav className="machine-nav machine-nav-bottom" aria-label="Main navigation">
          <a href="#home">Home</a>
          <button type="button" onClick={() => setInfoPanel('how')}>How it works</button>
          <button type="button" onClick={() => setInfoPanel('about')}>About</button>
        </nav>

        {infoPanel && (
          <div className="machine-info-backdrop" role="presentation" onClick={() => setInfoPanel(null)}>
            <section
              className="machine-info-panel"
              role="dialog"
              aria-modal="true"
              aria-label={infoPanel === 'how' ? 'How AtTheSameTime works' : 'About AtTheSameTime'}
              onClick={(event) => event.stopPropagation()}
            >
              <button className="machine-info-close" type="button" onClick={() => setInfoPanel(null)} aria-label="Close">×</button>
              {infoPanel === 'how' ? (
                <>
                  <span className="eyebrow">How it works</span>
                  <h2>Three steps. One shared moment.</h2>
                  <div className="machine-info-steps">
                    <div><b>01</b><strong>Create the poll</strong><p>Choose the possible dates and a broad daily time window.</p></div>
                    <div><b>02</b><strong>Share one link</strong><p>Everyone opens the same poll in their own local timezone.</p></div>
                    <div><b>03</b><strong>Find the overlap</strong><p>Participants mark availability and the best shared times appear automatically.</p></div>
                  </div>
                </>
              ) : (
                <>
                  <span className="eyebrow">About</span>
                  <h2>Scheduling without timezone math.</h2>
                  <p className="machine-info-copy">AtTheSameTime is a lightweight availability poll built for people in different time zones. No account is required to create or answer a poll.</p>
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
    </main>
  )
}
