from django.urls import path
from . import views

urlpatterns = [
    path('trips/', views.TripListCreateView.as_view(), name='trip-list-create'),
    path('trips/<int:pk>/', views.TripDetailView.as_view(), name='trip-detail'),
    path('trips/<int:trip_id>/logs/', views.trip_logs, name='trip-logs'),
    path('trips/<int:trip_id>/logs/<int:log_id>/pdf/', views.generate_pdf_log, name='generate-pdf-log'),
    path('calculate-route/', views.calculate_route, name='calculate-route'),
]
