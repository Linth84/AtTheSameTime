import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { DateTime } from 'luxon'

import { supabase } from '../lib/supabase'
import { sha256 } from '../lib/hash'

function generateSlug() {
  return Math.random().toString(36).slice(2, 8)
}

function generateToken() {
  return crypto.randomUUID()
}

export default function CreateEventForm() {
  const navigate = useNavigate()

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  )
  const displayTimezone = timezone.replaceAll('_', ' ')

  const today = useMemo(() => DateTime.now().setZone(timezone).startOf('day'), [timezone])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dates, setDates] = useState<string[]>([])
  const [calendarMonth, setCalendarMonth] = useState(() => today.startOf('month'))
  const [startTime, setStartTime] = useState('18:00')
  const [endTime, setEndTime] = useState('22:00')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const monthCells = useMemo(() => {
    const first = calendarMonth.startOf('month')
    const last = calendarMonth.endOf('month')
    const leading = first.weekday % 7
    const cells: Array<DateTime | null> = []

    for (let index = 0; index < leading; index += 1) {
      cells.push(null)
    }

    for (let day = 1; day <= last.day; day += 1) {
      cells.push(calendarMonth.set({ day }))
    }

    while (cells.length % 7 !== 0) {
      cells.push(null)
    }

    return cells
  }, [calendarMonth])

  const selectedDates = useMemo(
    () => [...dates].sort((a, b) => a.localeCompare(b)),
    [dates],
  )

  const toggleDate = (date: DateTime) => {
    const isoDate = date.toISODate()
    if (!isoDate || date < today) return

    setDates((current) =>
      current.includes(isoDate)
        ? current.filter((item) => item !== isoDate)
        : [...current, isoDate],
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!title.trim()) {
      setMessage('Please enter an event name.')
      return
    }

    if (selectedDates.length === 0) {
      setMessage('Please select at least one possible date.')
      return
    }

    if (startTime >= endTime) {
      setMessage('End time must be later than start time.')
      return
    }

    setLoading(true)
    setMessage('')

    const slug = generateSlug()
    const ownerToken = generateToken()
    const ownerTokenHash = await sha256(ownerToken)

    const { data, error } = await supabase
      .from('events')
      .insert({
        slug,
        title: title.trim(),
        description: description.trim() || null,
        creator_timezone: timezone,
        owner_token_hash: ownerTokenHash,
      })
      .select()
      .single()

    if (error) {
      console.error('Event insert error:', error)
      setMessage('Could not create the event.')
      setLoading(false)
      return
    }

    const windows = selectedDates.map((date) => {
      const start = DateTime.fromISO(`${date}T${startTime}`, { zone: timezone })
      const end = DateTime.fromISO(`${date}T${endTime}`, { zone: timezone })

      return {
        event_id: data.id,
        start_at: start.toUTC().toISO(),
        end_at: end.toUTC().toISO(),
      }
    })

    const { error: windowsError } = await supabase
      .from('event_windows')
      .insert(windows)

    if (windowsError) {
      console.error('Event windows insert error:', windowsError)
      setMessage('Event created, but the available dates could not be saved.')
      setLoading(false)
      return
    }

    localStorage.setItem(`atthesametime:owner:${data.slug}`, ownerToken)
    navigate(`/e/${data.slug}`)
  }

  return (
    <form className="create-card machine-create-grid" onSubmit={handleSubmit}>
      <section className="machine-form-panel details-panel">
        <div className="asset-section-title"><span>1. CREATE A POLL</span></div>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Project sync, Team meeting..." maxLength={100} />
        </div>
        <div className="field">
          <label htmlFor="description">Description <small>(optional)</small></label>
          <textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add some details..." maxLength={500} />
        </div>
        <div className="timezone-machine-field">
          <span className="field-label">Your time zone</span>
          <div className="timezone-display"><i>◷</i><span>{displayTimezone}</span></div>
        </div>
      </section>

      <section className="machine-form-panel dates-panel">
        <div className="asset-section-title"><span>2. SELECT DATES</span></div>
        <div className="calendar-card compact-calendar">
          <div className="calendar-toolbar">
            <button type="button" className="calendar-nav" aria-label="Previous month" onClick={() => setCalendarMonth((current) => current.minus({ months: 1 }))}>‹</button>
            <strong>{calendarMonth.toFormat('LLLL yyyy')}</strong>
            <button type="button" className="calendar-nav" aria-label="Next month" onClick={() => setCalendarMonth((current) => current.plus({ months: 1 }))}>›</button>
          </div>
          <div className="calendar-weekdays" aria-hidden="true">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="calendar-grid">
            {monthCells.map((date, index) => {
              if (!date) return <span className="calendar-empty" key={`empty-${index}`} />
              const isoDate = date.toISODate() ?? ''
              const selected = dates.includes(isoDate)
              const disabled = date < today
              const isToday = date.hasSame(today, 'day')
              return (
                <button type="button" key={isoDate} className={`calendar-day${selected ? ' selected' : ''}${isToday ? ' today' : ''}`} disabled={disabled} aria-pressed={selected} onClick={() => toggleDate(date)}>
                  {date.day}
                </button>
              )
            })}
          </div>
          <div className="calendar-footer">
            <button type="button" className="text-button calendar-today" onClick={() => setCalendarMonth(today.startOf('month'))}>Today</button>
            <span>{selectedDates.length} selected</span>
          </div>
        </div>
        {selectedDates.length > 0 && (
          <div className="selected-date-list" aria-label="Selected dates">
            {selectedDates.map((date) => (
              <button type="button" className="selected-date-chip" key={date} onClick={() => toggleDate(DateTime.fromISO(date, { zone: timezone }))}>
                {DateTime.fromISO(date, { zone: timezone }).toFormat('ccc, LLL d')}<span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="machine-form-panel matches-panel">
        <div className="asset-section-title"><span>3. TIME WINDOW</span></div>
        <div className="time-window-card compact-time-window">
          <span className="field-label">Select time range</span>
          <p>Choose a broad daily window. Everyone marks their exact availability after joining.</p>
          <div className="time-fields">
            <label htmlFor="startTime">From</label>
            <input id="startTime" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
            <label htmlFor="endTime">To</label>
            <input id="endTime" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
          </div>
        </div>
        <div className="machine-readout">
          <span><i /> UTC CORE ACTIVE</span>
          <span><i /> LOCAL TIME LINKED</span>
          <strong>{selectedDates.length || '0'} POSSIBLE {selectedDates.length === 1 ? 'DATE' : 'DATES'}</strong>
        </div>
        <button className="button primary create-submit asset-action-button" type="submit" disabled={loading}>
          <span>{loading ? 'CREATING...' : '⚙  CREATE POLL'}</span>
        </button>
        <p className="form-hint">Times shown in <strong>{displayTimezone}</strong></p>
        {message && <p className="field-error">{message}</p>}
      </section>
    </form>
  )
}
