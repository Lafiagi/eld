from django.db import models


class Trip(models.Model):
    """Model to store trip information"""
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    current_cycle_used = models.FloatField(help_text="Hours used in current cycle")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Calculated fields
    total_distance = models.FloatField(null=True, blank=True, help_text="Total distance in miles")
    estimated_duration = models.FloatField(null=True, blank=True, help_text="Estimated duration in hours")
    
    class Meta:
        ordering = ['-created_at']


class RoutePoint(models.Model):
    """Model to store route points and stops"""
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='route_points')
    latitude = models.FloatField()
    longitude = models.FloatField()
    address = models.CharField(max_length=255)
    point_type = models.CharField(max_length=50, choices=[
        ('start', 'Start'),
        ('pickup', 'Pickup'),
        ('fuel', 'Fuel Stop'),
        ('rest', 'Rest Stop'),
        ('dropoff', 'Dropoff'),
        ('end', 'End')
    ])
    sequence = models.IntegerField()
    estimated_arrival = models.DateTimeField(null=True, blank=True)
    estimated_departure = models.DateTimeField(null=True, blank=True)
    duration_hours = models.FloatField(default=0, help_text="Hours spent at this location")


class ELDLog(models.Model):
    """Model to store generated ELD logs"""
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name='eld_logs')
    log_date = models.DateField()
    driver_name = models.CharField(max_length=255, default="Driver")
    carrier_name = models.CharField(max_length=255, default="Carrier")
    vehicle_number = models.CharField(max_length=50, default="Truck-001")
    
    # Hours breakdown
    off_duty_hours = models.FloatField(default=0)
    sleeper_berth_hours = models.FloatField(default=0)
    driving_hours = models.FloatField(default=0)
    on_duty_hours = models.FloatField(default=0)
    
    # 70-hour rule calculations
    total_on_duty_7_days = models.FloatField(default=0)
    hours_available_70hr = models.FloatField(default=0)
    total_on_duty_5_days = models.FloatField(default=0)
    
    # 60-hour rule calculations  
    total_on_duty_6_days = models.FloatField(default=0)
    hours_available_60hr = models.FloatField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['log_date']


class DutyStatus(models.Model):
    """Model to store individual duty status entries"""
    eld_log = models.ForeignKey(ELDLog, on_delete=models.CASCADE, related_name='duty_statuses')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=50, choices=[
        ('off_duty', 'Off Duty'),
        ('sleeper_berth', 'Sleeper Berth'),
        ('driving', 'Driving'),
        ('on_duty', 'On Duty (not driving)')
    ])
    location = models.CharField(max_length=255, blank=True)
    remarks = models.TextField(blank=True)
    
    class Meta:
        ordering = ['start_time']
