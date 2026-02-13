import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Activity, Droplets, Thermometer, Building2, AlertTriangle, RefreshCw, Clock, MapPin } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { apiClient } from "@/App";

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const ITALY_CENTER = [42.5, 12.5];

const MapController = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds);
  }, [map, bounds]);
  return null;
};

export const Dashboard = ({ data, loading, error, onRefresh }) => {
  const [seismicEvents, setSeismicEvents] = useState([]);
  const [floodAlerts, setFloodAlerts] = useState([]);
  const [heatAlerts, setHeatAlerts] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const fetchMapData = async () => {
      setMapLoading(true);
      try {
        const [seismicRes, floodRes, heatRes] = await Promise.all([
          apiClient.get("/seismic/events?min_magnitude=2.5&days=7"),
          apiClient.get("/flood/alerts"),
          apiClient.get("/heatwave/alerts"),
        ]);
        setSeismicEvents(seismicRes.data || []);
        setFloodAlerts(floodRes.data || []);
        setHeatAlerts(heatRes.data || []);
        setLastUpdate(new Date());
      } catch (e) {
        console.error("Error fetching map data:", e);
      } finally {
        setMapLoading(false);
      }
    };
    fetchMapData();
  }, []);

  // Recent seismic for left panel
  const recentSeismic = useMemo(() => {
    return seismicEvents.slice(0, 5).map(e => ({
      magnitude: e.magnitude,
      risk: e.risk_level,
      location: e.location?.split(",")[0] || "Unknown",
      time: new Date(e.timestamp).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
      depth: `${e.depth}km depth`
    }));
  }, [seismicEvents]);

  // Active alerts for right panel
  const activeAlerts = useMemo(() => {
    const alerts = [];
    heatAlerts.forEach(a => {
      if (a.risk_level === "high" || a.risk_level === "critical") {
        alerts.push({
          type: "heat",
          title: a.region?.split(",")[0] || "Heat Alert",
          detail: `${a.temperature}°C · ${a.duration_hours}h duration`
        });
      }
    });
    floodAlerts.forEach(a => {
      if (a.risk_level === "high" || a.risk_level === "critical") {
        alerts.push({
          type: "flood",
          title: a.region?.split(" - ")[0] || "Flood Alert",
          detail: `${a.water_level}m level`
        });
      }
    });
    return alerts.slice(0, 4);
  }, [heatAlerts, floodAlerts]);

  const getMarkerColor = (type) => {
    if (type === "seismic") return "#34C759";
    if (type === "flood") return "#007AFF";
    if (type === "heat") return "#FF9500";
    return "#FFFFFF";
  };

  if (loading) {
    return (
      <div className="p-6 min-h-[calc(100vh-56px)] bg-[#0C1A2E] flex items-center justify-center" data-testid="dashboard-loading">
        <RefreshCw className="w-8 h-8 text-[#00D4FF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 min-h-[calc(100vh-56px)] bg-[#0C1A2E]" data-testid="dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-wide">
            SITUATION OVERVIEW
          </h1>
          <p className="text-[#AAB5C2] text-sm mt-1">
            Real-time disaster monitoring for the Italian peninsula
          </p>
        </div>
        <div className="flex items-center gap-2 text-[#AAB5C2] text-sm">
          <Clock className="w-4 h-4" />
          Last update: {lastUpdate.toLocaleTimeString("it-IT")}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Seismic Activity"
          value={data?.seismic?.total_events || 0}
          description="Active high-risk events"
          icon={Activity}
          color="seismic"
        />
        <StatCard
          label="Flood Warnings"
          value={data?.flood?.active_alerts || 0}
          description="Coastal areas at risk"
          icon={Droplets}
          color="flood"
        />
        <StatCard
          label="Heat Alerts"
          value={data?.heatwave?.active_alerts || 0}
          description="Active heat warnings"
          icon={Thermometer}
          color="heat"
        />
        <StatCard
          label="Hospital Capacity"
          value={data?.hospitals?.available_beds || 0}
          description={`${data?.hospitals?.available_icu || 0} ICU available`}
          icon={Building2}
          color="hospital"
        />
      </div>

      {/* Main 3-Column Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-4">
        {/* Left Panel - Recent Seismic Activity */}
        <div className="card-dark p-4" data-testid="recent-seismic">
          <div className="section-header">
            <div className="section-bar section-bar-seismic" />
            <h2 className="font-display text-sm font-bold text-white tracking-wide">
              RECENT SEISMIC ACTIVITY
            </h2>
          </div>
          <ScrollArea className="h-[480px]">
            <div className="space-y-3">
              {recentSeismic.map((event, idx) => (
                <div key={idx} className="event-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "event-magnitude",
                        event.risk === "high" || event.risk === "critical" ? "text-[#FF3B3B]" : "text-[#FF9500]"
                      )}>
                        {event.magnitude}
                      </span>
                      <span className={cn(
                        "risk-badge",
                        event.risk === "high" || event.risk === "critical" ? "risk-badge-high" : "risk-badge-medium"
                      )}>
                        {event.risk}
                      </span>
                    </div>
                    <span className="text-xs text-[#AAB5C2] font-mono">{event.depth}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#AAB5C2] text-sm mb-1">
                    <MapPin className="w-3 h-3" />
                    {event.location}
                  </div>
                  <div className="flex items-center gap-1 text-[#6B7A8A] text-xs">
                    <Clock className="w-3 h-3" />
                    {event.time}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button className="action-btn action-btn-primary text-xs">
                      <MapPin className="w-3 h-3" /> Safe Zones
                    </button>
                    <button className="action-btn action-btn-secondary text-xs">
                      <Activity className="w-3 h-3" /> Analyze
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center Panel - Italy Risk Map */}
        <div className="card-dark p-4" data-testid="italy-map">
          <div className="flex items-center justify-between mb-4">
            <div className="section-header mb-0">
              <div className="section-bar section-bar-seismic" />
              <h2 className="font-display text-sm font-bold text-white tracking-wide">
                ITALY RISK MAP
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full bg-[#34C759]" />
                <span className="text-[#AAB5C2]">Seismic</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full bg-[#007AFF]" />
                <span className="text-[#AAB5C2]">Flood</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full bg-[#FF9500]" />
                <span className="text-[#AAB5C2]">Heat</span>
              </div>
            </div>
          </div>
          
          <div className="h-[460px] rounded-lg overflow-hidden border border-[#1e3a5f]">
            {mapLoading ? (
              <div className="h-full flex items-center justify-center bg-[#0C1A2E]">
                <RefreshCw className="w-8 h-8 animate-spin text-[#00D4FF]" />
              </div>
            ) : (
              <MapContainer
                center={ITALY_CENTER}
                zoom={6}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OpenStreetMap'
                />
                
                {/* Seismic markers */}
                {seismicEvents.map((event) => (
                  <CircleMarker
                    key={`seismic-${event.id}`}
                    center={[event.latitude, event.longitude]}
                    radius={Math.max(8, event.magnitude * 3)}
                    pathOptions={{
                      color: getMarkerColor("seismic"),
                      fillColor: getMarkerColor("seismic"),
                      fillOpacity: 0.8,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="text-white">
                        <strong className="text-[#34C759]">M{event.magnitude}</strong>
                        <p className="text-sm">{event.location}</p>
                        <p className="text-xs text-[#AAB5C2]">Depth: {event.depth}km</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
                
                {/* Flood markers */}
                {floodAlerts.map((alert) => (
                  <CircleMarker
                    key={`flood-${alert.id}`}
                    center={[alert.latitude, alert.longitude]}
                    radius={12}
                    pathOptions={{
                      color: getMarkerColor("flood"),
                      fillColor: getMarkerColor("flood"),
                      fillOpacity: 0.8,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="text-white">
                        <strong className="text-[#007AFF]">Flood Alert</strong>
                        <p className="text-sm">{alert.region}</p>
                        <p className="text-xs text-[#AAB5C2]">Water: {alert.water_level}m</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
                
                {/* Heat markers */}
                {heatAlerts.map((alert) => (
                  <CircleMarker
                    key={`heat-${alert.id}`}
                    center={[alert.latitude, alert.longitude]}
                    radius={10}
                    pathOptions={{
                      color: getMarkerColor("heat"),
                      fillColor: getMarkerColor("heat"),
                      fillOpacity: 0.8,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="text-white">
                        <strong className="text-[#FF9500]">{alert.temperature}°C</strong>
                        <p className="text-sm">{alert.region}</p>
                        <p className="text-xs text-[#AAB5C2]">Feels: {alert.feels_like}°C</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            )}
          </div>
        </div>

        {/* Right Panel - Active Alerts & Statistics */}
        <div className="space-y-4">
          {/* Active Alerts */}
          <div className="card-dark p-4" data-testid="active-alerts">
            <div className="section-header">
              <div className="section-bar section-bar-heat" />
              <h2 className="font-display text-sm font-bold text-white tracking-wide">
                ACTIVE ALERTS
              </h2>
            </div>
            <div className="space-y-2">
              {activeAlerts.length === 0 ? (
                <p className="text-[#AAB5C2] text-sm text-center py-4">No critical alerts</p>
              ) : (
                activeAlerts.map((alert, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "alert-item",
                      alert.type === "heat" && "alert-item-heat",
                      alert.type === "flood" && "alert-item-flood",
                      alert.type === "seismic" && "alert-item-seismic"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className={cn(
                        "w-4 h-4",
                        alert.type === "heat" && "text-[#FF9500]",
                        alert.type === "flood" && "text-[#007AFF]",
                        alert.type === "seismic" && "text-[#34C759]"
                      )} />
                      <span className={cn(
                        "text-xs font-semibold uppercase",
                        alert.type === "heat" && "text-[#FF9500]",
                        alert.type === "flood" && "text-[#007AFF]",
                        alert.type === "seismic" && "text-[#34C759]"
                      )}>
                        {alert.type} wave
                      </span>
                    </div>
                    <p className="text-white text-sm font-medium">{alert.title}</p>
                    <p className="text-[#AAB5C2] text-xs">{alert.detail}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 2025 Statistics */}
          <div className="card-dark p-4" data-testid="statistics">
            <div className="section-header">
              <div className="section-bar section-bar-flood" />
              <h2 className="font-display text-sm font-bold text-white tracking-wide">
                2025 STATISTICS
              </h2>
            </div>
            <div className="stats-table">
              <div className="stats-table-row">
                <span className="stats-table-label">Seismic Events</span>
                <span className="stats-table-value text-[#00D4FF]">
                  {((data?.seismic?.annual_estimate || 0)).toLocaleString()}
                </span>
              </div>
              <div className="stats-table-row">
                <span className="stats-table-label">Flood Incidents</span>
                <span className="stats-table-value text-[#00D4FF]">114</span>
              </div>
              <div className="stats-table-row">
                <span className="stats-table-label">Heat Wave Days</span>
                <span className="stats-table-value text-[#FF9500]">68</span>
              </div>
              <div className="stats-table-row">
                <span className="stats-table-label">Prediction Accuracy</span>
                <span className="stats-table-value text-[#20E3B2]">87.3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ label, value, description, icon: Icon, color }) => {
  const colorClasses = {
    seismic: "stat-value-seismic",
    flood: "stat-value-flood",
    heat: "stat-value-heat",
    hospital: "stat-value-hospital",
  };

  const iconColors = {
    seismic: "text-[#34C759]",
    flood: "text-[#007AFF]",
    heat: "text-[#FF9500]",
    hospital: "text-[#20E3B2]",
  };

  return (
    <div className="stat-card" data-testid={`stat-${color}`}>
      <p className="stat-label">{label}</p>
      <p className={cn("stat-value", colorClasses[color])}>{value}</p>
      <p className="stat-description">{description}</p>
      <Icon className={cn("stat-icon", iconColors[color])} />
    </div>
  );
};
