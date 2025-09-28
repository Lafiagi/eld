from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Trip, RoutePoint, ELDLog, DutyStatus
from .serializers import TripSerializer, TripCreateSerializer, ELDLogSerializer
from .services import RouteService, ELDLogService


class TripListCreateView(generics.ListCreateAPIView):
    """View for listing and creating trips"""
    queryset = Trip.objects.all()
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TripCreateSerializer
        return TripSerializer
    
    def perform_create(self, serializer):
        try:
            trip = serializer.save()
            
            # Calculate route and generate logs
            route_service = RouteService()
            eld_service = ELDLogService()
            
            # Get route data
            route_data = route_service.calculate_route(
                trip.current_location,
                trip.pickup_location,
                trip.dropoff_location
            )
            
            # Update trip with calculated data
            trip.total_distance = route_data['total_distance']
            trip.estimated_duration = route_data['estimated_duration']
            trip.save()
            
            # Create route points
            for i, point in enumerate(route_data['route_points']):
                RoutePoint.objects.create(
                    trip=trip,
                    latitude=point['coords'][0],
                    longitude=point['coords'][1],
                    address=point['location'],
                    point_type=point['type'],
                    sequence=i
                )
            
            # Generate ELD logs
            eld_logs_data = eld_service.generate_eld_logs(trip, route_data)
            
            for log_data in eld_logs_data:
                eld_log = ELDLog.objects.create(
                    trip=trip,
                    log_date=log_data['log_date'],
                    driver_name=log_data['driver_name'],
                    carrier_name=log_data['carrier_name'],
                    vehicle_number=log_data['vehicle_number'],
                    off_duty_hours=log_data['off_duty_hours'],
                    sleeper_berth_hours=log_data['sleeper_berth_hours'],
                    driving_hours=log_data['driving_hours'],
                    on_duty_hours=log_data['on_duty_hours'],
                    total_on_duty_7_days=log_data['total_on_duty_7_days'],
                    hours_available_70hr=log_data['hours_available_70hr'],
                    total_on_duty_5_days=log_data['total_on_duty_5_days'],
                    total_on_duty_6_days=log_data['total_on_duty_6_days'],
                    hours_available_60hr=log_data['hours_available_60hr']
                )
                
                # Create duty status entries
                for status_data in log_data['duty_statuses']:
                    DutyStatus.objects.create(
                        eld_log=eld_log,
                        start_time=status_data['start_time'],
                        end_time=status_data['end_time'],
                        status=status_data['status'],
                        location=status_data['location'],
                        remarks=status_data['remarks']
                    )
            
            
        except Exception:
            # Log error for debugging
            raise


class TripDetailView(generics.RetrieveAPIView):
    """View for retrieving a specific trip"""
    queryset = Trip.objects.all()
    serializer_class = TripSerializer


@api_view(['GET'])
def trip_logs(request, trip_id):
    """Get ELD logs for a trip"""
    trip = get_object_or_404(Trip, id=trip_id)
    logs = ELDLog.objects.filter(trip=trip).order_by('log_date')
    
    serializer = ELDLogSerializer(logs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def generate_pdf_log(request, trip_id, log_id):
    """Generate PDF for a specific ELD log"""
    from django.http import HttpResponse
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.lib.units import inch
    from io import BytesIO
    
    trip = get_object_or_404(Trip, id=trip_id)
    eld_log = get_object_or_404(ELDLog, id=log_id, trip=trip)
    
    # Create PDF buffer
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        alignment=1  # Center alignment
    )
    story.append(Paragraph("Electronic Logging Device - Daily Log", title_style))
    story.append(Spacer(1, 20))
    
    # Driver and date info
    info_data = [
        ['Driver:', eld_log.driver_name],
        ['Date:', eld_log.log_date.strftime('%m/%d/%Y')],
        ['Vehicle:', eld_log.vehicle_number],
        ['Carrier:', eld_log.carrier_name]
    ]
    
    info_table = Table(info_data, colWidths=[1.5*inch, 3*inch])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 20))
    
    # Duty status table
    duty_data = [['Start Time', 'End Time', 'Status', 'Location', 'Remarks']]
    
    for status in eld_log.duty_statuses.all().order_by('start_time'):
        start_time = status.start_time.strftime('%H:%M')
        end_time = status.end_time.strftime('%H:%M')
        status_display = status.status.replace('_', ' ').title()
        
        duty_data.append([
            start_time,
            end_time,
            status_display,
            status.location,
            status.remarks
        ])
    
    duty_table = Table(duty_data, colWidths=[1*inch, 1*inch, 1.2*inch, 1.5*inch, 2.3*inch])
    duty_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(duty_table)
    story.append(Spacer(1, 20))
    
    # Summary table
    summary_data = [
        ['Off Duty Hours:', f"{eld_log.off_duty_hours:.2f}"],
        ['Sleeper Berth Hours:', f"{eld_log.sleeper_berth_hours:.2f}"],
        ['Driving Hours:', f"{eld_log.driving_hours:.2f}"],
        ['On Duty Hours:', f"{eld_log.on_duty_hours:.2f}"],
        ['Total Hours:', f"{eld_log.off_duty_hours + eld_log.sleeper_berth_hours + eld_log.driving_hours + eld_log.on_duty_hours:.2f}"]
    ]
    
    summary_table = Table(summary_data, colWidths=[2*inch, 1*inch])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(summary_table)
    
    # Build PDF
    doc.build(story)
    
    # Get PDF content
    pdf_content = buffer.getvalue()
    buffer.close()
    
    # Return PDF response
    response = HttpResponse(pdf_content, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="eld_log_{eld_log.log_date}_{eld_log.driver_name}.pdf"'
    return response


@api_view(['POST'])
def calculate_route(request):
    """Calculate route without creating a trip"""
    current_location = request.data.get('current_location')
    pickup_location = request.data.get('pickup_location')
    dropoff_location = request.data.get('dropoff_location')
    
    if not all([current_location, pickup_location, dropoff_location]):
        return Response(
            {'error': 'Missing required fields'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    route_service = RouteService()
    route_data = route_service.calculate_route(
        current_location,
        pickup_location,
        dropoff_location
    )
    
    return Response(route_data)
