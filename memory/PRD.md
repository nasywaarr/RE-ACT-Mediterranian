# DisasterWatch Italy - Product Requirements Document

## Original Problem Statement
Build an Italy-focused disaster risk management and prediction platform covering:
- Seismic risk monitoring (15,000+ earthquakes/year)
- Hydrological/flood risk (95% Mediterranean coastline)
- Heat wave alerts (2022, 2025 Italy heat events)
- Leader system for immediate alerts
- Hospital locator with bed/equipment availability (privacy-focused)
- Prediction accuracy validation against historical data

## User Personas
1. **Italian Citizens** - Need real-time alerts and evacuation guidance
2. **Emergency Responders** - Require comprehensive monitoring dashboards
3. **Hospital Administrators** - Manage bed/equipment availability
4. **Government Officials** - Need aggregated risk overview

## Core Requirements (Static)
- Real-time disaster monitoring (seismic, flood, heat)
- 24-48 hour predictive capabilities
- Hospital bed availability tracking (privacy-compliant)
- Interactive map-based interface
- Safe zone/evacuation point locator
- Admin panel for hospital data management

## Technical Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + MongoDB
- **Maps**: Leaflet with CartoDB Dark tiles
- **AI**: GPT-5.2 via emergentintegrations for predictions
- **APIs**: USGS (earthquakes), OpenWeatherMap (weather)

## What's Been Implemented (Jan 13, 2026)

### Backend (FastAPI)
- `/api/dashboard/summary` - Comprehensive status overview
- `/api/seismic/events` - Real USGS earthquake data for Italy
- `/api/seismic/stats` - Seismic statistics
- `/api/flood/alerts` - Flood alert system
- `/api/flood/stats` - Flood statistics
- `/api/heatwave/alerts` - Heat wave monitoring
- `/api/heatwave/stats` - Heat statistics
- `/api/hospitals` - Full hospital CRUD
- `/api/hospitals/stats` - Aggregate hospital stats
- `/api/hospitals/nearby` - Proximity-based hospital search
- `/api/safezones` - Evacuation/safe zone data
- `/api/predictions/generate` - AI-powered predictions

### Frontend (React)
- Dashboard with Italy map and real-time alerts
- Seismic Activity Monitor with earthquake map
- Flood Risk Monitor with safe zones
- Heat Wave Monitor with hospital integration
- Hospital Locator with search/filter
- Admin Panel for hospital management
- Responsive navigation with status indicator

### Design Theme
- Tactical Command Center (Dark Mode)
- Color coding: Red (seismic), Blue (flood), Orange (heat), Green (safe)
- Glassmorphism cards with blur effects
- Bento grid layouts

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Core dashboard with map
- [x] Seismic event monitoring
- [x] Flood alert system
- [x] Heat wave monitoring
- [x] Hospital locator
- [x] Admin panel

### P1 (High Priority) - Next Phase
- [ ] User authentication for admin panel
- [ ] Push notifications for critical alerts
- [ ] Historical data comparison view
- [ ] Prediction accuracy tracking
- [ ] Mobile PWA optimization

### P2 (Medium Priority)
- [ ] Multi-language support (Italian/English)
- [ ] Offline mode for emergencies
- [ ] Integration with Italian Civil Protection APIs
- [ ] SMS/Email alert subscriptions
- [ ] Detailed evacuation route planning

### P3 (Nice to Have)
- [ ] Voice alerts
- [ ] AR-based safe zone finder
- [ ] Community reporting system
- [ ] Weather radar integration

## Next Tasks List
1. Add user authentication (JWT or Google Auth)
2. Implement push notifications
3. Add historical data charts for prediction accuracy
4. Mobile-responsive improvements
5. Italian Civil Protection API integration
