import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FileText, Download, AlertCircle } from 'lucide-react'
import { api } from '../services/api'
import BlankLogForm from '../components/BlankLogForm'
import FMCSAGridChart from '../components/FMCSAGridChart'

const LogViewer = () => {
  const { id } = useParams()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedLog, setSelectedLog] = useState(null)

  useEffect(() => {
    fetchLogs()
  }, [id])

  const fetchLogs = async () => {
    try {
      const response = await api.get(`/trips/${id}/logs/`)
      setLogs(response.data)
    } catch (err) {
      setError('Failed to fetch ELD logs')
      console.error('Error fetching logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async (logId) => {
    try {
      const response = await api.get(`/trips/${id}/logs/${logId}/pdf/`, {
        responseType: 'blob'
      })
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `eld_log_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading PDF:', err)
      alert('Failed to download PDF. Please try again.')
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
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <div className="text-red-600 mb-4">{error}</div>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ELD Logs</h1>
            <p className="text-gray-600">
              Generated logs for trip #{id}
            </p>
          </div>
          <Link to={`/trip/${id}`} className="btn-secondary">
            Back to Trip Details
          </Link>
        </div>
      </div>

      {logs.length === 0 ? (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Blank Log Form</h2>
          <BlankLogForm />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Logs List */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Generated Logs</h2>
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedLog?.id === log.id
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {new Date(log.log_date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        {log.driver_name} • {log.vehicle_number}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownloadPDF(log.id)
                        }}
                        className="btn-secondary text-sm"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                    <div>
                      <div className="text-gray-600">Driving</div>
                      <div className="font-medium">{log.driving_hours.toFixed(2)}h</div>
                    </div>
                    <div>
                      <div className="text-gray-600">On Duty</div>
                      <div className="font-medium">{log.on_duty_hours.toFixed(2)}h</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Off Duty</div>
                      <div className="font-medium">{log.off_duty_hours.toFixed(2)}h</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Sleeper</div>
                      <div className="font-medium">{log.sleeper_berth_hours.toFixed(2)}h</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Log Details */}
          <div>
            {selectedLog ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Log Details</h2>
                </div>
                
                {/* FMCSA Grid Chart View */}
                <FMCSAGridChart 
                  log={selectedLog} 
                  onTimeClick={(data) => {
                    console.log('Time clicked:', data);
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a log to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LogViewer
