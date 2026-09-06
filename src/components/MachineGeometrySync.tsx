import { useEffect } from 'react'

export default function MachineGeometrySync() {
  useEffect(() => {
    const machine = document.querySelector<HTMLElement>('.final-machine-page')
    if (!machine) return

    const sync = () => {
      const width = machine.getBoundingClientRect().width
      // The current desktop composition was tuned around ~1040 CSS px.
      // Scale only physical UI pieces that previously used fixed px values.
      const factor = Math.max(.78, Math.min(1.48, width / 1040))
      machine.style.setProperty('--machine-ui-scale', factor.toFixed(4))
      machine.style.setProperty('--machine-nixie-scale', (.74 * factor).toFixed(4))
      machine.style.setProperty('--machine-title-size', `${(31 * factor).toFixed(2)}px`)
      machine.style.setProperty('--machine-subtitle-size', `${(9 * factor).toFixed(2)}px`)
      machine.style.setProperty('--machine-subtitle-gap', `${(6 * factor).toFixed(2)}px`)
      machine.style.setProperty('--machine-nav-height', `${(38 * factor).toFixed(2)}px`)
    }

    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(machine)
    window.addEventListener('resize', sync)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', sync)
    }
  }, [])

  return null
}
