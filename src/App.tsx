import { BrowserRouter, Route, Routes } from 'react-router-dom'

import HomePage from './pages/HomePage'
import EventPage from './pages/EventPage'

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/e/:slug" element={<EventPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App