import CreateEventForm from '../components/CreateEventForm'

export default function HomePage() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/"><span className="brand-mark">A</span><span>AtTheSameTime</span></a>
        <span className="topbar-note">Scheduling without timezone math.</span>
      </header>
      <div className="home-layout">
        <section className="home-copy">
          <span className="eyebrow">Availability, simplified</span>
          <h1>Find the time that works for everyone.</h1>
          <p className="lead">Create a poll, share one link, and let everyone paint their availability in their own local timezone.</p>
          <div className="feature-row"><span>30-minute slots</span><span>Automatic timezone conversion</span><span>Live group overlap</span></div>
        </section>
        <CreateEventForm />
      </div>
    </main>
  )
}
