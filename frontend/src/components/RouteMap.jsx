import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in React
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const RouteMap = ({ trip }) => {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)

  useEffect(() => {
    if (!trip) return

    // Initialize map
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([40.7128, -74.0060], 6)
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance.current)
    }

    const map = mapInstance.current
    
    // Clear existing markers and routes
    map.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer)
      }
    })

    // Create route points from trip data
    const getCityCoords = (city) => {
      const cityCoords = {
        'New York, NY': [40.7128, -74.0060],
        'Philadelphia, PA': [39.9526, -75.1652],
        'Boston, MA': [42.3601, -71.0589],
        'Chicago, IL': [41.8781, -87.6298],
        'Los Angeles, CA': [34.0522, -118.2437],
        'Miami, FL': [25.7617, -80.1918],
        'Houston, TX': [29.7604, -95.3698],
        'Atlanta, GA': [33.7490, -84.3880],
        'Denver, CO': [39.7392, -104.9903],
        'Seattle, WA': [47.6062, -122.3321],
        'Portland, OR': [45.5152, -122.6784],
      }
      return cityCoords[city] || [40.7128, -74.0060] // Default to NYC
    }

    const routePoints = [
      {
        type: 'start',
        location: trip.current_location,
        coords: getCityCoords(trip.current_location)
      },
      {
        type: 'pickup',
        location: trip.pickup_location,
        coords: getCityCoords(trip.pickup_location)
      },
      {
        type: 'dropoff',
        location: trip.dropoff_location,
        coords: getCityCoords(trip.dropoff_location)
      }
    ]

    // Create custom icons for different point types
    const createCustomIcon = (color, symbol) => {
      return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: white;
          font-weight: bold;
        ">${symbol}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })
    }

    // Add markers for route points with unique colors
    const markers = []
    routePoints.forEach((point, index) => {
      const [lat, lng] = point.coords
      let icon, color, symbol
      
      switch (point.type) {
        case 'start':
          color = '#10b981' // Green
          symbol = 'S'
          break
        case 'pickup':
          color = '#f59e0b' // Orange
          symbol = 'P'
          break
        case 'dropoff':
          color = '#ef4444' // Red
          symbol = 'D'
          break
        default:
          color = '#3b82f6' // Blue
          symbol = '?'
      }
      
      icon = createCustomIcon(color, symbol)
      
      const marker = L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div>
            <strong>${point.type.charAt(0).toUpperCase() + point.type.slice(1)}</strong><br>
            ${point.location}
          </div>
        `)
      
      markers.push(marker)
    })

    // Add route line connecting all points
    if (markers.length > 1) {
      const routeCoordinates = routePoints.map(point => point.coords)
      L.polyline(routeCoordinates, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8
      }).addTo(map)
    }

    // Helper function to calculate position along route
    const calculatePositionAlongRoute = (progress) => {
      // Simple linear interpolation along the route
      const start = routePoints[0].coords
      const end = routePoints[routePoints.length - 1].coords
      
      return [
        start[0] + (end[0] - start[0]) * progress,
        start[1] + (end[1] - start[1]) * progress
      ]
    }

    // Add fuel stops if available
    if (trip.fuel_stops && trip.fuel_stops.length > 0) {
      trip.fuel_stops.forEach((stop, index) => {
        // Distribute fuel stops along the route based on their mileage
        const totalDistance = trip.total_distance || 1000
        const progress = Math.min(stop.mileage / totalDistance, 0.95) // Cap at 95% to avoid overlap with end
        
        const fuelCoords = calculatePositionAlongRoute(progress)
        
        // Add some random offset to avoid overlapping markers
        const offsetLat = (Math.random() - 0.5) * 0.5
        const offsetLng = (Math.random() - 0.5) * 0.5
        
        L.marker([fuelCoords[0] + offsetLat, fuelCoords[1] + offsetLng], {
          icon: L.divIcon({
            className: 'fuel-stop-icon',
            html: `<div style="
              background-color: #3b82f6;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              color: white;
            ">⛽</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        })
        .addTo(map)
        .bindPopup(`
          <div>
            <strong>Fuel Stop ${index + 1}</strong><br>
            ${stop.location}<br>
            Mileage: ${stop.mileage} miles<br>
            Duration: ${stop.duration_minutes} minutes
          </div>
        `)
      })
    }

    // Add rest stops if available
    if (trip.rest_stops && trip.rest_stops.length > 0) {
      trip.rest_stops.forEach((stop, index) => {
        // Distribute rest stops along the route based on their hours elapsed
        const totalDuration = trip.estimated_duration || 24
        const progress = Math.min(stop.hours_elapsed / totalDuration, 0.95) // Cap at 95% to avoid overlap with end
        
        const restCoords = calculatePositionAlongRoute(progress)
        
        // Add some random offset to avoid overlapping markers
        const offsetLat = (Math.random() - 0.5) * 0.5
        const offsetLng = (Math.random() - 0.5) * 0.5
        
        L.marker([restCoords[0] + offsetLat, restCoords[1] + offsetLng], {
          icon: L.divIcon({
            className: 'rest-stop-icon',
            html: `<div style="
              background-color: #10b981;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              color: white;
            ">🛏️</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        })
        .addTo(map)
        .bindPopup(`
          <div>
            <strong>Rest Stop ${index + 1}</strong><br>
            ${stop.location}<br>
            After ${stop.hours_elapsed} hours<br>
            Duration: ${stop.duration_hours} hours
          </div>
        `)
      })
    }

    // Collect all markers for bounds calculation
    const allMarkers = [...markers]
    
    // Add fuel and rest stop markers to bounds calculation
    if (trip.fuel_stops && trip.fuel_stops.length > 0) {
      trip.fuel_stops.forEach((stop, index) => {
        const totalDistance = trip.total_distance || 1000
        const progress = Math.min(stop.mileage / totalDistance, 0.95)
        const fuelCoords = calculatePositionAlongRoute(progress)
        const offsetLat = (Math.random() - 0.5) * 0.5
        const offsetLng = (Math.random() - 0.5) * 0.5
        
        const marker = L.marker([fuelCoords[0] + offsetLat, fuelCoords[1] + offsetLng])
        allMarkers.push(marker)
      })
    }
    
    if (trip.rest_stops && trip.rest_stops.length > 0) {
      trip.rest_stops.forEach((stop, index) => {
        const totalDuration = trip.estimated_duration || 24
        const progress = Math.min(stop.hours_elapsed / totalDuration, 0.95)
        const restCoords = calculatePositionAlongRoute(progress)
        const offsetLat = (Math.random() - 0.5) * 0.5
        const offsetLng = (Math.random() - 0.5) * 0.5
        
        const marker = L.marker([restCoords[0] + offsetLat, restCoords[1] + offsetLng])
        allMarkers.push(marker)
      })
    }

    // Fit map to show all markers
    if (allMarkers.length > 0) {
      const group = new L.featureGroup(allMarkers)
      map.fitBounds(group.getBounds().pad(0.1))
    }

    return () => {
      // Cleanup is handled by the map instance
    }
  }, [trip])

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}

export default RouteMap
