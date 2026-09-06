import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

type Props = { children: ReactNode }

export default function MachineViewport({ children }: Props) {
  const shellRef = useRef<HTMLDivElement>(null)
  const [base, setBase] = useState<{ width: number; height: number } | null>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const shell = shellRef.current
    const machine = shell?.firstElementChild as HTMLElement | null
    if (!shell || !machine) return

    const capture = () => {
      if (window.innerWidth <= 980) {
        setBase(null)
        setScale(1)
        return
      }

      // Capture the project's EXISTING desktop layout exactly as rendered.
      // This is the reference geometry we keep from now on.
      if (!base) {
        const rect = machine.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          setBase({ width: rect.width, height: rect.height })
          setScale(1)
        }
        return
      }

      const availableWidth = document.documentElement.clientWidth * 0.96
      const maxScale = 1536 / base.width
      setScale(Math.min(maxScale, availableWidth / base.width))
    }

    const raf = requestAnimationFrame(capture)
    window.addEventListener('resize', capture)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', capture)
    }
  }, [base])

  const style = base
    ? ({
        '--machine-base-width': `${base.width}px`,
        '--machine-base-height': `${base.height}px`,
        '--machine-scale': scale,
        '--machine-shell-height': `${base.height * scale}px`,
      } as CSSProperties)
    : undefined

  return (
    <div
      ref={shellRef}
      className={`machine-viewport-shell${base ? ' machine-frozen' : ''}`}
      style={style}
    >
      {children}
    </div>
  )
}
