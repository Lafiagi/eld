import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Clock, Route, FileText, AlertCircle } from 'lucide-react'
import { api } from '../services/api'
import RouteMap from '../components/RouteMap'

const TripDetails = () => {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTrip()
  }, [id])

  const fetchTrip = async () => {
    // Check if ID is valid
    if (!id || id === 'undefined') {
      setError('Invalid trip ID')
      setLoading(false)
      return
    }

    try {
      const response = await api.get(`/trips/${id}/`)
      setTrip(response.data)
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Trip not found')
      } else {
        setError('Failed to fetch trip details')
      }
      console.error('Error fetching trip:', err)
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

  if (error || !trip) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <div className="text-red-600 mb-4">{error || 'Trip not found'}</div>
        <Link to="/" className="btn-primary">
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Trip Details</h1>
            <p className="text-gray-600">
              {trip.pickup_location} → {trip.dropoff_location}
            </p>
          </div>
          <Link to={`/trip/${id}/logs`} className="btn-primary">
            <FileText className="h-4 w-4 mr-2" />
            View ELD Logs
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trip Information */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Trip Information</h2>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Current Location</div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{trip.current_location}</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Pickup Location</div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{trip.pickup_location}</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600">Dropoff Location</div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{trip.dropoff_location}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Distance</div>
                    <div className="text-lg font-semibold">{trip.total_distance?.toFixed(0)} miles</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Estimated Duration</div>
                    <div className="text-lg font-semibold">{trip.estimated_duration?.toFixed(1)} hours</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm text-gray-600">Current Cycle Used</div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-lg font-semibold">{trip.current_cycle_used} hours</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${(trip.current_cycle_used / 70) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {70 - trip.current_cycle_used} hours remaining in cycle
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Route Map */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Route Map</h2>
            <RouteMap trip={trip} />
          </div>
        </div>
      </div>

      {/* Route Information */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Route Points */}
        {trip.route_points && trip.route_points.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Route Points</h2>
            <div className="space-y-3">
              {trip.route_points.map((point, index) => (
                <div key={point.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{point.address}</div>
                    <div className="text-sm text-gray-600 capitalize">{point.point_type}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fuel and Rest Stops */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Planned Stops</h2>
          
          {/* Fuel Stops */}
          {trip.fuel_stops && trip.fuel_stops.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">⛽ Fuel Stops</h3>
              <div className="space-y-2">
                {trip.fuel_stops.map((stop, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{stop.location}</div>
                      <div className="text-sm text-gray-600">Mile {stop.mileage}</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {stop.duration_minutes} min
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rest Stops */}
          {trip.rest_stops && trip.rest_stops.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">🛏️ Rest Stops</h3>
              <div className="space-y-2">
                {trip.rest_stops.map((stop, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{stop.location}</div>
                      <div className="text-sm text-gray-600">After {stop.hours_elapsed} hours</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {stop.duration_hours} hrs
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No stops message */}
          {(!trip.fuel_stops || trip.fuel_stops.length === 0) && 
           (!trip.rest_stops || trip.rest_stops.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🚛</div>
              <p>No planned stops needed for this trip</p>
              <p className="text-sm">Distance: {trip.total_distance?.toFixed(0)} miles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TripDetails
