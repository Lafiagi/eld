import requests
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
from django.conf import settings
import math
from geopy.geocoders import Nominatim
from geopy.distance import geodesic


class RouteService:
    """Service for calculating routes and stops"""
    
    def __init__(self):
        self.openroute_api_key = settings.OPENROUTE_API_KEY
        self.base_url = "https://api.openrouteservice.org/v2"
        self.geolocator = Nominatim(user_agent="eld_log_generator")
    
    def geocode_address(self, address: str) -> Tuple[float, float]:
        """Convert address to coordinates using OpenRouteService or hardcoded coordinates"""
        city_coords = {
            'new york': (40.7128, -74.0060),
            'new york, ny': (40.7128, -74.0060),
            'nyc': (40.7128, -74.0060),
            'philadelphia': (39.9526, -75.1652),
            'philadelphia, pa': (39.9526, -75.1652),
            'philly': (39.9526, -75.1652),
            'boston': (42.3601, -71.0589),
            'boston, ma': (42.3601, -71.0589),
            'chicago': (41.8781, -87.6298),
            'chicago, il': (41.8781, -87.6298),
            'los angeles': (34.0522, -118.2437),
            'los angeles, ca': (34.0522, -118.2437),
            'miami': (25.7617, -80.1918),
            'miami, fl': (25.7617, -80.1918),
            'houston': (29.7604, -95.3698),
            'houston, tx': (29.7604, -95.3698),
            'atlanta': (33.7490, -84.3880),
            'atlanta, ga': (33.7490, -84.3880),
            'denver': (39.7392, -104.9903),
            'denver, co': (39.7392, -104.9903),
            'seattle': (47.6062, -122.3321),
            'seattle, wa': (47.6062, -122.3321),
            'portland': (45.5152, -122.6784),
            'portland, or': (45.5152, -122.6784),
        }
        
        # Check for exact matches first
        address_lower = address.lower().strip()
        if address_lower in city_coords:
            return city_coords[address_lower]
        
        # Check for partial matches
        for city, coords in city_coords.items():
            if city in address_lower or address_lower in city:
                return coords
        
        # Try geopy geocoding first
        try:
            location = self.geolocator.geocode(address, timeout=10)
            if location:
                return (location.latitude, location.longitude)
        except Exception as e:
            print(f"Geopy geocoding error: {e}")
        
        # If we have an API key, try OpenRouteService
        if self.openroute_api_key:
            url = f"{self.base_url}/geocode/search"
            params = {
                'api_key': self.openroute_api_key,
                'text': address,
                'size': 1
            }
            
            try:
                response = requests.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    if data.get('features'):
                        coords = data['features'][0]['geometry']['coordinates']
                        return (coords[1], coords[0])  # Return lat, lng
            except Exception as e:
                print(f"OpenRouteService geocoding error: {e}")
        
        # Final fallback to NYC coordinates
        print(f"No coordinates found for '{address}', using NYC as fallback")
        return (40.7128, -74.0060)
    
    def calculate_route(self, start: str, pickup: str, dropoff: str) -> Dict:
        """Calculate route with stops and fuel points"""
        # Geocode all locations
        start_coords = self.geocode_address(start)
        pickup_coords = self.geocode_address(pickup)
        dropoff_coords = self.geocode_address(dropoff)
        
        # Calculate route using OpenRouteService or fallback
        route_data = self._get_route_details(start_coords, pickup_coords, dropoff_coords)
        
        # Plan fuel stops (every 1000 miles)
        fuel_stops = self._plan_fuel_stops(route_data['total_distance'])
        
        # Plan rest stops (every 8 hours of driving)
        rest_stops = self._plan_rest_stops(route_data['estimated_duration'])
        
        return {
            'total_distance': route_data['total_distance'],
            'estimated_duration': route_data['estimated_duration'],
            'fuel_stops': fuel_stops,
            'rest_stops': rest_stops,
            'route_points': [
                {'type': 'start', 'location': start, 'coords': start_coords},
                {'type': 'pickup', 'location': pickup, 'coords': pickup_coords},
                {'type': 'dropoff', 'location': dropoff, 'coords': dropoff_coords}
            ],
            'route_geometry': route_data.get('geometry', [])
        }
    
    def _calculate_distance(self, coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
        """Calculate distance between two coordinates in miles using geopy"""
        try:
            # Use geopy's geodesic distance calculation (more accurate than Haversine)
            distance = geodesic(coord1, coord2).miles
            return distance
        except Exception as e:
            print(f"Distance calculation error: {e}")
            # Fallback to simple calculation
            lat1, lon1 = coord1
            lat2, lon2 = coord2
            R = 3959  # Earth's radius in miles
            dlat = math.radians(lat2 - lat1)
            dlon = math.radians(lon2 - lon1)
            a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
            c = 2 * math.asin(math.sqrt(a))
            return R * c
    
    def _plan_fuel_stops(self, total_distance: float) -> List[Dict]:
        """Plan fuel stops every 1000 miles (app assumption)"""
        fuel_stops = []
        current_distance = 0
        stop_number = 1
        
        # App assumption: Fueling at least once every 1,000 miles
        while current_distance < total_distance:
            current_distance += 1000
            if current_distance < total_distance:
                fuel_stops.append({
                    'mileage': current_distance,
                    'location': f'Fuel Stop {stop_number}',
                    'estimated_time': current_distance / 60,  # Assuming 60 mph average speed
                    'duration_minutes': 30  # 30 minutes for fueling (standard truck stop time)
                })
                stop_number += 1
        
        return fuel_stops
    
    def _plan_rest_stops(self, total_duration: float) -> List[Dict]:
        """Plan rest stops every 8 hours of driving"""
        rest_stops = []
        current_time = 0
        stop_number = 1
        
        while current_time < total_duration:
            current_time += 8
            if current_time < total_duration:
                rest_stops.append({
                    'hours_elapsed': current_time,
                    'location': f'Rest Stop {stop_number}',
                    'duration_hours': 10,  # 10-hour rest break
                    'estimated_time': current_time
                })
                stop_number += 1
        
        return rest_stops
    
    def _get_route_details(self, start_coords: Tuple[float, float], pickup_coords: Tuple[float, float], dropoff_coords: Tuple[float, float]) -> Dict:
        """Get detailed route information using OpenRouteService or fallback calculation"""
        if self.openroute_api_key:
            return self._get_openroute_route(start_coords, pickup_coords, dropoff_coords)
        else:
            return self._get_fallback_route(start_coords, pickup_coords, dropoff_coords)
    
    def _get_openroute_route(self, start_coords: Tuple[float, float], pickup_coords: Tuple[float, float], dropoff_coords: Tuple[float, float]) -> Dict:
        """Get route using OpenRouteService API"""
        try:
            # Create waypoints for the route
            coordinates = [
                [start_coords[1], start_coords[0]],  # [lng, lat] format
                [pickup_coords[1], pickup_coords[0]],
                [dropoff_coords[1], dropoff_coords[0]]
            ]
            
            url = f"{self.base_url}/directions/driving-hgv"
            headers = {
                'Authorization': self.openroute_api_key,
                'Content-Type': 'application/json'
            }
            data = {
                'coordinates': coordinates,
                'format': 'geojson',
                'options': {
                    'avoid_features': ['tollways'],
                    'profile_params': {
                        'weightings': {
                            'steepness_difficulty': 0.1
                        }
                    }
                }
            }
            
            response = requests.post(url, headers=headers, json=data)
            if response.status_code == 200:
                route_data = response.json()
                if route_data.get('features'):
                    feature = route_data['features'][0]
                    properties = feature['properties']
                    geometry = feature['geometry']
                    
                    return {
                        'total_distance': properties['summary']['distance'] / 1609.34,  # Convert meters to miles
                        'estimated_duration': properties['summary']['duration'] / 3600,  # Convert seconds to hours
                        'geometry': geometry['coordinates']
                    }
        except Exception as e:
            print(f"OpenRouteService error: {e}")
        
        # Fallback to simple calculation
        return self._get_fallback_route(start_coords, pickup_coords, dropoff_coords)
    
    def _get_fallback_route(self, start_coords: Tuple[float, float], pickup_coords: Tuple[float, float], dropoff_coords: Tuple[float, float]) -> Dict:
        """Fallback route calculation using simple distance calculation"""
        # Calculate distances
        start_to_pickup = self._calculate_distance(start_coords, pickup_coords)
        pickup_to_dropoff = self._calculate_distance(pickup_coords, dropoff_coords)
        total_distance = start_to_pickup + pickup_to_dropoff
        
        # Estimate duration (assuming 60 mph average, but add 20% for city driving)
        estimated_duration = (total_distance / 60) * 1.2
        
        # Create simple route geometry (straight lines between points)
        route_coords = [
            [start_coords[1], start_coords[0]],  # [lng, lat]
            [pickup_coords[1], pickup_coords[0]],
            [dropoff_coords[1], dropoff_coords[0]]
        ]
        
        return {
            'total_distance': total_distance,
            'estimated_duration': estimated_duration,
            'geometry': route_coords
        }


class ELDLogService:
    """Service for generating ELD logs according to HOS rules"""
    
    def __init__(self):
        self.max_driving_hours = 11  # Maximum driving hours per day
        self.max_on_duty_hours = 14  # Maximum on-duty hours per day
        self.min_rest_hours = 10  # Minimum rest hours
        self.max_cycle_hours = 70  # Maximum hours in 8-day cycle
    
    def generate_eld_logs(self, trip, route_data: Dict) -> List[Dict]:
        """Generate ELD logs for the entire trip"""
        logs = []
        current_date = datetime.now().date()
        total_duration = route_data['estimated_duration']
        
        # Always generate at least one log, even for short trips
        days_needed = max(1, math.ceil(total_duration / 24))
        
        for day in range(days_needed):
            log_date = current_date + timedelta(days=day)
            log_data = self._generate_daily_log(trip, log_date, day, days_needed, route_data)
            logs.append(log_data)
        
        return logs
    
    def _generate_daily_log(self, trip, log_date: datetime.date, day: int, total_days: int, route_data: Dict) -> Dict:
        """Generate a single day's ELD log"""
        
        # Calculate realistic hours for this specific day based on FMCSA HOS rules:
        # - Property-carrying driver, 70hrs/8days
        # - No adverse driving conditions
        # - 1 hour for pickup and drop-off
        # - Follow 14-hour driving window and 11-hour driving limit rules
        
        # FMCSA HOS-Compliant Hour Distribution
        if total_days == 1:  # Single day trip
            # Realistic single-day distribution following HOS rules
            driving_hours = min(11.0, max(8.0, 10.5))  # 8-11 hours driving (HOS compliant)
            on_duty_hours = 2.5  # On duty not driving (pickup, dropoff, paperwork, fuel stops)
            off_duty_hours = 10.0  # Minimum 10 hours off duty (HOS requirement)
            sleeper_berth_hours = 1.5  # Sleeper berth time
            
            # Ensure total equals 24 hours
            total_current = driving_hours + on_duty_hours + off_duty_hours + sleeper_berth_hours
            if total_current < 24:
                # Add remaining time to off duty
                off_duty_hours += (24 - total_current)
        else:  # Multi-day trip - vary hours by day following HOS rules
            # Day 1: Full driving day
            if day == 0:
                driving_hours = 11.0  # Maximum driving hours
                on_duty_hours = 2.0   # Pickup, fuel stops
                off_duty_hours = 10.0  # Minimum 10 hours off duty
                sleeper_berth_hours = 1.0
            # Middle days: Moderate driving
            elif day < total_days - 1:
                driving_hours = 9.0   # Moderate driving
                on_duty_hours = 2.5   # Fuel stops, deliveries
                off_duty_hours = 10.0  # Minimum 10 hours off duty
                sleeper_berth_hours = 2.5
            # Last day: Reduced driving
            else:
                driving_hours = 8.0   # Reduced driving for last day
                on_duty_hours = 3.0   # Dropoff, paperwork
                off_duty_hours = 10.0  # Minimum 10 hours off duty
                sleeper_berth_hours = 3.0
            
            # Ensure total equals 24 hours
            total_current = driving_hours + on_duty_hours + off_duty_hours + sleeper_berth_hours
            if total_current < 24:
                # Add remaining time to off duty
                off_duty_hours += (24 - total_current)
        
        # Apply FMCSA compliance checks
        # 1. Check 34-hour restart
        restart_result = self._check_34_hour_restart(trip, log_date)
        
        # 2. Calculate rolling 70/8 cycle
        rolling_cycle_result = self._calculate_rolling_70_8_cycle(log_date, on_duty_hours)
        
        # 3. Apply sleeper berth provisions
        sleeper_berth_result = self._apply_sleeper_berth_provisions(
            off_duty_hours, sleeper_berth_hours, day, total_days
        )
        
        # 4. Detect HOS violations
        violation_result = self._detect_hos_violations(
            driving_hours, on_duty_hours, off_duty_hours, sleeper_berth_hours,
            rolling_cycle_result, sleeper_berth_result
        )
        
        # Update cycle hours based on restart
        if restart_result['cycle_reset']:
            cycle_hours_used = on_duty_hours  # Reset to current day only
        else:
            cycle_hours_used = trip.current_cycle_used + on_duty_hours
        
        return {
            'log_date': log_date,
            'driver_name': 'Driver',
            'carrier_name': 'Carrier',
            'vehicle_number': 'Truck-001',
            'off_duty_hours': off_duty_hours,
            'sleeper_berth_hours': sleeper_berth_hours,
            'driving_hours': driving_hours,
            'on_duty_hours': on_duty_hours,
            'total_on_duty_7_days': min(70, cycle_hours_used),
            'hours_available_70hr': rolling_cycle_result.get('hours_available_70hr', 0),
            'total_on_duty_5_days': min(60, cycle_hours_used),
            'total_on_duty_6_days': min(60, cycle_hours_used),
            'hours_available_60hr': rolling_cycle_result.get('hours_available_60hr', 0),
            'duty_statuses': self._generate_duty_statuses(log_date, driving_hours, on_duty_hours, off_duty_hours, sleeper_berth_hours, day, total_days),
            # FMCSA Compliance Information
            'compliance_status': violation_result.get('compliance_status', 'UNKNOWN'),
            'violation_count': violation_result.get('violation_count', 0),
            'is_compliant': violation_result.get('is_compliant', False),
            'violations': violation_result.get('violations', []),
            'restart_applies': restart_result.get('restart_applies', False),
            'sleeper_berth_split': sleeper_berth_result.get('sleeper_berth_split', False),
            'sleeper_berth_split_type': sleeper_berth_result.get('split_type', 'NONE'),
            'rolling_8_day_hours': rolling_cycle_result.get('rolling_8_day_hours', 0),
            'rolling_7_day_hours': rolling_cycle_result.get('rolling_7_day_hours', 0)
        }
    
    def _generate_duty_statuses(self, log_date: datetime.date, driving_hours: float, on_duty_hours: float, off_duty_hours: float, sleeper_berth_hours: float, day: int = 0, total_days: int = 1) -> List[Dict]:
        """Generate duty status entries for the day with FMCSA-compliant HOS rules"""
        statuses = []
        
        # Start at 6:00 AM (typical driver start time after 10-hour rest)
        current_time = datetime.combine(log_date, datetime.min.time().replace(hour=6))
        
        # Determine locations and remarks based on day
        if day == 0:  # First day
            pickup_remarks = 'On duty - pickup and pre-trip inspection (1 hour)'
        elif day == total_days - 1:  # Last day
            pickup_remarks = 'On duty - continue trip to dropoff'
        else:  # Middle days
            pickup_remarks = 'On duty - continue trip'
        
        # 1. Start with pickup/pre-trip (1 hour on duty not driving)
        pickup_end = current_time + timedelta(hours=1)
        statuses.append({
            'start_time': current_time,
            'end_time': pickup_end,
            'status': 'on_duty',
            'location': 'Terminal',
            'remarks': pickup_remarks
        })
        current_time = pickup_end
        
        # 2. Driving segment with 30-minute break enforcement
        if driving_hours > 8:
            # Split driving: first 8 hours, then 30-minute break, then remaining
            first_driving_segment = 8.0
            remaining_driving = driving_hours - 8.0
            
            # First driving segment (8 hours)
            driving_end = current_time + timedelta(hours=first_driving_segment)
            statuses.append({
                'start_time': current_time,
                'end_time': driving_end,
                'status': 'driving',
                'location': 'En route',
                'remarks': f'Driving for {first_driving_segment:.1f} hours'
            })
            current_time = driving_end
            
            # MANDATORY 30-minute break after 8 hours driving
            break_end = current_time + timedelta(minutes=30)
            statuses.append({
                'start_time': current_time,
                'end_time': break_end,
                'status': 'off_duty',
                'location': 'Rest Area',
                'remarks': 'MANDATORY 30-minute break after 8 hours driving'
            })
            current_time = break_end
            
            # Second driving segment
            if remaining_driving > 0:
                driving_end = current_time + timedelta(hours=remaining_driving)
                statuses.append({
                    'start_time': current_time,
                    'end_time': driving_end,
                    'status': 'driving',
                    'location': 'En route',
                    'remarks': f'Driving for {remaining_driving:.1f} hours (after break)'
                })
                current_time = driving_end
        else:
            # Single driving segment (≤ 8 hours)
            driving_end = current_time + timedelta(hours=driving_hours)
            statuses.append({
                'start_time': current_time,
                'end_time': driving_end,
                'status': 'driving',
                'location': 'En route',
                'remarks': f'Driving for {driving_hours:.1f} hours'
            })
            current_time = driving_end
        
        # 3. Additional on-duty time (fuel stops, deliveries, paperwork)
        remaining_on_duty = on_duty_hours - 1.0  # Subtract pickup time
        if remaining_on_duty > 0:
            on_duty_end = current_time + timedelta(hours=remaining_on_duty)
            statuses.append({
                'start_time': current_time,
                'end_time': on_duty_end,
                'status': 'on_duty',
                'location': 'Various Locations',
                'remarks': f'On duty - fuel stops, deliveries, paperwork ({remaining_on_duty:.1f} hours)'
            })
            current_time = on_duty_end
        
        # 4. Sleeper berth time (if applicable)
        if sleeper_berth_hours > 0:
            sleeper_end = current_time + timedelta(hours=sleeper_berth_hours)
            statuses.append({
                'start_time': current_time,
                'end_time': sleeper_end,
                'status': 'sleeper_berth',
                'location': 'Rest Area',
                'remarks': f'Sleeper berth - rest period ({sleeper_berth_hours:.1f} hours)'
            })
            current_time = sleeper_end
        
        # 5. Off-duty time (minimum 10 hours)
        if off_duty_hours > 0:
            off_duty_end = current_time + timedelta(hours=off_duty_hours)
            statuses.append({
                'start_time': current_time,
                'end_time': off_duty_end,
                'status': 'off_duty',
                'location': 'Terminal/Rest Area',
                'remarks': f'Off duty - rest period ({off_duty_hours:.1f} hours)'
            })
            current_time = off_duty_end
        
        # 6. Fill remaining time to reach 24 hours (if needed)
        remaining_time = timedelta(hours=24) - (current_time - datetime.combine(log_date, datetime.min.time().replace(hour=6)))
        if remaining_time.total_seconds() > 0:
            final_end = current_time + remaining_time
            statuses.append({
                'start_time': current_time,
                'end_time': final_end,
                'status': 'off_duty',
                'location': 'Terminal',
                'remarks': f'Off duty - end of day (remaining {remaining_time.total_seconds()/3600:.1f} hours)'
            })
        
        return statuses
    
    def _apply_sleeper_berth_provisions(self, off_duty_hours: float, sleeper_berth_hours: float, day: int, total_days: int) -> Dict:
        """Apply FMCSA sleeper berth split provisions (7+3, 7+2)"""
        
        # FMCSA Sleeper Berth Provisions:
        # 1. 10 consecutive hours off-duty OR
        # 2. 7 consecutive hours in sleeper + 3 consecutive hours off-duty OR  
        # 3. 7 consecutive hours in sleeper + 2 consecutive hours off-duty/sleeper
        
        total_rest_hours = off_duty_hours + sleeper_berth_hours
        
        if total_rest_hours < 10:
            # Not enough rest - this would be a violation
            return {
                'off_duty_hours': off_duty_hours,
                'sleeper_berth_hours': sleeper_berth_hours,
                'sleeper_berth_split': False,
                'compliance_status': 'VIOLATION - Insufficient rest hours'
            }
        
        # Determine sleeper berth split pattern based on day and total rest
        if day == 0 or day == total_days - 1:
            # First and last days: prefer 10 consecutive hours off-duty
            return {
                'off_duty_hours': max(10, off_duty_hours),
                'sleeper_berth_hours': max(0, total_rest_hours - max(10, off_duty_hours)),
                'sleeper_berth_split': False,
                'compliance_status': 'COMPLIANT - 10 consecutive hours off-duty'
            }
        else:
            # Middle days: use sleeper berth split provisions
            if total_rest_hours >= 10:
                # Apply 7+3 split (7 hours sleeper + 3 hours off-duty)
                sleeper_berth_hours = 7.0
                off_duty_hours = 3.0
                remaining_hours = total_rest_hours - 10
                
                # Distribute remaining hours
                if remaining_hours > 0:
                    off_duty_hours += remaining_hours * 0.6  # 60% to off-duty
                    sleeper_berth_hours += remaining_hours * 0.4  # 40% to sleeper
                
                return {
                    'off_duty_hours': off_duty_hours,
                    'sleeper_berth_hours': sleeper_berth_hours,
                    'sleeper_berth_split': True,
                    'split_type': '7+3',
                    'compliance_status': 'COMPLIANT - Sleeper berth split (7+3)'
                }
            else:
                # Fallback to 7+2 split if less than 10 hours total
                sleeper_berth_hours = 7.0
                off_duty_hours = max(2.0, total_rest_hours - 7.0)
                
                return {
                    'off_duty_hours': off_duty_hours,
                    'sleeper_berth_hours': sleeper_berth_hours,
                    'sleeper_berth_split': True,
                    'split_type': '7+2',
                    'compliance_status': 'COMPLIANT - Sleeper berth split (7+2)'
                }
    
    def _check_34_hour_restart(self, trip, log_date: datetime.date) -> Dict:
        """Check if 34-hour restart applies and reset cycle if needed"""
        
        has_34_hour_restart = False
        
        # Check if there was a 34-hour consecutive off-duty period
        # This is a simplified version - real implementation would check actual records
        if has_34_hour_restart:
            return {
                'restart_applies': True,
                'cycle_reset': True,
                'new_cycle_hours': 0,
                'restart_reason': '34-hour consecutive off-duty period completed'
            }
        else:
            return {
                'restart_applies': False,
                'cycle_reset': False,
                'new_cycle_hours': trip.current_cycle_used,
                'restart_reason': 'No 34-hour consecutive off-duty period found'
            }
    
    def _calculate_rolling_70_8_cycle(self, log_date: datetime.date, on_duty_hours: float) -> Dict:
        """Calculate rolling 70-hour/8-day cycle with proper day dropping"""
        
        # FMCSA Rolling 70/8 Rule:
        # Driver may not drive after 70 hours on duty in any 8-day period
        # The 8-day period is rolling, dropping the oldest day as each new day is added
        
        # Get the last 8 days of duty hours (simplified - in real system would query database)
        eight_days_ago = log_date - timedelta(days=8)
        
        # Simulate getting duty hours for the last 8 days
        # In a real implementation, this would query the database for actual duty hours
        rolling_8_day_hours = []
        
        # For simulation, create a rolling window of duty hours
        # This is simplified - real implementation would query actual records
        for i in range(8):
            day_date = eight_days_ago + timedelta(days=i)
            if day_date == log_date:
                # Today's hours
                rolling_8_day_hours.append(on_duty_hours)
            else:
                # Simulate historical hours (in real system, query database)
                # For demo purposes, assume 8 hours per day average
                rolling_8_day_hours.append(8.0)
        
        # Calculate total hours in rolling 8-day period
        total_rolling_hours = sum(rolling_8_day_hours)
        
        # Check if 70-hour limit would be exceeded
        would_exceed_70_hours = total_rolling_hours > 70
        
        # Calculate hours available in the cycle
        hours_available_70hr = max(0, 70 - total_rolling_hours)
        
        # Calculate 60-hour/7-day cycle as well (alternative rule)
        rolling_7_day_hours = rolling_8_day_hours[1:]  # Drop oldest day for 7-day calculation
        total_rolling_7_hours = sum(rolling_7_day_hours)
        hours_available_60hr = max(0, 60 - total_rolling_7_hours)
        
        return {
            'rolling_8_day_hours': total_rolling_hours,
            'rolling_7_day_hours': total_rolling_7_hours,
            'hours_available_70hr': hours_available_70hr,
            'hours_available_60hr': hours_available_60hr,
            'would_exceed_70hr': would_exceed_70_hours,
            'would_exceed_60hr': total_rolling_7_hours > 60,
            'compliance_status': 'COMPLIANT' if not would_exceed_70_hours else 'VIOLATION - Would exceed 70-hour limit'
        }
    
    def _detect_hos_violations(self, driving_hours: float, on_duty_hours: float, off_duty_hours: float, 
                              sleeper_berth_hours: float, rolling_cycle_result: Dict, 
                              sleeper_berth_result: Dict) -> Dict:
        """Detect and flag HOS violations"""
        
        violations = []
        violation_count = 0
        
        # 1. Check 11-hour driving limit
        if driving_hours > 11:
            violations.append({
                'type': 'DRIVING_LIMIT_VIOLATION',
                'description': f'Exceeded 11-hour driving limit: {driving_hours:.1f} hours',
                'severity': 'CRITICAL',
                'rule': '11-Hour Driving Limit'
            })
            violation_count += 1
        
        # 2. Check 14-hour on-duty window
        if on_duty_hours > 14:
            violations.append({
                'type': 'ON_DUTY_WINDOW_VIOLATION',
                'description': f'Exceeded 14-hour on-duty window: {on_duty_hours:.1f} hours',
                'severity': 'CRITICAL',
                'rule': '14-Hour On-Duty Window'
            })
            violation_count += 1
        
        # 3. Check 30-minute break requirement
        if driving_hours > 8:
            # This should be handled in duty status generation, but check for compliance
            violations.append({
                'type': 'BREAK_REQUIREMENT_WARNING',
                'description': f'30-minute break required after {driving_hours:.1f} hours driving',
                'severity': 'WARNING',
                'rule': '30-Minute Break After 8 Hours'
            })
        
        # 4. Check minimum 10-hour rest requirement
        total_rest_hours = off_duty_hours + sleeper_berth_hours
        if total_rest_hours < 10:
            violations.append({
                'type': 'REST_REQUIREMENT_VIOLATION',
                'description': f'Insufficient rest hours: {total_rest_hours:.1f} hours (minimum 10 required)',
                'severity': 'CRITICAL',
                'rule': '10-Hour Rest Requirement'
            })
            violation_count += 1
        
        # 5. Check 70-hour/8-day cycle violation
        if rolling_cycle_result.get('would_exceed_70hr', False):
            violations.append({
                'type': 'CYCLE_VIOLATION',
                'description': f'Would exceed 70-hour/8-day cycle: {rolling_cycle_result.get("rolling_8_day_hours", 0):.1f} hours',
                'severity': 'CRITICAL',
                'rule': '70-Hour/8-Day Cycle'
            })
            violation_count += 1
        
        # 6. Check sleeper berth provision violations
        if sleeper_berth_result.get('compliance_status', '').startswith('VIOLATION'):
            violations.append({
                'type': 'SLEEPER_BERTH_VIOLATION',
                'description': sleeper_berth_result.get('compliance_status', 'Sleeper berth provision violation'),
                'severity': 'CRITICAL',
                'rule': 'Sleeper Berth Provisions'
            })
            violation_count += 1
        
        # 7. Check for consecutive driving without break (8+ hours)
        if driving_hours > 8:
            violations.append({
                'type': 'CONSECUTIVE_DRIVING_VIOLATION',
                'description': f'Drove {driving_hours:.1f} consecutive hours without required 30-minute break',
                'severity': 'CRITICAL',
                'rule': '30-Minute Break After 8 Hours Driving'
            })
            violation_count += 1
        
        # Determine overall compliance status
        if violation_count == 0:
            compliance_status = 'COMPLIANT'
            overall_severity = 'NONE'
        elif violation_count <= 2:
            compliance_status = 'MINOR_VIOLATIONS'
            overall_severity = 'WARNING'
        else:
            compliance_status = 'MAJOR_VIOLATIONS'
            overall_severity = 'CRITICAL'
        
        return {
            'violations': violations,
            'violation_count': violation_count,
            'compliance_status': compliance_status,
            'overall_severity': overall_severity,
            'is_compliant': violation_count == 0,
            'requires_immediate_action': violation_count > 2
        }
