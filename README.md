# ELD Log Management System

A comprehensive full-stack application for generating FMCSA-compliant ELD (Electronic Logging Device) logs with interactive route planning and Hours of Service compliance for commercial drivers.

## Features

- **Route Calculation**: Calculate optimal routes with fuel and rest stops using OpenRouteService API
- **FMCSA-Compliant ELD Logs**: Generate official log sheets with interactive grid charts
- **Interactive Maps**: Visualize routes with custom markers for start, pickup, dropoff locations
- **HOS Compliance**: Full implementation of FMCSA Hours of Service rules
- **PDF Export**: Generate printable log sheets with ReportLab
- **Modern UI**: Clean, responsive interface with Tailwind CSS and React
- **Real-time Validation**: Automatic detection of HOS violations
- **Sleeper Berth Provisions**: Support for split rest periods

## Tech Stack

### Backend
- Django 4.2.7
- Django REST Framework 3.14.0
- SQLite (development)
- Python 3.11+
- ReportLab (PDF generation)
- Geopy (geocoding)
- OpenRouteService API

### Frontend
- React 18
- Vite
- Tailwind CSS
- Leaflet Maps
- Axios
- HTML5 Canvas (ELD grid charts)

## Installation

### Quick Setup (Recommended)

Run the automated setup script:
```bash
./scripts/setup.sh
```

This will set up both backend and frontend with all dependencies.

### Manual Setup

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

5. Create a superuser (optional):
```bash
python manage.py createsuperuser
```

6. Start the development server:
```bash
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Development Scripts

- **Setup everything**: `./scripts/setup.sh`
- **Start both servers**: `./scripts/dev.sh`
- **Backend only**: `cd backend && source venv/bin/activate && python manage.py runserver`
- **Frontend only**: `cd frontend && npm run dev`

## Project Structure

```
eld/
├── backend/                 # Django API
│   ├── eld_app/            # Main application
│   │   ├── models.py       # Database models
│   │   ├── services.py     # Business logic
│   │   ├── views.py        # API endpoints
│   │   └── serializers.py  # Data serialization
│   ├── eld_backend/        # Django settings
│   ├── requirements.txt    # Python dependencies
│   └── manage.py           # Django management
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   └── services/       # API services
│   ├── package.json        # Node dependencies
│   └── vite.config.js      # Vite configuration
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## Key Components

### Backend Services
- **RouteService**: Handles route calculation, geocoding, and stop planning
- **ELDLogService**: Generates FMCSA-compliant logs with HOS compliance
- **PDF Generation**: Creates printable log sheets using ReportLab

### Frontend Components
- **FMCSAGridChart**: Interactive HTML5 Canvas chart matching official FMCSA format
- **RouteMap**: Leaflet-based map with custom markers and route visualization
- **TripForm**: Trip creation with validation and location input
- **LogViewer**: Display and download ELD logs with PDF export

## API Endpoints

### Trips
- `GET /api/trips/` - List all trips
- `POST /api/trips/` - Create a new trip
- `GET /api/trips/{id}/` - Get trip details with fuel/rest stops
- `GET /api/trips/{id}/logs/` - Get ELD logs for a trip
- `GET /api/trips/{id}/logs/{log_id}/pdf/` - Download PDF log sheet

### ELD Logs
- `GET /api/trips/{id}/logs/` - List all logs for a trip
- `GET /api/trips/{id}/logs/{log_id}/` - Get specific log details
- `GET /api/trips/{id}/logs/{log_id}/pdf/` - Generate PDF log sheet

## Usage

1. **Create a Trip**: Enter current location, pickup, dropoff locations, and current cycle hours
2. **View Route**: Interactive map showing calculated route with fuel stops and rest stops
3. **Generate Logs**: Automatically generate FMCSA-compliant ELD logs with interactive grid charts
4. **View Logs**: Interactive FMCSA grid chart with 24-hour timeline and duty status visualization
5. **Export PDFs**: Download printable log sheets in official FMCSA format

## HOS Rules Implementation

The application implements comprehensive FMCSA Hours of Service rules:

### Core HOS Rules
- **70-Hour Rule**: Maximum 70 hours on duty in 8 consecutive days
- **60-Hour Rule**: Maximum 60 hours on duty in 7 consecutive days  
- **11-Hour Rule**: Maximum 11 hours driving per day
- **14-Hour Rule**: Maximum 14 hours on duty per day
- **10-Hour Rule**: Minimum 10 hours off duty between shifts
- **30-Minute Break**: Mandatory break after 8 hours of driving

### Advanced Features
- **Sleeper Berth Provisions**: Support for 7+3 and 7+2 hour splits
- **34-Hour Restart**: Reset 70-hour cycle with 34 consecutive hours off
- **Rolling Calculations**: Dynamic 70/8 and 60/7 day calculations
- **Violation Detection**: Automatic flagging of HOS violations
- **Property-Carrying Driver**: Optimized for 70-hour/8-day cycle

## Deployment

### Production Deployment

The application is configured for deployment under `/eld/` path on `api.ile-wa.com`:

#### URLs
- **Frontend**: `https://api.ile-wa.com/eld/`
- **Backend API**: `https://api.ile-wa.com/eld/api/`
- **Admin**: `https://api.ile-wa.com/eld/admin/`

#### Apache Configuration
The system is configured to work with your existing Apache VirtualHost:

```apache
# ELD System
ProxyPass /eld/ http://127.0.0.1:8038/
ProxyPassReverse /eld/ http://127.0.0.1:8038/
Alias /eld/static/ /var/www/eld/backend/staticfiles/
```

#### Manual Deployment

1. **Backend Setup**:
   ```bash
   # Deploy to /var/www/eld/backend
   cd /var/www/eld/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py collectstatic --noinput
   gunicorn --bind 127.0.0.1:8038 eld_backend.wsgi:application
   ```

2. **Frontend Setup**:
   ```bash
   # Deploy to /var/www/eld/frontend
   cd /var/www/eld/frontend
   npm install
   npm run build
   ```

3. **Service Management**:
   ```bash
   # Create systemd service for auto-start
   sudo systemctl enable eld-backend
   sudo systemctl start eld-backend
   ```

See `DEPLOYMENT.md` for detailed deployment instructions.

### Development vs Production

- **Development**: Frontend on port 3000, Backend on port 8000
- **Production**: Backend on port 8038, served through Apache proxy under `/eld/` path

## Environment Variables

### Backend
- `SECRET_KEY`: Django secret key
- `DEBUG`: Debug mode (True/False)
- `OPENROUTE_API_KEY`: OpenRouteService API key (optional, has fallback)
- `ALLOWED_HOSTS`: Allowed host names for production

### Frontend
- `VITE_API_URL`: Backend API URL (default: https://api.ile-wa.com/eld/api)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
