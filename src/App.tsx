import { HashRouter, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import EventPage from './pages/EventPage'
import { LanguageProvider } from './i18n'

function App() {
  return (
    <LanguageProvider>
      <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/e/:slug" element={<EventPage />} />
      </Routes>
    </HashRouter>
    </LanguageProvider>
  )
}

export default App
