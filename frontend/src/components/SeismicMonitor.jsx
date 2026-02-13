import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Activity, AlertTriangle, RefreshCw, MapPin, Clock, Shield, Brain } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { apiClient } from "@/App";
import { toast } from "sonner";

const ITALY_CENTER = [42.5, 12.5];

const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
};

export const SeismicMonitor = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [predictions, setPredictions] = useState([
    { region: "Roma", confidence: 70, risk: "low" },
    { region: "Milano", confidence: 75, risk: "low" },
    { region: "Napoli", confidence: 83, risk: "low" },
    { region: "Torino", confidence: 70, risk: "medium" },
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, statsRes] = await Promise.all([
        apiClient.get("/seismic/events?min_magnitude=2.5&days=7"),
        apiClient.get("/seismic/stats"),
      ]);
      setEvents(eventsRes.data || []);
      setStats(statsRes.data);
    } catch (e) {
      toast.error("Failed to fetch seismic data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getMarkerSize = (magnitude) => Math.max(10, magnitude * 4);
  
  const getMarkerColor = (riskLevel) => {
    switch (riskLevel) {
      case "critical": return "#FF3B3B";
      case "high": return "#FF3B3B";
      case "moderate": return "#FF9500";
      default: return "#34C759";
    }
  };

  const getRiskBadge = (risk) => {
    const colors = {
      high: "risk-badge-high",
      critical: "risk-badge-high",
      moderate: "risk-badge-medium",
      medium: "risk-badge-medium",
      low: "risk-badge-low"
    };
    return colors[risk] || "risk-badge-low";
  };

  const highRiskEvents = events.filter(e => e.risk_level === "high" || e.risk_level === "critical").length;

  if (loading && events.length === 0) {
    return (
      <div className="p-6 min-h-[calc(100vh-56px)] bg-[#0C1A2E] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#00D4FF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 min-h-[calc(100vh-56px)] bg-[#0C1A2E]" data-testid="seismic-monitor">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-wide">
            SEISMIC MONITOR
          </h1>
          <p className="text-[#AAB5C2] text-sm mt-1">
            Real-time earthquake tracking and prediction for Italy
          </p>
        </div>
        <div className="flex items-center gap-2 text-[#20E3B2] text-sm">
          <span className="w-2 h-2 rounded-full bg-[#20E3B2] animate-pulse" />
          Monitoring {events.length} events
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="stat-label">Total Events (72H)</p>
          <p className="stat-value stat-value-seismic">{stats?.total_events || events.length}</p>
          <Activity className="stat-icon text-[#34C759]" />
        </div>
        <div className="stat-card">
          <p className="stat-label">High Risk Events</p>
          <p className="stat-value text-[#FF3B3B]">{highRiskEvents}</p>
          <AlertTriangle className="stat-icon text-[#FF3B3B]" />
        </div>
        <div className="stat-card">
          <p className="stat-label">Avg Magnitude</p>
          <p className="stat-value text-[#FF9500]">{stats?.avg_magnitude || 3.9}</p>
          <Activity className="stat-icon text-[#FF9500]" />
        </div>
        <div className="stat-card">
          <p className="stat-label">Max Magnitude</p>
          <p className="stat-value text-[#FF3B3B]">{stats?.max_magnitude || 6.1}</p>
          <Activity className="stat-icon text-[#FF3B3B]" />
        </div>
      </div>

      {/* Main 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-4">
        {/* Left Panel - Recent Events */}
        <div className="card-dark p-4" data-testid="recent-events">
          <div className="section-header">
            <div className="section-bar section-bar-seismic" />
            <h2 className="font-display text-sm font-bold text-white tracking-wide">
              RECENT EVENTS
            </h2>
          </div>
          <ScrollArea className="h-[460px]">
            <div className="space-y-3">
              {events.slice(0, 8).map((event, idx) => (
                <div 
                  key={event.id || idx} 
                  className={cn(
                    "event-card cursor-pointer",
                    selectedEvent?.id === event.id && "border-[#00D4FF]"
                  )}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "event-magnitude",
                        event.risk_level === "high" || event.risk_level === "critical" 
                          ? "text-[#FF3B3B]" 
                          : event.risk_level === "moderate" ? "text-[#FF9500]" : "text-white"
                      )}>
                        {event.magnitude}
                      </span>
                      <span className={cn("risk-badge", getRiskBadge(event.risk_level))}>
                        {event.risk_level}
                      </span>
                    </div>
                    <span className="text-xs text-[#AAB5C2] font-mono">{event.depth}km</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#AAB5C2] text-sm mb-1">
                    <MapPin className="w-3 h-3" />
                    {event.location?.split(",")[0] || "Unknown"}
                  </div>
                  <div className="flex items-center gap-1 text-[#6B7A8A] text-xs mb-3">
                    <Clock className="w-3 h-3" />
                    {new Date(event.timestamp).toLocaleString("it-IT", { 
                      day: "2-digit", month: "2-digit", year: "numeric", 
                      hour: "2-digit", minute: "2-digit" 
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="action-btn action-btn-primary text-xs">
                      <Shield className="w-3 h-3" /> Safe Zones
                    </button>
                    <button className="action-btn action-btn-secondary text-xs">
                      <Brain className="w-3 h-3" /> Analyze
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center Panel - Epicenter Map */}
        <div className="card-dark p-4" data-testid="epicenter-map">
          <div className="section-header">
            <div className="section-bar section-bar-seismic" />
            <h2 className="font-display text-sm font-bold text-white tracking-wide">
              EPICENTER MAP
            </h2>
          </div>
          <div className="h-[460px] rounded-lg overflow-hidden border border-[#1e3a5f]">
            <MapContainer
              center={selectedEvent ? [selectedEvent.latitude, selectedEvent.longitude] : ITALY_CENTER}
              zoom={selectedEvent ? 8 : 6}
              style={{ height: "100%", width: "100%" }}
            >
              <MapController 
                center={selectedEvent ? [selectedEvent.latitude, selectedEvent.longitude] : ITALY_CENTER}
                zoom={selectedEvent ? 8 : 6}
              />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap'
              />
              {events.map((event) => (
                <CircleMarker
                  key={event.id}
                  center={[event.latitude, event.longitude]}
                  radius={getMarkerSize(event.magnitude)}
                  pathOptions={{
                    color: getMarkerColor(event.risk_level),
                    fillColor: getMarkerColor(event.risk_level),
                    fillOpacity: 0.7,
                    weight: 2,
                  }}
                  eventHandlers={{ click: () => setSelectedEvent(event) }}
                >
                  <Popup>
                    <div className="text-white min-w-[160px]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-display text-2xl font-bold" style={{ color: getMarkerColor(event.risk_level) }}>
                          {event.magnitude}
                        </span>
                        <span className={cn("risk-badge", getRiskBadge(event.risk_level))}>
                          {event.risk_level}
                        </span>
                      </div>
                      <p className="text-sm">{event.location}</p>
                      <p className="text-xs text-[#AAB5C2] mt-1">Depth: {event.depth}km</p>
                      <p className="text-xs text-[#AAB5C2]">
                        {new Date(event.timestamp).toLocaleString("it-IT")}
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Right Panel - 24-48H Predictions */}
        <div className="card-dark p-4" data-testid="predictions">
          <div className="section-header">
            <div className="section-bar section-bar-seismic" />
            <h2 className="font-display text-sm font-bold text-white tracking-wide">
              24-48H PREDICTIONS
            </h2>
          </div>
          <div className="space-y-0">
            {predictions.map((pred, idx) => (
              <div key={idx} className="prediction-item">
                <div>
                  <p className="text-white text-sm font-medium font-mono">{pred.region}</p>
                  <p className="text-[#AAB5C2] text-xs">Confidence</p>
                </div>
                <div className="text-right">
                  <span className={cn("risk-badge", getRiskBadge(pred.risk))}>
                    {pred.risk}
                  </span>
                  <p className={cn(
                    "text-sm font-mono mt-1",
                    pred.risk === "low" ? "text-[#34C759]" : 
                    pred.risk === "medium" ? "text-[#FF9500]" : "text-[#FF3B3B]"
                  )}>
                    {pred.confidence}%
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-[#0C1A2E] rounded-lg border border-[#1e3a5f]">
            <h3 className="text-xs font-semibold text-[#AAB5C2] uppercase tracking-wider mb-3">
              AI Analysis Summary
            </h3>
            <p className="text-sm text-[#AAB5C2] leading-relaxed">
              Based on current seismic patterns and historical data, the central Italian region 
              shows elevated activity. Continue monitoring Emilia-Romagna and Calabria zones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
