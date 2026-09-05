export default function ClockworkGlobe() {
  return (
    <div className="clockwork-scene globe-asset-scene" aria-hidden="true">
      <img className="machine-gear-img gear-img-large" src={`${import.meta.env.BASE_URL}gear-large.png`} alt="" />
      <img className="machine-gear-img gear-img-medium" src={`${import.meta.env.BASE_URL}gear-medium.png`} alt="" />
      <img className="globe-machine-asset" src={`${import.meta.env.BASE_URL}globe-machine.png`} alt="" />
    </div>
  )
}
