import { useEffect } from 'react'

const STAGE_WIDTH = 1536
const STAGE_HEIGHT = 1024
const VIEWPORT_GUTTER = 0.96

export function useMachineStageScale() {
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return

    const root = document.documentElement

    const updateScale = () => {
      // One number controls the complete cabinet. No child is measured or moved.
      const availableWidth = window.innerWidth * VIEWPORT_GUTTER
      const scale = Math.min(1, availableWidth / STAGE_WIDTH)

      root.style.setProperty('--atts-machine-scale', String(scale))
      root.style.setProperty('--atts-machine-visual-height', `${STAGE_HEIGHT * scale}px`)
    }

    updateScale()
    window.addEventListener('resize', updateScale, { passive: true })

    return () => {
      window.removeEventListener('resize', updateScale)
      root.style.removeProperty('--atts-machine-scale')
      root.style.removeProperty('--atts-machine-visual-height')
    }
  }, [])
}
