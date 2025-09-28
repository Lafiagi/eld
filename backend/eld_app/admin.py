from django.contrib import admin
from .models import Trip, RoutePoint, ELDLog, DutyStatus


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ['id', 'current_location', 'pickup_location', 'dropoff_location', 'current_cycle_used', 'created_at']
    list_filter = ['created_at']
    search_fields = ['current_location', 'pickup_location', 'dropoff_location']


@admin.register(RoutePoint)
class RoutePointAdmin(admin.ModelAdmin):
    list_display = ['trip', 'point_type', 'address', 'sequence']
    list_filter = ['point_type']
    search_fields = ['address']


@admin.register(ELDLog)
class ELDLogAdmin(admin.ModelAdmin):
    list_display = ['trip', 'log_date', 'driver_name', 'driving_hours', 'on_duty_hours']
    list_filter = ['log_date']
    search_fields = ['driver_name', 'carrier_name']


@admin.register(DutyStatus)
class DutyStatusAdmin(admin.ModelAdmin):
    list_display = ['eld_log', 'status', 'start_time', 'end_time', 'location']
    list_filter = ['status', 'start_time']
    search_fields = ['location', 'remarks']
