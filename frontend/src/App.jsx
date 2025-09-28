import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import TripForm from './pages/TripForm'
import TripDetails from './pages/TripDetails'
import LogViewer from './pages/LogViewer'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/new-trip" element={<TripForm />} />
            <Route path="/trip/:id" element={<TripDetails />} />
            <Route path="/trip/:id/logs" element={<LogViewer />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
