import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { api } from '../services/api'

const TripForm = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    current_cycle_used: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [previewData, setPreviewData] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePreview = async () => {
    if (!formData.current_location || !formData.pickup_location || !formData.dropoff_location) {
      setError('Please fill in all location fields')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await api.post('/calculate-route/', formData)
      setPreviewData(response.data)
    } catch (err) {
      setError('Failed to calculate route preview')
      console.error('Error calculating route:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.current_location || !formData.pickup_location || !formData.dropoff_location) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await api.post('/trips/', formData)
      
      // Check if we have a valid ID in the response
      if (response.data && response.data.id) {
        navigate(`/trip/${response.data.id}`)
      } else {
        console.error('No ID in response:', response.data)
        setError('Trip created but could not redirect. Please check the trips list.')
      }
    } catch (err) {
      setError('Failed to create trip')
      console.error('Error creating trip:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Trip
        </h1>
        <p className="text-gray-600">
          Enter trip details to generate ELD logs and route instructions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Trip Information</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="current_location" className="block text-sm font-medium text-gray-700 mb-2">
                Current Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="current_location"
                  name="current_location"
                  value={formData.current_location}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Enter current location"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="pickup_location" className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="pickup_location"
                  name="pickup_location"
                  value={formData.pickup_location}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Enter pickup location"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="dropoff_location" className="block text-sm font-medium text-gray-700 mb-2">
                Dropoff Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="dropoff_location"
                  name="dropoff_location"
                  value={formData.dropoff_location}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Enter dropoff location"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="current_cycle_used" className="block text-sm font-medium text-gray-700 mb-2">
                Current Cycle Used (Hours) *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  id="current_cycle_used"
                  name="current_cycle_used"
                  value={formData.current_cycle_used}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="0"
                  min="0"
                  max="70"
                  step="0.1"
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Hours already used in current 70-hour cycle
              </p>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handlePreview}
                disabled={loading}
                className="btn-secondary flex-1"
              >
                {loading ? 'Calculating...' : 'Preview Route'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Creating Trip...' : 'Create Trip'}
              </button>
            </div>
          </form>
        </div>

        {/* Preview */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Route Preview</h2>
          
          {previewData ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Route calculated successfully</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Total Distance</div>
                  <div className="text-lg font-semibold">{previewData.total_distance?.toFixed(0)} miles</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Estimated Duration</div>
                  <div className="text-lg font-semibold">{previewData.estimated_duration?.toFixed(1)} hours</div>
                </div>
              </div>

              {previewData.fuel_stops && previewData.fuel_stops.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Fuel Stops</h3>
                  <div className="space-y-2">
                    {previewData.fuel_stops.map((stop, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        • {stop.location} at {stop.mileage} miles
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewData.rest_stops && previewData.rest_stops.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Rest Stops</h3>
                  <div className="space-y-2">
                    {previewData.rest_stops.map((stop, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        • {stop.location} after {stop.hours_elapsed} hours
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Click "Preview Route" to see route details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TripForm
