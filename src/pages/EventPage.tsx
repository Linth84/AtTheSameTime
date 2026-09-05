import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DateTime } from 'luxon'
import { supabase } from '../lib/supabase'
import { sha256 } from '../lib/hash'
import AvailabilityGrid from '../components/AvailabilityGrid'
import NixieClock from '../components/NixieClock'

type EventData = { id: string; slug: string; title: string; description: string | null; creator_timezone: string; is_closed: boolean; created_at: string }
type EventWindow = { id: string; event_id: string; start_at: string; end_at: string }
type Participant = { id: string; event_id: string; name: string; timezone: string; created_at: string }
const generateToken = () => crypto.randomUUID()

export default function EventPage() {
  const { slug } = useParams()
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, [])
  const displayTimezone = timezone.replaceAll('_', ' ')
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [windows, setWindows] = useState<EventWindow[]>([])
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [participantName, setParticipantName] = useState('')
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [joinLoading, setJoinLoading] = useState(false)
  const [error, setError] = useState('')
  const [joinError, setJoinError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const loadEvent = async () => {
      if (!slug) { setError('Invalid poll.'); setLoading(false); return }
      const { data, error: eventError } = await supabase.from('events').select('id, slug, title, description, creator_timezone, is_closed, created_at').eq('slug', slug).single()
      if (eventError || !data) { console.error(eventError); setError('Poll not found.'); setLoading(false); return }
      const { data: windowData, error: windowsError } = await supabase.from('event_windows').select('id, event_id, start_at, end_at').eq('event_id', data.id).order('start_at')
      if (windowsError) { console.error(windowsError); setError('Could not load the poll times.'); setLoading(false); return }
      setEventData(data)
      setWindows(windowData ?? [])

      const storedId = localStorage.getItem(`atthesametime:participant-id:${slug}`)
      if (storedId) {
        const { data: storedParticipant } = await supabase.from('participants').select('id, event_id, name, timezone, created_at').eq('id', storedId).eq('event_id', data.id).maybeSingle()
        if (storedParticipant) setParticipant(storedParticipant)
      }
      setLoading(false)
    }
    void loadEvent()
  }, [slug])

  const shareUrl = eventData && slug
    ? `${window.location.origin}${import.meta.env.BASE_URL}#/e/${slug}`
    : ''

  const handleCopyLink = async () => {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch (copyError) {
      console.error(copyError)
    }
  }

  const handleJoin = async () => {
    if (!eventData || !slug) return
    const cleanName = participantName.trim()
    if (!cleanName) { setJoinError('Please enter your name.'); return }
    setJoinLoading(true); setJoinError('')
    const participantToken = generateToken()
    const participantTokenHash = await sha256(participantToken)
    const { data, error: insertError } = await supabase.from('participants').insert({ event_id: eventData.id, name: cleanName, timezone, participant_token_hash: participantTokenHash }).select('id, event_id, name, timezone, created_at').single()
    if (insertError) { console.error(insertError); setJoinError('Could not join this poll.'); setJoinLoading(false); return }
    localStorage.setItem(`atthesametime:participant:${slug}`, participantToken)
    localStorage.setItem(`atthesametime:participant-id:${slug}`, data.id)
    setParticipant(data); setJoining(false); setJoinLoading(false)
  }

  if (loading) return <main className="center-state"><div className="spinner" /><p>Loading poll…</p></main>
  if (error || !eventData) return <main className="center-state"><h1>Poll not found</h1><p>{error}</p></main>

  return (
    <main className="app-shell reference-machine-page final-machine-page event-machine-page">
      <div className="single-machine-frame" aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}machine-frame-clean.png`} alt="" />
      </div>

      <div className="machine-content-shell event-machine-content">
        <header className="topbar machine-topbar reference-topbar final-topbar event-machine-topbar">
          <div className="brand event-brand">
            <NixieClock />
            <Link className="brand-copy" to="/" aria-label="AtTheSameTime home">
              <span className="brand-name">AtTheSameTime</span>
              <small>Find the perfect time. Anywhere.</small>
            </Link>
          </div>
        </header>

        <div className={`event-layout event-machine-layout${participant ? ' event-machine-layout-active' : ''}`}>
        <section className="event-hero">
          <span className="eyebrow">Availability poll</span>
          <h1>{eventData.title}</h1>
          {eventData.description && <p className="lead">{eventData.description}</p>}
          <div className="timezone-pill"><span>◷</span> Times shown in <strong>{displayTimezone}</strong></div>
        </section>

        <section className="summary-card">
          <div className="summary-main">
            <div><span className="eyebrow">Possible times</span><h2>Choose what works</h2></div>
            <div className="window-chips">
              {windows.map((window) => {
                const start = DateTime.fromISO(window.start_at).setZone(timezone)
                const end = DateTime.fromISO(window.end_at).setZone(timezone)
                return <div className="window-chip" key={window.id}><strong>{start.toFormat('ccc, LLL d')}</strong><span>{start.toFormat('HH:mm')} – {end.toFormat('HH:mm')}</span></div>
              })}
            </div>
          </div>
          <div className="share-box"><div><span className="eyebrow">Invite people</span><strong>Share this poll</strong><p className="share-hint">Anyone with the link can join and mark their availability.</p></div><div className="share-row"><input value={shareUrl} readOnly aria-label="Poll link" /><button className="button secondary" type="button" onClick={handleCopyLink}>{copied ? 'Copied!' : 'Copy link'}</button></div></div>
        </section>

        {!participant ? (
          <section className="join-card">
            <div><span className="eyebrow">Your response</span><h2>Join the poll</h2><p>Enter your name, then paint the times when you're free.</p></div>
            {!joining ? (
              <button className="button primary" type="button" onClick={() => { setJoining(true); setJoinError('') }} disabled={eventData.is_closed}>{eventData.is_closed ? 'Poll closed' : 'Join and mark availability'}</button>
            ) : (
              <div className="join-form"><label htmlFor="participantName">Your name</label><div className="join-row"><input id="participantName" value={participantName} onChange={(e) => setParticipantName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void handleJoin() }} placeholder="Your name" maxLength={80} autoFocus /><button className="button primary" type="button" onClick={handleJoin} disabled={joinLoading}>{joinLoading ? 'Joining…' : 'Join'}</button><button className="button ghost" type="button" onClick={() => { setJoining(false); setJoinError('') }} disabled={joinLoading}>Cancel</button></div>{joinError && <p className="field-error">{joinError}</p>}</div>
            )}
          </section>
        ) : (
          <>
            <div className="joined-banner"><div className="avatar">{participant.name.slice(0, 1).toUpperCase()}</div><div><span>Responding as</span><strong>{participant.name}</strong></div><span className="live-dot">Live</span></div>
            <AvailabilityGrid windows={windows} timezone={timezone} eventId={eventData.id} participantId={participant.id} />
          </>
        )}
        </div>

        <nav className="machine-nav machine-nav-bottom event-machine-nav" aria-label="Poll navigation">
          <Link to="/">Home</Link>
          <Link to="/">New poll</Link>
        </nav>
      </div>
    </main>
  )
}
