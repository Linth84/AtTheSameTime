import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { DateTime } from 'luxon'
import { supabase } from '../lib/supabase'

type EventWindow = { id: string; event_id: string; start_at: string; end_at: string }
type AvailabilityRow = { id: string; participant_id: string; start_at: string; end_at: string }
type Participant = { id: string; name: string }
type Props = { windows: EventWindow[]; timezone: string; eventId: string; participantId: string }
type Slot = { key: string; startUtc: string; endUtc: string; local: DateTime; windowId: string }

const SLOT_MINUTES = 30
const utcKey = (iso: string) => DateTime.fromISO(iso).toUTC().toMillis().toString()

export default function AvailabilityGrid({ windows, timezone, eventId, participantId }: Props) {
  const [availability, setAvailability] = useState<AvailabilityRow[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const dragging = useRef(false)
  const dragValue = useRef(true)
  const touched = useRef(new Set<string>())

  const slots = useMemo<Slot[]>(() => windows.flatMap((window) => {
    const result: Slot[] = []
    let current = DateTime.fromISO(window.start_at).toUTC()
    const end = DateTime.fromISO(window.end_at).toUTC()
    while (current < end) {
      const next = DateTime.min(current.plus({ minutes: SLOT_MINUTES }), end)
      result.push({
        key: current.toMillis().toString(),
        startUtc: current.toISO()!,
        endUtc: next.toISO()!,
        local: current.setZone(timezone),
        windowId: window.id,
      })
      current = next
    }
    return result
  }), [windows, timezone])

  const loadData = useCallback(async () => {
    const [{ data: rows, error: rowsError }, { data: people, error: peopleError }] = await Promise.all([
      supabase.from('availability').select('id, participant_id, start_at, end_at').eq('event_id', eventId),
      supabase.from('participants').select('id, name').eq('event_id', eventId).order('created_at'),
    ])
    if (rowsError || peopleError) {
      console.error(rowsError ?? peopleError)
      setMessage('Could not load availability.')
      return
    }
    setAvailability(rows ?? [])
    setParticipants(people ?? [])
  }, [eventId])

  useEffect(() => { void loadData() }, [loadData])

  useEffect(() => {
    const channel = supabase
      .channel(`availability-${eventId}`)
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

  const mine = useMemo(() => new Set(
    availability.filter((row) => row.participant_id === participantId).map((row) => utcKey(row.start_at)),
  ), [availability, participantId])

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    availability.forEach((row) => {
      const key = utcKey(row.start_at)
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return map
  }, [availability])

  const days = useMemo(() => {
    const map = new Map<string, Slot[]>()
    slots.forEach((slot) => {
      const day = slot.local.toISODate()!
      map.set(day, [...(map.get(day) ?? []), slot])
    })
    return [...map.entries()]
  }, [slots])

  const timeLabels = useMemo(() => {
    const values = new Set<string>()
    slots.forEach((slot) => values.add(slot.local.toFormat('HH:mm')))
    return [...values].sort()
  }, [slots])

  const slotByDayTime = useMemo(() => {
    const map = new Map<string, Slot>()
    slots.forEach((slot) => map.set(`${slot.local.toISODate()}-${slot.local.toFormat('HH:mm')}`, slot))
    return map
  }, [slots])

  const setSlot = async (slot: Slot, selected: boolean) => {
    const key = slot.key
    if (touched.current.has(key)) return
    touched.current.add(key)

    setSaving(true)
    setMessage('')
    if (selected) {
      setAvailability((current) => [...current, { id: `temp-${key}`, participant_id: participantId, start_at: slot.startUtc, end_at: slot.endUtc }])
      const { error } = await supabase.from('availability').insert({
        event_id: eventId,
        participant_id: participantId,
        start_at: slot.startUtc,
        end_at: slot.endUtc,
      })
      if (error) { console.error(error); setMessage('Could not save that time.'); await loadData() }
    } else {
      setAvailability((current) => current.filter((row) => !(row.participant_id === participantId && utcKey(row.start_at) === key)))
      const { error } = await supabase.from('availability')
        .delete()
        .eq('event_id', eventId)
        .eq('participant_id', participantId)
        .eq('start_at', slot.startUtc)
      if (error) { console.error(error); setMessage('Could not remove that time. Run the included Supabase policy if needed.'); await loadData() }
    }
    setSaving(false)
  }

  const startPaint = (slot: Slot) => {
    dragging.current = true
    touched.current.clear()
    dragValue.current = !mine.has(slot.key)
    void setSlot(slot, dragValue.current)
  }

  const continuePaint = (slot: Slot) => {
    if (dragging.current) void setSlot(slot, dragValue.current)
  }

  const maxPeople = Math.max(participants.length, 1)

  return (
    <section className="availability-workspace">
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">Availability</span>
          <h2>Paint the times that work for you</h2>
          <p>Click or drag across the grid. Changes save automatically.</p>
        </div>
        <span className={`save-status ${saving ? 'is-saving' : ''}`}>{saving ? 'Saving…' : 'Saved'}</span>
      </div>

      {message && <div className="notice error-notice">{message}</div>}

      <div className="grid-pair">
        <div className="schedule-card">
          <div className="schedule-title"><div><strong>Your availability</strong><span>Local time · {timezone}</span></div></div>
          <div className="schedule-scroll">
            <div className="time-grid" style={{ gridTemplateColumns: `72px repeat(${days.length}, minmax(88px, 1fr))` }}>
              <div className="grid-corner" />
              {days.map(([day]) => {
                const date = DateTime.fromISO(day, { zone: timezone })
                return <div className="day-head" key={day}><strong>{date.toFormat('ccc')}</strong><span>{date.toFormat('LLL d')}</span></div>
              })}
              {timeLabels.map((time) => (
                <div className="grid-row" key={time} style={{ display: 'contents' }}>
                  <div className="time-label">{time}</div>
                  {days.map(([day]) => {
                    const slot = slotByDayTime.get(`${day}-${time}`)
                    if (!slot) return <div className="slot unavailable" key={`${day}-${time}`} />
                    const selected = mine.has(slot.key)
                    return <button
                      className={`slot personal-slot ${selected ? 'selected' : ''}`}
                      key={slot.key}
                      type="button"
                      aria-label={`${slot.local.toFormat('ccc LLL d HH:mm')} ${selected ? 'available' : 'unavailable'}`}
                      onPointerDown={(event) => { event.preventDefault(); startPaint(slot) }}
                      onPointerEnter={() => continuePaint(slot)}
                    />
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="schedule-card group-card">
          <div className="schedule-title"><div><strong>Group availability</strong><span>{participants.length} {participants.length === 1 ? 'participant' : 'participants'}</span></div></div>
          <div className="schedule-scroll">
            <div className="time-grid" style={{ gridTemplateColumns: `72px repeat(${days.length}, minmax(88px, 1fr))` }}>
              <div className="grid-corner" />
              {days.map(([day]) => {
                const date = DateTime.fromISO(day, { zone: timezone })
                return <div className="day-head" key={day}><strong>{date.toFormat('ccc')}</strong><span>{date.toFormat('LLL d')}</span></div>
              })}
              {timeLabels.map((time) => (
                <div className="grid-row" key={time} style={{ display: 'contents' }}>
                  <div className="time-label">{time}</div>
                  {days.map(([day]) => {
                    const slot = slotByDayTime.get(`${day}-${time}`)
                    if (!slot) return <div className="slot unavailable" key={`${day}-${time}`} />
                    const count = counts.get(slot.key) ?? 0
                    const intensity = count / maxPeople
                    return <div
                      className={`slot group-slot ${count === maxPeople && count > 0 ? 'best' : ''}`}
                      key={slot.key}
                      style={{ '--intensity': intensity } as CSSProperties}
                      title={`${count}/${participants.length} available`}
                    ><span>{count > 0 ? count : ''}</span></div>
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="legend"><span>Fewer people</span><div className="legend-scale"><i /><i /><i /><i /></div><span>Everyone</span></div>
        </div>
      </div>
    </section>
  )
}
