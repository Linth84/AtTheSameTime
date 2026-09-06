import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { DateTime } from 'luxon'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../i18n'

type EventWindow = { id: string; event_id: string; start_at: string; end_at: string }
type AvailabilityRow = { id: string; participant_id: string; start_at: string; end_at: string }
type Participant = { id: string; name: string }
type Props = { windows: EventWindow[]; timezone: string; eventId: string; participantId: string; focusDay?: string | null }
type Slot = { key: string; startUtc: string; endUtc: string; local: DateTime }

const SLOT_MINUTES = 30
const utcKey = (iso: string) => DateTime.fromISO(iso).toUTC().toMillis().toString()

export default function AvailabilityGrid({ windows, timezone, eventId, participantId, focusDay }: Props) {
  const { t, locale } = useLanguage()
  const displayTimezone = timezone.replaceAll('_', ' ')
  const [availability, setAvailability] = useState<AvailabilityRow[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [mobileDayIndex, setMobileDayIndex] = useState(() => {
    if (!focusDay) return 0

    const orderedDays = [...new Set(
      windows
        .map((window) => DateTime.fromISO(window.start_at).setZone(timezone).toISODate())
        .filter((day): day is string => Boolean(day)),
    )]

    const index = orderedDays.indexOf(focusDay)
    return index >= 0 ? index : 0
  })
  const dragging = useRef(false)
  const dragValue = useRef(true)
  const touched = useRef(new Set<string>())

  const slots = useMemo<Slot[]>(() => windows.flatMap((window) => {
    const result: Slot[] = []
    let current = DateTime.fromISO(window.start_at).toUTC()
    const end = DateTime.fromISO(window.end_at).toUTC()
    while (current < end) {
      const next = DateTime.min(current.plus({ minutes: SLOT_MINUTES }), end)
      result.push({ key: current.toMillis().toString(), startUtc: current.toISO()!, endUtc: next.toISO()!, local: current.setZone(timezone) })
      current = next
    }
    return result
  }), [windows, timezone])

  const loadData = useCallback(async () => {
    const [{ data: rows, error: rowsError }, { data: people, error: peopleError }] = await Promise.all([
      supabase.from('availability').select('id, participant_id, start_at, end_at').eq('event_id', eventId),
      supabase.from('participants').select('id, name').eq('event_id', eventId).order('created_at'),
    ])
    if (rowsError || peopleError) { console.error(rowsError ?? peopleError); setMessage(t('loadAvailability')); return }
    setAvailability(rows ?? [])
    setParticipants(people ?? [])
  }, [eventId])

  useEffect(() => { void loadData() }, [loadData])
  useEffect(() => {
    const channel = supabase.channel(`availability-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'availability', filter: `event_id=eq.${eventId}` }, () => void loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `event_id=eq.${eventId}` }, () => void loadData())
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [eventId, loadData])
  useEffect(() => {
    const stop = () => { dragging.current = false; touched.current.clear() }
    window.addEventListener('pointerup', stop)
    return () => window.removeEventListener('pointerup', stop)
  }, [])

  const mine = useMemo(() => new Set(availability.filter((row) => row.participant_id === participantId).map((row) => utcKey(row.start_at))), [availability, participantId])
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    availability.forEach((row) => { const key = utcKey(row.start_at); map.set(key, (map.get(key) ?? 0) + 1) })
    return map
  }, [availability])
  const respondedIds = useMemo(() => new Set(availability.map((row) => row.participant_id)), [availability])
  const days = useMemo(() => {
    const map = new Map<string, Slot[]>()
    slots.forEach((slot) => { const day = slot.local.toISODate()!; map.set(day, [...(map.get(day) ?? []), slot]) })
    return [...map.entries()]
  }, [slots])
  const daysKey = useMemo(() => days.map(([day]) => day).join('|'), [days])

  useEffect(() => {
    if (!days.length) {
      setMobileDayIndex(0)
      return
    }

    if (focusDay) {
      const focusedIndex = days.findIndex(([day]) => day === focusDay)
      if (focusedIndex >= 0) {
        setMobileDayIndex(focusedIndex)
        return
      }
    }

    setMobileDayIndex((current) => Math.min(current, days.length - 1))
  }, [focusDay, daysKey])

  useEffect(() => {
    if (!focusDay || !window.matchMedia('(pointer: fine)').matches) return

    const timer = window.setTimeout(() => {
      const target = document.querySelector<HTMLElement>(
        `.desktop-schedule-pair .day-head[data-day="${focusDay}"]`,
      )
      target?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }, 80)

    return () => window.clearTimeout(timer)
  }, [focusDay])
  const timeLabels = useMemo(() => [...new Set(slots.map((slot) => slot.local.toFormat('HH:mm')))].sort(), [slots])
  const slotByDayTime = useMemo(() => {
    const map = new Map<string, Slot>()
    slots.forEach((slot) => map.set(`${slot.local.toISODate()}-${slot.local.toFormat('HH:mm')}`, slot))
    return map
  }, [slots])

  const bestMatches = useMemo(() => slots
    .map((slot) => ({ slot, count: counts.get(slot.key) ?? 0 }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.slot.local.toMillis() - b.slot.local.toMillis())
    .slice(0, 3), [slots, counts])

  const setSlot = async (slot: Slot, selected: boolean) => {
    if (touched.current.has(slot.key)) return
    touched.current.add(slot.key)
    setSaving(true); setMessage('')
    if (selected) {
      setAvailability((current) => [...current, { id: `temp-${slot.key}`, participant_id: participantId, start_at: slot.startUtc, end_at: slot.endUtc }])
      const { error } = await supabase.from('availability').insert({ event_id: eventId, participant_id: participantId, start_at: slot.startUtc, end_at: slot.endUtc })
      if (error) { console.error(error); setMessage(t('saveError')); await loadData() }
    } else {
      setAvailability((current) => current.filter((row) => !(row.participant_id === participantId && utcKey(row.start_at) === slot.key)))
      const { error } = await supabase.from('availability').delete().eq('event_id', eventId).eq('participant_id', participantId).eq('start_at', slot.startUtc)
      if (error) { console.error(error); setMessage(t('removeError')); await loadData() }
    }
    setSaving(false)
  }

  const startPaint = (slot: Slot) => { dragging.current = true; touched.current.clear(); dragValue.current = !mine.has(slot.key); void setSlot(slot, dragValue.current) }
  const continuePaint = (slot: Slot) => { if (dragging.current) void setSlot(slot, dragValue.current) }
  const maxPeople = Math.max(participants.length, 1)

  return <section className="availability-workspace">
    <div className="workspace-heading"><div><span className="eyebrow">{t('availability')}</span><h2>{t('paint')}</h2><p>{t('paintHelp')}</p></div><span className={`save-status ${saving ? 'is-saving' : ''}`}>{saving ? t('saving') : t('saved')}</span></div>
    {message && <div className="notice error-notice">{message}</div>}

    <div className="insight-strip">
      <div className="best-panel"><div className="panel-heading"><span className="eyebrow">{t('smartOverlap')}</span><h3>{t('bestMatches')}</h3></div>
        {bestMatches.length ? <div className="match-list">{bestMatches.map(({ slot, count }, index) => <div className={`match-item ${index === 0 ? 'top-match' : ''}`} key={slot.key}><span className="match-rank">{index + 1}</span><div><strong>{slot.local.setLocale(locale).toFormat('ccc, LLL d · HH:mm')}</strong><span>to {slot.local.plus({ minutes: SLOT_MINUTES }).toFormat('HH:mm')}</span></div><b>{count}/{participants.length}</b></div>)}</div> : <p className="empty-copy">{t('emptyMatches')}</p>}
      </div>
      <div className="people-panel"><div className="panel-heading"><span className="eyebrow">{t('responses')}</span><h3>{respondedIds.size}/{participants.length} {t('participating')}</h3></div><div className="people-list">{participants.map((person) => <span className={respondedIds.has(person.id) ? 'has-response' : ''} key={person.id}><i>{person.name.slice(0, 1).toUpperCase()}</i>{person.name}<b>{respondedIds.has(person.id) ? '✓' : t('waiting')}</b></span>)}</div></div>
    </div>

    <div className="grid-pair desktop-schedule-pair">
      <ScheduleCard title={t('yourAvailability')} subtitle={`${t('localTime')} · ${displayTimezone}`} days={days} timeLabels={timeLabels} slotByDayTime={slotByDayTime} focusDay={focusDay} renderSlot={(slot) => { const selected = mine.has(slot.key); const focused = focusDay === slot.local.toISODate(); return <button className={`slot personal-slot ${selected ? 'selected' : ''} ${focused ? 'focused-day-slot' : ''}`} key={slot.key} type="button" aria-label={`${slot.local.setLocale(locale).toFormat('ccc LLL d HH:mm')} ${selected ? t('available') : t('unavailable')}`} onPointerDown={(e) => { e.preventDefault(); startPaint(slot) }} onPointerEnter={() => continuePaint(slot)} /> }} />
      <ScheduleCard title={t('groupAvailability')} subtitle={`${participants.length} ${participants.length === 1 ? t('participant') : t('participants')}`} days={days} timeLabels={timeLabels} slotByDayTime={slotByDayTime} focusDay={focusDay} renderSlot={(slot) => { const count = counts.get(slot.key) ?? 0; const intensity = count / maxPeople; const focused = focusDay === slot.local.toISODate(); return <div className={`slot group-slot ${count === maxPeople && count > 0 ? 'best' : ''} ${focused ? 'focused-day-slot' : ''}`} key={slot.key} style={{ '--intensity': intensity } as CSSProperties} title={`${count}/${participants.length} available`}><span>{count > 0 ? count : ''}</span></div> }} legend />
    </div>

    <div className="mobile-schedule-pair">
      <MobileScheduleCard
        title={t('yourAvailability')}
        subtitle={`${t('localTime')} · ${displayTimezone}`}
        days={days}
        timeLabels={timeLabels}
        slotByDayTime={slotByDayTime}
        dayIndex={mobileDayIndex}
        onPrevious={() => setMobileDayIndex((current) => Math.max(0, current - 1))}
        onNext={() => setMobileDayIndex((current) => Math.min(days.length - 1, current + 1))}
        renderSlot={(slot) => {
          const selected = mine.has(slot.key)
          return <button className={`slot personal-slot ${selected ? 'selected' : ''}`} key={slot.key} type="button" aria-label={`${slot.local.setLocale(locale).toFormat('ccc LLL d HH:mm')} ${selected ? t('available') : t('unavailable')}`} onPointerDown={(e) => { e.preventDefault(); startPaint(slot) }} onPointerEnter={() => continuePaint(slot)} />
        }}
      />
      <MobileScheduleCard
        title={t('groupAvailability')}
        subtitle={`${participants.length} ${participants.length === 1 ? t('participant') : t('participants')}`}
        days={days}
        timeLabels={timeLabels}
        slotByDayTime={slotByDayTime}
        dayIndex={mobileDayIndex}
        onPrevious={() => setMobileDayIndex((current) => Math.max(0, current - 1))}
        onNext={() => setMobileDayIndex((current) => Math.min(days.length - 1, current + 1))}
        renderSlot={(slot) => {
          const count = counts.get(slot.key) ?? 0
          const intensity = count / maxPeople
          return <div className={`slot group-slot ${count === maxPeople && count > 0 ? 'best' : ''}`} key={slot.key} style={{ '--intensity': intensity } as CSSProperties} title={`${count}/${participants.length} available`}><span>{count > 0 ? count : ''}</span></div>
        }}
        legend
      />
    </div>
  </section>
}


function MobileScheduleCard({
  title,
  subtitle,
  days,
  timeLabels,
  slotByDayTime,
  dayIndex,
  onPrevious,
  onNext,
  renderSlot,
  legend = false,
}: {
  title: string
  subtitle: string
  days: [string, Slot[]][]
  timeLabels: string[]
  slotByDayTime: Map<string, Slot>
  dayIndex: number
  onPrevious: () => void
  onNext: () => void
  renderSlot: (slot: Slot) => ReactNode
  legend?: boolean
}) {
  const { t, locale } = useLanguage()
  const current = days[dayIndex]

  if (!current) return null

  const [day] = current
  const date = DateTime.fromISO(day)

  return (
    <div className="schedule-card mobile-schedule-card">
      <div className="schedule-title">
        <div>
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>
      </div>

      <div className="mobile-day-nav">
        <button type="button" onClick={onPrevious} disabled={dayIndex === 0} aria-label={t('previousDay')}>‹</button>
        <div>
          <strong>{date.setLocale(locale).toFormat('cccc, d LLL')}</strong>
          <span>{dayIndex + 1} / {days.length}</span>
        </div>
        <button type="button" onClick={onNext} disabled={dayIndex === days.length - 1} aria-label={t('nextDay')}>›</button>
      </div>

      <div className="mobile-time-grid">
        {timeLabels.map((time) => {
          const slot = slotByDayTime.get(`${day}-${time}`)
          return (
            <div className="mobile-time-row" key={time}>
              <span className="mobile-time-label">{time}</span>
              {slot ? renderSlot(slot) : <div className="slot unavailable" />}
            </div>
          )
        })}
      </div>

      {legend && <div className="legend"><span>{t('fewer')}</span><div className="legend-scale"><i /><i /><i /><i /></div><span>{t('everyone')}</span></div>}
    </div>
  )
}

function ScheduleCard({ title, subtitle, days, timeLabels, slotByDayTime, renderSlot, focusDay = null, legend = false }: { title: string; subtitle: string; days: [string, Slot[]][]; timeLabels: string[]; slotByDayTime: Map<string, Slot>; renderSlot: (slot: Slot) => ReactNode; focusDay?: string | null; legend?: boolean }) {
  const { t, locale } = useLanguage()
  return <div className="schedule-card"><div className="schedule-title"><div><strong>{title}</strong><span>{subtitle}</span></div></div><div className="schedule-scroll"><div className="time-grid" style={{ gridTemplateColumns: `72px repeat(${days.length}, minmax(88px, 1fr))` }}><div className="grid-corner" />{days.map(([day]) => { const date = DateTime.fromISO(day); return <div className={`day-head ${focusDay === day ? 'focused-day-head' : ''}`} data-day={day} key={day}><strong>{date.setLocale(locale).toFormat('ccc')}</strong><span>{date.setLocale(locale).toFormat('LLL d')}</span></div> })}{timeLabels.map((time) => <div className="grid-row" key={time} style={{ display: 'contents' }}><div className="time-label">{time}</div>{days.map(([day]) => { const slot = slotByDayTime.get(`${day}-${time}`); return slot ? renderSlot(slot) : <div className="slot unavailable" key={`${day}-${time}`} /> })}</div>)}</div></div>{legend && <div className="legend"><span>{t('fewer')}</span><div className="legend-scale"><i /><i /><i /><i /></div><span>{t('everyone')}</span></div>}</div>
}
