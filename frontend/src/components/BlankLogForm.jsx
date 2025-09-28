import React from 'react'

const BlankLogForm = () => {
  return (
    <div className="bg-white border-2 border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 border-b-2 border-gray-800 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">DRIVER'S DAILY LOG</h2>
            <p className="text-sm text-gray-600">(ONE CALENDAR DAY — 24 HOURS)</p>
          </div>
          <div className="text-right text-sm">
            <div className="mb-2">
              <span className="font-semibold">ORIGINAL</span> — Submit to carrier within 13 days<br/>
              <span className="font-semibold">DUPLICATE</span> — Driver retains possession for eight days
            </div>
            <div className="text-xs text-gray-600">
              Date: <span className="underline">(month)</span> / <span className="underline">(day)</span> / <span className="underline">(year)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Driver and Carrier Info */}
      <div className="p-4 border-b border-gray-300">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="mb-2">
              <label className="block text-sm font-semibold text-gray-700">From:</label>
              <div className="border-b border-gray-400 h-6"></div>
            </div>
            <div className="mb-2">
              <label className="block text-sm font-semibold text-gray-700">To:</label>
              <div className="border-b border-gray-400 h-6"></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <label className="block text-xs text-gray-600">Total Miles Driving Today</label>
                <div className="border border-gray-400 h-8 bg-gray-50"></div>
              </div>
              <div>
                <label className="block text-xs text-gray-600">Total Mileage Today</label>
                <div className="border border-gray-400 h-8 bg-gray-50"></div>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600">Truck/Tractor and Trailer Numbers or License Plate(s)/State (show each unit)</label>
              <div className="border-b border-gray-400 h-6"></div>
            </div>
          </div>
          
          <div>
            <div className="mb-2">
              <label className="block text-sm font-semibold text-gray-700">Name of Carrier or Carriers</label>
              <div className="border-b border-gray-400 h-6"></div>
            </div>
            <div className="mb-2">
              <label className="block text-sm font-semibold text-gray-700">Main Office Address</label>
              <div className="border-b border-gray-400 h-6"></div>
            </div>
            <div className="mb-2">
              <label className="block text-sm font-semibold text-gray-700">Home Terminal Address</label>
              <div className="border-b border-gray-400 h-6"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Log Grid */}
      <div className="p-4">
        {/* Time Header */}
        <div className="mb-4">
          <div className="flex">
            <div className="w-24 text-sm font-semibold text-gray-700 flex items-center justify-center">
              Off Duty
            </div>
            <div className="flex-1 grid grid-cols-24 gap-0">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="text-xs text-center border-r border-gray-300 h-6 flex items-center justify-center bg-gray-100">
                  {i === 0 ? 'Midnight' : 
                   i === 12 ? 'Noon' : 
                   i > 12 ? `${i - 12} PM` : 
                   `${i} AM`}
                </div>
              ))}
            </div>
            <div className="w-16 text-sm font-semibold text-center border-l border-gray-300 bg-gray-100 flex items-center justify-center">
              Total Hours
            </div>
          </div>
        </div>

        {/* Duty Status Rows */}
        <div className="space-y-1">
          {/* Off Duty Row */}
          <div className="flex">
            <div className="w-24 text-sm font-semibold text-gray-700 flex items-center justify-center bg-gray-50 border border-gray-300">
              Off Duty
            </div>
            <div className="flex-1 grid grid-cols-24 gap-0 border border-gray-300">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="h-8 border-r border-gray-300 bg-white"></div>
              ))}
            </div>
            <div className="w-16 text-sm font-semibold text-center border border-gray-300 bg-gray-50 flex items-center justify-center">
              ___
            </div>
          </div>

          {/* Sleeper Berth Row */}
          <div className="flex">
            <div className="w-24 text-sm font-semibold text-gray-700 flex items-center justify-center bg-gray-50 border border-gray-300">
              Sleeper Berth
            </div>
            <div className="flex-1 grid grid-cols-24 gap-0 border border-gray-300">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="h-8 border-r border-gray-300 bg-white"></div>
              ))}
            </div>
            <div className="w-16 text-sm font-semibold text-center border border-gray-300 bg-gray-50 flex items-center justify-center">
              ___
            </div>
          </div>

          {/* Driving Row */}
          <div className="flex">
            <div className="w-24 text-sm font-semibold text-gray-700 flex items-center justify-center bg-gray-50 border border-gray-300">
              Driving
            </div>
            <div className="flex-1 grid grid-cols-24 gap-0 border border-gray-300">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="h-8 border-r border-gray-300 bg-white"></div>
              ))}
            </div>
            <div className="w-16 text-sm font-semibold text-center border border-gray-300 bg-gray-50 flex items-center justify-center">
              ___
            </div>
          </div>

          {/* On Duty (not driving) Row */}
          <div className="flex">
            <div className="w-24 text-sm font-semibold text-gray-700 flex items-center justify-center bg-gray-50 border border-gray-300">
              On Duty (not driving)
            </div>
            <div className="flex-1 grid grid-cols-24 gap-0 border border-gray-300">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="h-8 border-r border-gray-300 bg-white"></div>
              ))}
            </div>
            <div className="w-16 text-sm font-semibold text-center border border-gray-300 bg-gray-50 flex items-center justify-center">
              ___
            </div>
          </div>
        </div>

        {/* Total Hours Row */}
        <div className="flex mt-2">
          <div className="w-24 text-sm font-semibold text-gray-700 flex items-center justify-center bg-gray-100 border-2 border-gray-400">
            TOTAL
          </div>
          <div className="flex-1 border-2 border-gray-400 bg-gray-100 h-8 flex items-center justify-center">
            <span className="text-sm font-semibold">24.0</span>
          </div>
          <div className="w-16 text-sm font-semibold text-center border-2 border-gray-400 bg-gray-100 flex items-center justify-center">
            24.0h
          </div>
        </div>
      </div>

      {/* Remarks Section */}
      <div className="p-4 border-t border-gray-300">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">REMARKS</h3>
            <div className="border border-gray-400 h-24 bg-gray-50"></div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Shipping Documents:</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600">DVL or Manifest No.</label>
                <div className="border-b border-gray-400 h-6"></div>
              </div>
              <div className="text-center text-xs text-gray-600">or</div>
              <div>
                <label className="block text-xs text-gray-600">Shipper & Commodity</label>
                <div className="border-b border-gray-400 h-6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Duty Change Description */}
      <div className="p-4 border-t border-gray-300">
        <div className="text-sm text-gray-700 mb-2">
          Enter name of place you reported and where released from work and when and where each change of duty occurred.
        </div>
        <div className="border-b border-gray-400 h-8"></div>
        <div className="text-xs text-gray-600 mt-1">Use time standard of home terminal.</div>
      </div>

      {/* Recap Section */}
      <div className="p-4 border-t border-gray-300 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Recap: Complete at end of day</h3>
        
        <div className="grid grid-cols-3 gap-8">
          {/* Common Fields */}
          <div>
            <div className="mb-2">
              <label className="block text-xs text-gray-600">On duty hours today,</label>
              <div className="border-b border-gray-400 h-6"></div>
            </div>
            <div>
              <label className="block text-xs text-gray-600">Total lines 3 & 4</label>
              <div className="border-b border-gray-400 h-6"></div>
            </div>
          </div>

          {/* 70 Hour/8 Day Drivers */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">70 Hour/8 Day Drivers</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600">A. Total hours on duty last 7 days including today.</label>
                <div className="border-b border-gray-400 h-6"></div>
              </div>
              <div>
                <label className="block text-xs text-gray-600">B. Total hours available tomorrow 70 hr. minus A*</label>
                <div className="border-b border-gray-400 h-6"></div>
              </div>
              <div>
                <label className="block text-xs text-gray-600">C. Total hours on duty last 5 days including today.</label>
                <div className="border-b border-gray-400 h-6"></div>
              </div>
            </div>
          </div>

          {/* 60 Hour/7 Day Drivers */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">60 Hour/7 Day Drivers</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600">A. Total hours on duty last 7 days including today.</label>
                <div className="border-b border-gray-400 h-6"></div>
              </div>
              <div>
                <label className="block text-xs text-gray-600">B. Total hours available tomorrow 60 hr. minus A*</label>
                <div className="border-b border-gray-400 h-6"></div>
              </div>
              <div>
                <label className="block text-xs text-gray-600">C. Total hours on duty last 7 days including today.</label>
                <div className="border-b border-gray-400 h-6"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 34-Hour Reset */}
        <div className="mt-4 p-3 border border-gray-400 bg-white">
          <div className="text-xs text-gray-600">
            If you took 34 consecutive hours off duty you have 60/70 hours available
          </div>
          <div className="border-b border-gray-400 h-6 mt-2"></div>
        </div>
      </div>
    </div>
  )
}

export default BlankLogForm
