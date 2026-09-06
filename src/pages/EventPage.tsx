import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DateTime } from 'luxon'
import { supabase } from '../lib/supabase'
import { sha256 } from '../lib/hash'
import AvailabilityGrid from '../components/AvailabilityGrid'
import NixieClock from '../components/NixieClock'
import LanguageSwitch from '../components/LanguageSwitch'
import { useLanguage } from '../i18n'

type EventData = { id: string; slug: string; title: string; description: string | null; creator_timezone: string; is_closed: boolean; created_at: string }
type EventWindow = { id: string; event_id: string; start_at: string; end_at: string }
type Participant = { id: string; event_id: string; name: string; timezone: string; created_at: string }
const generateToken = () => crypto.randomUUID()

export default function EventPage() {
  const { slug } = useParams()
  const { t, locale } = useLanguage()
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
  const [focusedDay, setFocusedDay] = useState<string | null>(null)

  useEffect(() => {
    const loadEvent = async () => {
      if (!slug) { setError(t('invalidPoll')); setLoading(false); return }
      const { data, error: eventError } = await supabase.from('events').select('id, slug, title, description, creator_timezone, is_closed, created_at').eq('slug', slug).single()
      if (eventError || !data) { console.error(eventError); setError(t('notFound')); setLoading(false); return }
      const { data: windowData, error: windowsError } = await supabase.from('event_windows').select('id, event_id, start_at, end_at').eq('event_id', data.id).order('start_at')
      if (windowsError) { console.error(windowsError); setError(t('loadTimes')); setLoading(false); return }
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
    if (!cleanName) { setJoinError(t('enterName')); return }
    setJoinLoading(true); setJoinError('')
    const participantToken = generateToken()
    const participantTokenHash = await sha256(participantToken)
    const { data, error: insertError } = await supabase.from('participants').insert({ event_id: eventData.id, name: cleanName, timezone, participant_token_hash: participantTokenHash }).select('id, event_id, name, timezone, created_at').single()
    if (insertError) { console.error(insertError); setJoinError(t('joinError')); setJoinLoading(false); return }
    localStorage.setItem(`atthesametime:participant:${slug}`, participantToken)
    localStorage.setItem(`atthesametime:participant-id:${slug}`, data.id)
    setParticipant(data); setJoining(false); setJoinLoading(false)
  }

  const handleWindowClick = (day: string) => {
    setFocusedDay(day)

    if (!participant) {
      setJoining(true)
      setJoinError('')
      window.setTimeout(() => {
        document.querySelector('.join-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 0)
      return
    }

    window.setTimeout(() => {
      document.querySelector('.availability-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  useEffect(() => {
    if (!participant || !focusedDay) return

    const timer = window.setTimeout(() => {
      const target =
        document.querySelector('.mobile-schedule-pair .mobile-schedule-card') ??
        document.querySelector('.availability-workspace')
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 220)

    return () => window.clearTimeout(timer)
  }, [participant?.id, focusedDay])

  if (loading) return <main className="center-state"><div className="spinner" /><p>{t('loading')}</p></main>
  if (error || !eventData) return <main className="center-state"><h1>{t('notFound')}</h1><p>{error}</p></main>

  return (
    <main className="app-shell machine-viewport">
      <div className="reference-machine-page final-machine-page event-machine-page">
      <div className="single-machine-frame" aria-hidden="true">
        <img src={`${import.meta.env.BASE_URL}machine-frame-clean.png`} alt="" />
      </div>

      <div className="machine-content-shell event-machine-content">
        <header className="topbar machine-topbar reference-topbar final-topbar event-machine-topbar">
          <div className="brand event-brand">
            <NixieClock />
            <Link className="brand-copy" to="/" aria-label="AtTheSameTime home">
              <span className="brand-name">AtTheSameTime</span>
              <small>{t('tagline')}</small>
            </Link>
          </div>
        <LanguageSwitch />
        </header>

        <div className={`event-layout event-machine-layout${participant ? ' event-machine-layout-active' : ''}`}>
        <section className="event-hero">
          <span className="eyebrow">{t('availabilityPoll')}</span>
          <h1>{eventData.title}</h1>
          {eventData.description && <p className="lead">{eventData.description}</p>}
          <div className="timezone-pill"><span>◷</span> {t('timesShown')} <strong>{displayTimezone}</strong></div>
        </section>

        <section className="summary-card">
          <div className="summary-main">
            <div><span className="eyebrow">{t('possibleTimes')}</span><h2>{t('chooseWorks')}</h2></div>
            <div className="window-chips">
              {windows.map((window) => {
                const start = DateTime.fromISO(window.start_at).setZone(timezone).setLocale(locale)
                const end = DateTime.fromISO(window.end_at).setZone(timezone).setLocale(locale)
                return <button className="window-chip" key={window.id} type="button" onClick={() => handleWindowClick(start.toISODate()!)}><strong>{start.toFormat('ccc, LLL d')}</strong><span>{start.toFormat('HH:mm')} – {end.toFormat('HH:mm')}</span></button>
              })}
            </div>
          </div>
          <div className="share-box"><div><span className="eyebrow">{t('invite')}</span><strong>{t('share')}</strong><p className="share-hint">{t('shareHint')}</p></div><div className="share-row"><input value={shareUrl} readOnly aria-label="Poll link" /><button className="button secondary" type="button" onClick={handleCopyLink}>{copied ? t('copied') : t('copy')}</button></div></div>
        </section>

        {!participant ? (
          <section className="join-card">
            <div><span className="eyebrow">{t('yourResponse')}</span><h2>{t('joinPoll')}</h2><p>{t('joinHelp')}</p></div>
            {!joining ? (
              <button className="button primary" type="button" onClick={() => { setJoining(true); setJoinError('') }} disabled={eventData.is_closed}>{eventData.is_closed ? t('closed') : t('joinMark')}</button>
            ) : (
              <div className="join-form"><label htmlFor="participantName">{t('yourName')}</label><div className="join-row"><input id="participantName" value={participantName} onChange={(e) => setParticipantName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void handleJoin() }} placeholder={t('yourName')} maxLength={80} autoFocus /><button className="button primary" type="button" onClick={handleJoin} disabled={joinLoading}>{joinLoading ? t('joining') : t('join')}</button><button className="button ghost" type="button" onClick={() => { setJoining(false); setJoinError('') }} disabled={joinLoading}>{t('cancel')}</button></div>{joinError && <p className="field-error">{joinError}</p>}</div>
            )}
          </section>
        ) : (
          <>
            <div className="joined-banner"><div className="avatar">{participant.name.slice(0, 1).toUpperCase()}</div><div><span>{t('responding')}</span><strong>{participant.name}</strong></div><span className="live-dot">{t('live')}</span></div>
            <AvailabilityGrid key={`${participant.id}-${focusedDay ?? "default"}`} windows={windows} timezone={timezone} eventId={eventData.id} participantId={participant.id} focusDay={focusedDay} />
          </>
        )}
        </div>

        <nav className="machine-nav machine-nav-bottom event-machine-nav" aria-label={t('pollNav')}>
          <Link to="/">{t('home')}</Link>
          <Link to="/">{t('newPoll')}</Link>
        </nav>
      </div>
      </div>
    </main>
  )
}
