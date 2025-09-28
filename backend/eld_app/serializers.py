from rest_framework import serializers
from .models import Trip, RoutePoint, ELDLog, DutyStatus


class RoutePointSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoutePoint
        fields = '__all__'


class DutyStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = DutyStatus
        fields = '__all__'


class ELDLogSerializer(serializers.ModelSerializer):
    duty_statuses = DutyStatusSerializer(many=True, read_only=True)
    
    class Meta:
        model = ELDLog
        fields = '__all__'


class TripSerializer(serializers.ModelSerializer):
    route_points = RoutePointSerializer(many=True, read_only=True)
    eld_logs = ELDLogSerializer(many=True, read_only=True)
    fuel_stops = serializers.SerializerMethodField()
    rest_stops = serializers.SerializerMethodField()
    
    class Meta:
        model = Trip
        fields = '__all__'
    
    def get_fuel_stops(self, obj):
        """Calculate fuel stops based on trip distance"""
        if not obj.total_distance:
            return []
        
        from .services import RouteService
        route_service = RouteService()
        return route_service._plan_fuel_stops(obj.total_distance)
    
    def get_rest_stops(self, obj):
        """Calculate rest stops based on trip duration"""
        if not obj.estimated_duration:
            return []
        
        from .services import RouteService
        route_service = RouteService()
        return route_service._plan_rest_stops(obj.estimated_duration)


class TripCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = ['id', 'current_location', 'pickup_location', 'dropoff_location', 'current_cycle_used']
        read_only_fields = ['id']
    
    def validate_current_cycle_used(self, value):
        if value < 0 or value > 70:
            raise serializers.ValidationError("Current cycle used must be between 0 and 70 hours")
        return value
