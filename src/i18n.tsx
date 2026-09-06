import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type Language = 'en' | 'es'

const messages = {
  en: {
    tagline:'Find the perfect time. Anywhere.', home:'Home', how:'How it works', about:'About', newPoll:'New poll',
    hero1:'Different time zones.', hero2:' Same possibilities.',
    heroLead:'Create a poll, show your availability and let AtTheSameTime find the best moments for everyone, no matter where they are in the world.',
    createPoll:'CREATE A POLL', selectDates:'SELECT DATES', timeWindow:'TIME WINDOW', title:'Title',
    titlePlaceholder:'e.g. Project sync, Team meeting...', description:'Description', optional:'optional',
    descriptionPlaceholder:'Add some details...', yourTimezone:'Your time zone', selectRange:'Select time range',
    rangeHelp:'Choose a broad daily window. Everyone marks their exact availability after joining.',
    from:'From', to:'To', utcCore:'UTC CORE ACTIVE', localLinked:'LOCAL TIME LINKED', possibleDate:'POSSIBLE DATE',
    possibleDates:'POSSIBLE DATES', creating:'CREATING...', create:'⚙  CREATE POLL', timesShown:'Times shown in',
    today:'Today', selected:'selected', previousMonth:'Previous month', nextMonth:'Next month', previousDay:'Previous day', nextDay:'Next day',
    eventNameError:'Please enter an event name.', dateError:'Please select at least one possible date.',
    timeError:'End time must be later than start time.', createError:'Could not create the event.',
    windowsError:'Event created, but the available dates could not be saved.',
    availabilityPoll:'Availability poll', possibleTimes:'Possible times', chooseWorks:'Choose what works',
    invite:'Invite people', share:'Share this poll', shareHint:'Anyone with the link can join and mark their availability.',
    copy:'Copy link', copied:'Copied!', yourResponse:'Your response', joinPoll:'Join the poll',
    joinHelp:"Enter your name, then paint the times when you're free.", closed:'Poll closed',
    joinMark:'Join and mark availability', yourName:'Your name', join:'Join', joining:'Joining…', cancel:'Cancel',
    responding:'Responding as', live:'Live', availability:'Availability', paint:'Paint the times that work for you',
    paintHelp:'Click or drag across the grid. Changes save automatically.', saving:'Saving…', saved:'Saved',
    smartOverlap:'Smart overlap', bestMatches:'Best matches',
    emptyMatches:'Once people mark times, the strongest overlaps will appear here.', responses:'Responses',
    participating:'participating', waiting:'Waiting', yourAvailability:'Your availability', localTime:'Local time',
    groupAvailability:'Group availability', participant:'participant', participants:'participants',
    fewer:'Fewer people', everyone:'Everyone', available:'available', unavailable:'unavailable',
    invalidPoll:'Invalid poll.', notFound:'Poll not found.', loadTimes:'Could not load the poll times.',
    loadAvailability:'Could not load availability.', saveError:'Could not save that time.', removeError:'Could not remove that time.',
    enterName:'Please enter your name.', joinError:'Could not join this poll.', loading:'Loading poll…',
    howTitle:'Three steps. One shared moment.', step1:'Create the poll', step1p:'Choose the possible dates and a broad daily time window.',
    step2:'Share one link', step2p:'Everyone opens the same poll in their own local timezone.',
    step3:'Find the overlap', step3p:'Participants mark availability and the best shared times appear automatically.',
    aboutTitle:'Scheduling without timezone math.',
    aboutCopy:'AtTheSameTime is a lightweight availability poll built for people in different time zones. No account is required to create or answer a poll.',
    close:'Close', mainNav:'Main navigation', pollNav:'Poll navigation'
  },
  es: {
    tagline:'Encontrá el momento perfecto. En cualquier lugar.', home:'Inicio', how:'Cómo funciona', about:'Acerca de', newPoll:'Nueva encuesta',
    hero1:'Distintas zonas horarias.', hero2:' Las mismas posibilidades.',
    heroLead:'Creá una encuesta, marcá tu disponibilidad y dejá que AtTheSameTime encuentre los mejores momentos para todos, sin importar dónde estén.',
    createPoll:'CREAR ENCUESTA', selectDates:'ELEGIR FECHAS', timeWindow:'FRANJA HORARIA', title:'Título',
    titlePlaceholder:'ej. Reunión de proyecto, encuentro del equipo...', description:'Descripción', optional:'opcional',
    descriptionPlaceholder:'Agregá algunos detalles...', yourTimezone:'Tu zona horaria', selectRange:'Elegí un rango horario',
    rangeHelp:'Elegí una franja diaria amplia. Después, cada persona marca su disponibilidad exacta.',
    from:'Desde', to:'A', utcCore:'NÚCLEO UTC ACTIVO', localLinked:'HORA LOCAL VINCULADA', possibleDate:'FECHA POSIBLE',
    possibleDates:'FECHAS POSIBLES', creating:'CREANDO...', create:'⚙  CREAR ENCUESTA', timesShown:'Horarios mostrados en',
    today:'Hoy', selected:'seleccionadas', previousMonth:'Mes anterior', nextMonth:'Mes siguiente', previousDay:'Día anterior', nextDay:'Día siguiente',
    eventNameError:'Ingresá un nombre para la encuesta.', dateError:'Elegí al menos una fecha posible.',
    timeError:'La hora de fin debe ser posterior a la de inicio.', createError:'No se pudo crear la encuesta.',
    windowsError:'La encuesta se creó, pero no se pudieron guardar las fechas disponibles.',
    availabilityPoll:'Encuesta de disponibilidad', possibleTimes:'Horarios posibles', chooseWorks:'Elegí qué te sirve',
    invite:'Invitar personas', share:'Compartir esta encuesta', shareHint:'Cualquiera con el enlace puede entrar y marcar su disponibilidad.',
    copy:'Copiar enlace', copied:'¡Copiado!', yourResponse:'Tu respuesta', joinPoll:'Sumate a la encuesta',
    joinHelp:'Ingresá tu nombre y después marcá los horarios en los que estás libre.', closed:'Encuesta cerrada',
    joinMark:'Sumarme y marcar disponibilidad', yourName:'Tu nombre', join:'Entrar', joining:'Entrando…', cancel:'Cancelar',
    responding:'Respondiendo como', live:'En vivo', availability:'Disponibilidad', paint:'Marcá los horarios que te sirven',
    paintHelp:'Hacé clic o arrastrá sobre la grilla. Los cambios se guardan automáticamente.', saving:'Guardando…', saved:'Guardado',
    smartOverlap:'Coincidencia inteligente', bestMatches:'Mejores coincidencias',
    emptyMatches:'Cuando las personas marquen horarios, las mejores coincidencias aparecerán acá.', responses:'Respuestas',
    participating:'participando', waiting:'Esperando', yourAvailability:'Tu disponibilidad', localTime:'Hora local',
    groupAvailability:'Disponibilidad grupal', participant:'participante', participants:'participantes',
    fewer:'Menos personas', everyone:'Todos', available:'disponible', unavailable:'no disponible',
    invalidPoll:'Encuesta inválida.', notFound:'Encuesta no encontrada.', loadTimes:'No se pudieron cargar los horarios de la encuesta.',
    loadAvailability:'No se pudo cargar la disponibilidad.', saveError:'No se pudo guardar ese horario.', removeError:'No se pudo quitar ese horario.',
    enterName:'Ingresá tu nombre.', joinError:'No se pudo ingresar a esta encuesta.', loading:'Cargando encuesta…',
    howTitle:'Tres pasos. Un momento compartido.', step1:'Creá la encuesta', step1p:'Elegí las fechas posibles y una franja horaria diaria amplia.',
    step2:'Compartí un enlace', step2p:'Todos abren la misma encuesta y ven los horarios en su propia zona horaria.',
    step3:'Encontrá la coincidencia', step3p:'Los participantes marcan su disponibilidad y los mejores horarios compartidos aparecen automáticamente.',
    aboutTitle:'Coordinar sin hacer cuentas con zonas horarias.',
    aboutCopy:'AtTheSameTime es una encuesta de disponibilidad simple para personas en distintas zonas horarias. No hace falta una cuenta para crear ni responder una encuesta.',
    close:'Cerrar', mainNav:'Navegación principal', pollNav:'Navegación de encuesta'
  }
} as const

type Key = keyof typeof messages.en
type ContextValue = { language: Language; setLanguage:(language:Language)=>void; t:(key:Key)=>string; locale:string }
const LanguageContext = createContext<ContextValue | null>(null)

export function LanguageProvider({ children }:{children:ReactNode}) {
  const [language,setLanguageState] = useState<Language>(() => {
    const saved=localStorage.getItem('atthesametime:language')
    if(saved==='en'||saved==='es') return saved
    return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en'
  })
  const setLanguage=(value:Language)=>{ setLanguageState(value); localStorage.setItem('atthesametime:language',value) }
  useEffect(()=>{ document.documentElement.lang=language },[language])
  const value=useMemo(()=>({language,setLanguage,t:(key:Key)=>messages[language][key],locale:language==='es'?'es':'en'}),[language])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
export function useLanguage(){ const value=useContext(LanguageContext); if(!value) throw new Error('useLanguage must be used inside LanguageProvider'); return value }
