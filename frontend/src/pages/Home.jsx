import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, MapPin, Clock, FileText } from 'lucide-react'
import { api } from '../services/api'

const Home = () => {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTrips()
  }, [])

  const fetchTrips = async () => {
    try {
      const response = await api.get('/trips/')
      setTrips(response.data)
    } catch (err) {
      setError('Failed to fetch trips')
      console.error('Error fetching trips:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchTrips}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ELD Log Generator
        </h1>
        <p className="text-gray-600">
          Generate compliant ELD logs and route instructions for commercial drivers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/new-trip"
                className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Plus className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Create New Trip</div>
                  <div className="text-sm text-gray-600">Generate ELD logs for a new route</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Trips */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Trips</h2>
            
            {trips.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No trips created yet</p>
                <Link to="/new-trip" className="btn-primary">
                  Create Your First Trip
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {trips.map((trip) => (
                  <div
                    key={trip.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {trip.pickup_location} → {trip.dropoff_location}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{trip.estimated_duration?.toFixed(1)} hours</span>
                          </div>
                          <div>
                            {trip.total_distance?.toFixed(0)} miles
                          </div>
                          <div>
                            {trip.eld_logs && trip.eld_logs.length > 0 
                              ? trip.eld_logs.reduce((total, log) => total + (log.driving_hours + log.on_duty_hours), 0).toFixed(1) + ' hrs used'
                              : '0 hrs used'
                            }
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/trip/${trip.id}`}
                          className="btn-secondary text-sm"
                        >
                          View Details
                        </Link>
                        <Link
                          to={`/trip/${trip.id}/logs`}
                          className="btn-primary text-sm"
                        >
                          View Logs
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
