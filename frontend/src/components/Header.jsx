import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Truck, FileText, MapPin } from 'lucide-react'

const Header = () => {
  const location = useLocation()
  
  const isActive = (path) => location.pathname === path
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Truck className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">ELD Log Generator</span>
          </Link>
          
          <nav className="flex items-center space-x-6">
            <Link
              to="/"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <MapPin className="h-4 w-4" />
              <span>Home</span>
            </Link>
            
            <Link
              to="/new-trip"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/new-trip') 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>New Trip</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header
