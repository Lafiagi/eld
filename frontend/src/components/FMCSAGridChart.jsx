import React, { useEffect, useRef, useState } from 'react';

const FMCSAGridChart = ({ log, onTimeClick, className = "" }) => {
  const canvasRef = useRef(null);
  const [hoverInfo, setHoverInfo] = useState(null);

  useEffect(() => {
    if (log) {
      drawChart();
    }
  }, [log]);

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = 1600 * dpr;
    canvas.height = 320 * dpr;
    canvas.style.width = '1600px';
    canvas.style.height = '320px';
    ctx.scale(dpr, dpr);

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 1600, 320);

    const labelWidth = 120;
    const timeGridWidth = 1400;
    const summaryWidth = 80;
    const rowHeight = 60;
    const headerHeight = 40;
    const hourWidth = timeGridWidth / 24;
    const quarterWidth = hourWidth / 4;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 1600, 320);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    
    for (let hour = 0; hour < 24; hour++) {
      const x = labelWidth + (hour * hourWidth);
      const y = headerHeight - 5;
      
      if (hour === 0) {
        ctx.font = 'bold 10px Arial';
        ctx.fillText('Midnight', x, y);
        ctx.font = 'bold 12px Arial';
      } else if (hour === 12) {
        ctx.fillText('Noon', x, y);
      } else if (hour < 12) {
        ctx.fillText(`${hour}`, x, y);
      } else {
        ctx.fillText(`${hour - 12}`, x, y);
      }
    }
    const dutyStatuses = [
      { label: 'OFF DUTY', color: '#E6F3FF', status: 'off_duty' },
      { label: 'SLEEPER BERTH', color: '#B3D9FF', status: 'sleeper_berth' },
      { label: 'DRIVING', color: '#FFB366', status: 'driving' },
      { label: 'ON DUTY (NOT DRIVING)', color: '#FFF2B3', status: 'on_duty' }
    ];

    dutyStatuses.forEach((status, index) => {
      const y = headerHeight + (index * rowHeight);
      
      // Draw status row background
      ctx.fillStyle = status.color;
      ctx.fillRect(labelWidth, y, timeGridWidth, rowHeight);
      
      // Draw status label
      ctx.fillStyle = '#000';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(status.label, 10, y + 20);
      
      // Draw row border
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(labelWidth, y, timeGridWidth, rowHeight);
    });

    // Draw 15-minute interval grid lines
    for (let hour = 0; hour <= 24; hour++) {
      const x = labelWidth + (hour * hourWidth);
      
      // Hour lines (bolder)
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, headerHeight);
      ctx.lineTo(x, headerHeight + (4 * rowHeight));
      ctx.stroke();
      
      // 15-minute interval lines (within each duty status row, 40% height)
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2;
      for (let quarter = 1; quarter < 4; quarter++) {
        const quarterX = x + (quarter * quarterWidth);
        // Draw 15-minute lines within each duty status row (40% height from bottom)
        for (let row = 0; row < 4; row++) {
          const rowY = headerHeight + (row * rowHeight);
          const shortLineHeight = rowHeight * 0.4; // 40% of row height
          const shortLineStart = rowY + rowHeight - shortLineHeight; // Start from bottom
          ctx.beginPath();
          ctx.moveTo(quarterX, shortLineStart);
          ctx.lineTo(quarterX, shortLineStart + shortLineHeight);
          ctx.stroke();
        }
      }
    }

    // Draw duty status timeline
    if (log && log.duty_statuses) {
      drawDutyStatusTimeline(ctx, log, labelWidth, timeGridWidth, headerHeight, rowHeight, hourWidth);
    }

    // Draw summary column
    drawSummaryColumn(ctx, log, labelWidth + timeGridWidth, headerHeight, rowHeight);

    // Draw vertical markers (like in the screenshot)
    // Removed drawVerticalMarkers - no longer needed
  };

  const drawDutyStatusTimeline = (ctx, log, labelWidth, timeGridWidth, headerHeight, rowHeight, hourWidth) => {
    const statuses = log.duty_statuses || [];
    const statusRowMap = {
      'off_duty': 0,
      'sleeper_berth': 1,
      'driving': 2,
      'on_duty': 3
    };

    // Draw each duty status segment independently (no connecting lines)
    ctx.strokeStyle = '#0066CC'; // Blue color like in the image
    ctx.lineWidth = 4; // Match vertical line thickness
    
    // Sort statuses by start time to ensure proper rendering order
    const sortedStatuses = [...statuses].sort((a, b) => 
      new Date(a.start_time) - new Date(b.start_time)
    );
    
    // Check if we need to add OFF DUTY from midnight to first activity
    const firstActivity = sortedStatuses.find(s => s.status !== 'off_duty');
    if (firstActivity) {
      const firstActivityStartTime = new Date(firstActivity.start_time);
      const firstActivityStartHour = firstActivityStartTime.getHours() + (firstActivityStartTime.getMinutes() / 60);
      
      // If first activity doesn't start at midnight, add OFF DUTY from midnight to first activity
      if (firstActivityStartHour > 0) {
        const midnightX = labelWidth + (0 * hourWidth); // Midnight
        const firstActivityStartX = labelWidth + (firstActivityStartHour * hourWidth);
        const offDutyRowIndex = statusRowMap['off_duty'] || 0;
        const offDutyY = headerHeight + (offDutyRowIndex * rowHeight) + (rowHeight / 2);
        
        // Draw OFF DUTY line from midnight to first activity
        ctx.beginPath();
        ctx.moveTo(midnightX, offDutyY);
        ctx.lineTo(firstActivityStartX, offDutyY);
        ctx.stroke();
        
        // Draw vertical line from OFF DUTY to first activity
        const firstRowIndex = statusRowMap[firstActivity.status] || 0;
        const firstY = headerHeight + (firstRowIndex * rowHeight) + (rowHeight / 2);
        
        ctx.lineWidth = 4; // 4px thickness
        ctx.beginPath();
        ctx.moveTo(firstActivityStartX, offDutyY);
        ctx.lineTo(firstActivityStartX, firstY);
        ctx.stroke();
      }
    }
    
    // Draw each segment independently
    sortedStatuses.forEach((status, index) => {
      const startTime = new Date(status.start_time);
      const endTime = new Date(status.end_time);
      
      const startHour = startTime.getHours() + (startTime.getMinutes() / 60);
      const endHour = endTime.getHours() + (endTime.getMinutes() / 60);
      
      const startX = labelWidth + (startHour * hourWidth);
      const endX = labelWidth + (endHour * hourWidth);
      const rowIndex = statusRowMap[status.status] || 0;
      const y = headerHeight + (rowIndex * rowHeight) + (rowHeight / 2);
      
      // Special case: Handle OFF DUTY lines properly
      if (status.status === 'off_duty') {
        // Check if this OFF DUTY period spans midnight (starts in evening, ends next morning)
        const startHour = startTime.getHours();
        const endHour = endTime.getHours();
        const spansMidnight = startHour > 12 && endHour < 12; // Starts PM, ends AM next day
        
        if (spansMidnight) {
          // Draw OFF DUTY line from start time to midnight
          const midnightX = labelWidth + (24 * hourWidth); // 24 hours = midnight
          ctx.beginPath();
          ctx.moveTo(startX, y);
          ctx.lineTo(midnightX, y);
          ctx.stroke();
          
          // Draw OFF DUTY line from midnight to first activity start time (not end time)
          const midnightStartX = labelWidth + (0 * hourWidth); // 0 hours = midnight
          
          // Find the first activity start time to stop the OFF DUTY line there
          // Sort all statuses by start time to find the earliest non-OFF DUTY activity
          const allStatuses = [...statuses].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
          const firstActivity = allStatuses.find(s => s.status !== 'off_duty');
          
          if (firstActivity) {
            const firstActivityStartTime = new Date(firstActivity.start_time);
            const firstActivityStartHour = firstActivityStartTime.getHours() + (firstActivityStartTime.getMinutes() / 60);
            const firstActivityStartX = labelWidth + (firstActivityStartHour * hourWidth);
            
            ctx.beginPath();
            ctx.moveTo(midnightStartX, y);
            ctx.lineTo(firstActivityStartX, y);
            ctx.stroke();
          } else {
            // Fallback to end time if no first activity found
            ctx.beginPath();
            ctx.moveTo(midnightStartX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
          }
        } else {
          // Regular OFF DUTY period (not spanning midnight)
          ctx.beginPath();
          ctx.moveTo(startX, y);
          ctx.lineTo(endX, y);
          ctx.stroke();
        }
        return;
      }
      
      // Draw horizontal line for all other statuses
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    });
    
    // Draw vertical connecting lines between consecutive segments with different statuses (include OFF DUTY)
    for (let i = 0; i < sortedStatuses.length - 1; i++) {
      const currentStatus = sortedStatuses[i];
      const nextStatus = sortedStatuses[i + 1];
      
      const currentEndTime = new Date(currentStatus.end_time);
      const nextStartTime = new Date(nextStatus.start_time);
      
      // Only connect if times are consecutive (no gap)
      if (currentEndTime.getTime() === nextStartTime.getTime()) {
        const currentEndHour = currentEndTime.getHours() + (currentEndTime.getMinutes() / 60);
        const nextStartHour = nextStartTime.getHours() + (nextStartTime.getMinutes() / 60);
        
        const currentEndX = labelWidth + (currentEndHour * hourWidth);
        const nextStartX = labelWidth + (nextStartHour * hourWidth);
        
        const currentRowIndex = statusRowMap[currentStatus.status] || 0;
        const nextRowIndex = statusRowMap[nextStatus.status] || 0;
        
        const currentY = headerHeight + (currentRowIndex * rowHeight) + (rowHeight / 2);
        const nextY = headerHeight + (nextRowIndex * rowHeight) + (rowHeight / 2);
        
        // Draw vertical line for all transitions (including OFF DUTY)
        ctx.lineWidth = 4; // 4px thickness
        ctx.beginPath();
        ctx.moveTo(currentEndX, currentY);
        ctx.lineTo(nextStartX, nextY);
        ctx.stroke();
      }
    }
    
    // Draw vertical line from end of OFF DUTY period to first activity (if first activity doesn't start at midnight)
    if (sortedStatuses.length > 0) {
      const firstStatus = sortedStatuses[0];
      const firstStartTime = new Date(firstStatus.start_time);
      const firstStartHour = firstStartTime.getHours() + (firstStartTime.getMinutes() / 60);
      
      // If first activity doesn't start at midnight, find the OFF DUTY period that ends closest to the first activity start time
      if (firstStartHour > 0) {
        // Find all OFF DUTY periods and find the one that ends closest to the first activity start time
        const offDutyPeriods = sortedStatuses.filter(status => status.status === 'off_duty');
        let closestOffDutyPeriod = null;
        let minTimeDiff = Infinity;
        
        offDutyPeriods.forEach(period => {
          const periodEndTime = new Date(period.end_time);
          const timeDiff = Math.abs(periodEndTime.getTime() - firstStartTime.getTime());
          if (timeDiff < minTimeDiff) {
            minTimeDiff = timeDiff;
            closestOffDutyPeriod = period;
          }
        });
        
        if (closestOffDutyPeriod) {
          // Use the first activity's start time for both X coordinates to create a vertical line
          const firstStartX = labelWidth + (firstStartHour * hourWidth);
          
          // Find the row indices
          const offDutyRowIndex = statusRowMap['off_duty'] || 0;
          const firstRowIndex = statusRowMap[firstStatus.status] || 0;
          
          const offDutyY = headerHeight + (offDutyRowIndex * rowHeight) + (rowHeight / 2);
          const firstY = headerHeight + (firstRowIndex * rowHeight) + (rowHeight / 2);
          
          // Draw vertical line from OFF DUTY row to first activity row at the same X position
          ctx.lineWidth = 4; // 4px thickness
          ctx.beginPath();
          ctx.moveTo(firstStartX, offDutyY);
          ctx.lineTo(firstStartX, firstY);
          ctx.stroke();
        }
      }
    }
    
    // Draw small square markers at transition points for OFF DUTY (to show connection points)
    statuses.forEach((status, index) => {
      if (status.status === 'off_duty') {
        const startTime = new Date(status.start_time);
        const endTime = new Date(status.end_time);
        
        const startHour = startTime.getHours() + (startTime.getMinutes() / 60);
        const endHour = endTime.getHours() + (endTime.getMinutes() / 60);
        
        const startX = labelWidth + (startHour * hourWidth);
        const endX = labelWidth + (endHour * hourWidth);
        const rowIndex = statusRowMap[status.status] || 0;
        const y = headerHeight + (rowIndex * rowHeight) + (rowHeight / 2);
        
        // Draw small square markers at start and end of OFF DUTY periods
        ctx.fillStyle = '#0066CC';
        ctx.fillRect(startX - 1, y - 1, 2, 2);
        ctx.fillRect(endX - 1, y - 1, 2, 2);
      }
    });
    
    // Draw small square markers at transition points for non-OFF DUTY statuses
    statuses.forEach((status, index) => {
      // Skip markers for OFF DUTY status (handled separately above)
      if (status.status === 'off_duty') {
        return;
      }
      
      const startTime = new Date(status.start_time);
      const endTime = new Date(status.end_time);
      
      const startHour = startTime.getHours() + (startTime.getMinutes() / 60);
      const endHour = endTime.getHours() + (endTime.getMinutes() / 60);
      
      const startX = labelWidth + (startHour * hourWidth);
      const endX = labelWidth + (endHour * hourWidth);
      const rowIndex = statusRowMap[status.status] || 0;
      const y = headerHeight + (rowIndex * rowHeight) + (rowHeight / 2);
      
      // Draw small square at start of each segment
      ctx.fillStyle = '#0066CC';
      ctx.fillRect(startX - 1, y - 1, 2, 2);
      
      // Draw small square at end of each segment (except last one)
      if (index < statuses.length - 1) {
        ctx.fillRect(endX - 1, y - 1, 2, 2);
      }
    });

  };

  const drawSummaryColumn = (ctx, log, startX, headerHeight, rowHeight) => {
    const totals = {
      off_duty: log?.off_duty_hours || 0,
      sleeper_berth: log?.sleeper_berth_hours || 0,
      driving: log?.driving_hours || 0,
      on_duty: log?.on_duty_hours || 0
    };
    

    const statuses = [
      { label: 'OFF DUTY', hours: totals.off_duty, color: '#E6F3FF' },
      { label: 'SLEEPER BERTH', hours: totals.sleeper_berth, color: '#B3D9FF' },
      { label: 'DRIVING', hours: totals.driving, color: '#FFB366' },
      { label: 'ON DUTY', hours: totals.on_duty, color: '#FFF2B3' }
    ];

    // Draw summary header
    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TOTAL HOURS', startX + 40, headerHeight - 5);

    // Draw summary for each status
    statuses.forEach((status, index) => {
      const y = headerHeight + (index * rowHeight);
      
      // Draw background
      ctx.fillStyle = status.color;
      ctx.fillRect(startX, y, 80, rowHeight);
      
      // Draw border
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, y, 80, rowHeight);
      
      // Draw hours
      ctx.fillStyle = '#000';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${status.hours.toFixed(2)}`, startX + 40, y + 25);
    });
  };

  // Removed drawVerticalMarkers function - no longer needed

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Calculate which time slot was clicked
    const labelWidth = 120;
    const timeGridWidth = 1200; // Updated to match new width
    const hourWidth = timeGridWidth / 24;
    
    if (x >= labelWidth && x < labelWidth + timeGridWidth) {
      const relativeX = x - labelWidth;
      const hour = Math.floor(relativeX / hourWidth);
      const minute = Math.floor(((relativeX % hourWidth) / hourWidth) * 60);
      
      if (onTimeClick) {
        onTimeClick({
          hour,
          minute,
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        });
      }
    }
  };

  return (
    <div className={`fmcsa-grid-chart ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2">FMCSA Electronic Logging Device - Daily Log</h3>
        <div className="text-sm text-gray-600">
          <p><strong>Driver:</strong> {log?.driver_name || 'Driver'}</p>
          <p><strong>Date:</strong> {log?.log_date || 'N/A'}</p>
          <p><strong>Vehicle:</strong> {log?.vehicle_number || 'N/A'}</p>
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="border border-gray-300 cursor-crosshair"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      
      {hoverInfo && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
          <p><strong>Time:</strong> {hoverInfo.time}</p>
          <p><strong>Status:</strong> {hoverInfo.status}</p>
          <p><strong>Location:</strong> {hoverInfo.location}</p>
        </div>
      )}
    </div>
  );
};

export default FMCSAGridChart;
