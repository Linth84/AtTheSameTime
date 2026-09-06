import { useEffect } from 'react'

const MACHINE_WIDTH = 1193
const MACHINE_HEIGHT = MACHINE_WIDTH * (2 / 3)
const WIDTH_RATIO = 0.96

export function useWholeMachineScale() {
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return

    const root = document.documentElement

    const update = () => {
      const available = window.innerWidth * WIDTH_RATIO
      const scale = Math.min(1, available / MACHINE_WIDTH)

      root.style.setProperty('--atts-whole-machine-scale', String(scale))
      root.style.setProperty(
        '--atts-whole-machine-visual-height',
        `${MACHINE_HEIGHT * scale}px`,
      )
    }

    update()
    window.addEventListener('resize', update, { passive: true })

    return () => {
      window.removeEventListener('resize', update)
      root.style.removeProperty('--atts-whole-machine-scale')
      root.style.removeProperty('--atts-whole-machine-visual-height')
    }
  }, [])
}
