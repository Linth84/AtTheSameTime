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

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const [dates, setDates] = useState<string[]>([''])
  const [startTime, setStartTime] = useState('18:00')
  const [endTime, setEndTime] = useState('22:00')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const addDate = () => {
    setDates((current) => [...current, ''])
  }

  const updateDate = (index: number, value: string) => {
    setDates((current) =>
      current.map((date, currentIndex) =>
        currentIndex === index ? value : date,
      ),
    )
  }

  const removeDate = (index: number) => {
    setDates((current) =>
      current.filter(
        (_, currentIndex) => currentIndex !== index,
      ),
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const selectedDates = dates.filter(Boolean)

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
      const start = DateTime.fromISO(
        `${date}T${startTime}`,
        { zone: timezone },
      )

      const end = DateTime.fromISO(
        `${date}T${endTime}`,
        { zone: timezone },
      )

      return {
        event_id: data.id,
        start_at: start.toUTC().toISO(),
        end_at: end.toUTC().toISO(),
      }
    })

    const {
      error: windowsError,
    } = await supabase
      .from('event_windows')
      .insert(windows)

    if (windowsError) {
      console.error(
        'Event windows insert error:',
        windowsError,
      )

      setMessage(
        'Event created, but the available dates could not be saved.',
      )

      setLoading(false)
      return
    }

    localStorage.setItem(
      `atthesametime:owner:${data.slug}`,
      ownerToken,
    )

    navigate(`/e/${data.slug}`)
  }

  return (
    <form className="create-card" onSubmit={handleSubmit}>
      <div className="form-heading">
        <span className="eyebrow">New poll</span>
        <h2>Pick the possible days</h2>
        <p>People will choose their availability inside these windows.</p>
      </div>
      <div className="field">
        <label htmlFor="title">
          Event name
        </label>

        <input
          id="title"
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          placeholder="Friday night raid"
          maxLength={100}
        />
      </div>

      <div className="field">
        <label htmlFor="description">
          Description
        </label>

        <textarea
          id="description"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          placeholder="Optional"
          maxLength={500}
        />
      </div>

      <div className="field">
        <label>
          Possible dates
        </label>

        {dates.map((date, index) => (
          <div key={index}>
            <input
              type="date"
              value={date}
              onChange={(event) =>
                updateDate(
                  index,
                  event.target.value,
                )
              }
            />

            {dates.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  removeDate(index)
                }
              >
                Remove
              </button>
            )}
          </div>
        ))}

        <button className="text-button" type="button" onClick={addDate}>+ Add another date</button>
      </div>

      <div className="field time-fields">
        <label htmlFor="startTime">
          From
        </label>

        <input
          id="startTime"
          type="time"
          value={startTime}
          onChange={(event) =>
            setStartTime(event.target.value)
          }
        />

        <label htmlFor="endTime">
          To
        </label>

        <input
          id="endTime"
          type="time"
          value={endTime}
          onChange={(event) =>
            setEndTime(event.target.value)
          }
        />
      </div>

      <p className="form-hint">
        Times will be shown in your local timezone:{' '}
        <strong>{timezone}</strong>
      </p>

      <button className="button primary create-submit" type="submit" disabled={loading}>
        {loading
          ? 'Creating...'
          : 'Create availability poll'}
      </button>

      {message && (
        <p>{message}</p>
      )}
    </form>
  )
}