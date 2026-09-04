import { HashRouter, Route, Routes } from 'react-router-dom'

import HomePage from './pages/HomePage'
import EventPage from './pages/EventPage'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/e/:slug" element={<EventPage />} />
      </Routes>
    </HashRouter>
  )
}

export default App