import { useEffect, useMemo, useState } from 'react'

function getLocalTime() {
  const now = new Date()
  const digits = `${now.getHours().toString().padStart(2, '0')}${now
    .getMinutes()
    .toString()
    .padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`

  return digits.split('')
}

function Tube({ digit }: { digit: string }) {
  return (
    <div className="nixie-tube-real">
      <span className="nixie-digit-real" data-digit={digit}>{digit}</span>
      <img src={`${import.meta.env.BASE_URL}nixie-tube-shell.png`} alt="" />
      <span className="nixie-front-glass" />
    </div>
  )
}

function Separator() {
  return <div className="nixie-separator-real" aria-hidden="true"><i /><i /></div>
}

export default function NixieClock() {
  const [digits, setDigits] = useState(getLocalTime)
  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  )

  useEffect(() => {
    const update = () => setDigits(getLocalTime())
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const display = `${digits[0]}${digits[1]}:${digits[2]}${digits[3]}:${digits[4]}${digits[5]}`

  return (
    <div
      className="nixie-clock nixie-clock-large nixie-clock-six"
      role="img"
      aria-label={`Local time ${display} in ${timezone}`}
      title={`${timezone} · ${display}`}
    >
      <Tube digit={digits[0]} />
      <Tube digit={digits[1]} />
      <Separator />
      <Tube digit={digits[2]} />
      <Tube digit={digits[3]} />
      <Separator />
      <Tube digit={digits[4]} />
      <Tube digit={digits[5]} />
      <span className="nixie-label">LOCAL TIME</span>
    </div>
  )
}
