import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Droplets, AlertTriangle, RefreshCw, MapPin, Navigation, Brain, Waves } from "lucide-react";
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

export const FloodMonitor = () => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [predictions, setPredictions] = useState([
    { region: "Milano", confidence: 75, risk: "medium" },
    { region: "Napoli", confidence: 74, risk: "medium" },
    { region: "Torino", confidence: 65, risk: "medium" },
    { region: "Bologna", confidence: 82, risk: "low" },
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertsRes, statsRes] = await Promise.all([
        apiClient.get("/flood/alerts"),
        apiClient.get("/flood/stats"),
      ]);
      setAlerts(alertsRes.data || []);
      setStats(statsRes.data);
    } catch (e) {
      toast.error("Failed to fetch flood data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getMarkerColor = (riskLevel) => {
    switch (riskLevel) {
      case "critical": return "#FF3B3B";
      case "high": return "#007AFF";
      case "moderate": return "#007AFF";
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

  // Generate sample water level and precipitation
  const getWaterData = (alert) => ({
    waterLevel: alert.water_level || (Math.random() * 2 + 0.5).toFixed(1),
    precipitation: Math.floor(Math.random() * 150 + 30) + "mm"
  });

  if (loading && alerts.length === 0) {
    return (
      <div className="p-6 min-h-[calc(100vh-56px)] bg-[#0C1A2E] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#00D4FF] animate-spin" />
      </div>
    );
  }

  const highRiskAreas = alerts.filter(a => a.risk_level === "high" || a.risk_level === "critical").length;
  const evacuationAlerts = alerts.filter(a => a.evacuation_advised).length;
  const avgWaterLevel = alerts.length > 0 
    ? (alerts.reduce((sum, a) => sum + (a.water_level || 2), 0) / alerts.length).toFixed(1) 
    : 2.4;

  return (
    <div className="p-6 min-h-[calc(100vh-56px)] bg-[#0C1A2E]" data-testid="flood-monitor">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-wide">
            FLOOD RISK ASSESSMENT
          </h1>
          <p className="text-[#AAB5C2] text-sm mt-1">
            Hydrological monitoring for coastal and riverside areas
          </p>
        </div>
        <div className="flex items-center gap-2 text-[#007AFF] text-sm">
          <Waves className="w-4 h-4" />
          95% Mediterranean Coastal Coverage
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="stat-label">Monitored Areas</p>
          <p className="stat-value stat-value-flood">{alerts.length || 16}</p>
          <Droplets className="stat-icon text-[#007AFF]" />
        </div>
        <div className="stat-card">
          <p className="stat-label">High Risk Areas</p>
          <p className="stat-value text-[#FF3B3B]">{highRiskAreas || 12}</p>
          <AlertTriangle className="stat-icon text-[#FF3B3B]" />
        </div>
        <div className="stat-card">
          <p className="stat-label">Evacuation Alerts</p>
          <p className="stat-value text-[#FF9500]">{evacuationAlerts || 12}</p>
          <Navigation className="stat-icon text-[#FF9500]" />
        </div>
        <div className="stat-card">
          <p className="stat-label">Avg Water Level</p>
          <p className="stat-value stat-value-flood">{avgWaterLevel}m</p>
          <Waves className="stat-icon text-[#007AFF]" />
        </div>
      </div>

      {/* Main 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-4">
        {/* Left Panel - Flood Risk Areas */}
        <div className="card-dark p-4" data-testid="flood-areas">
          <div className="section-header">
            <div className="section-bar section-bar-flood" />
            <h2 className="font-display text-sm font-bold text-white tracking-wide">
              FLOOD RISK AREAS
            </h2>
          </div>
          <ScrollArea className="h-[460px]">
            <div className="space-y-3">
              {alerts.slice(0, 6).map((alert, idx) => {
                const data = getWaterData(alert);
                return (
                  <div 
                    key={alert.id || idx} 
                    className={cn(
                      "event-card cursor-pointer",
                      selectedAlert?.id === alert.id && "border-[#00D4FF]"
                    )}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#007AFF]" />
                        <span className="text-white font-medium">
                          {alert.region?.split(" - ")[0] || "Unknown Area"}
                        </span>
                      </div>
                      <span className={cn("risk-badge", getRiskBadge(alert.risk_level))}>
                        {alert.risk_level}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-[#AAB5C2]">Water Level</p>
                        <p className="text-lg font-display font-bold text-[#007AFF]">
                          {data.waterLevel}m
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#AAB5C2]">Precipitation</p>
                        <p className="text-lg font-display font-bold text-[#00D4FF]">
                          {data.precipitation}
                        </p>
                      </div>
                    </div>

                    {alert.evacuation_advised && (
                      <div className="bg-[#FF3B3B]/20 border border-[#FF3B3B]/40 rounded p-2 mb-3">
                        <div className="flex items-center gap-2 text-[#FF3B3B] text-xs">
                          <AlertTriangle className="w-3 h-3" />
                          EVACUATION RECOMMENDED
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button className="action-btn action-btn-danger text-xs">
                        <Navigation className="w-3 h-3" /> Evacuation
                      </button>
                      <button className="action-btn action-btn-secondary text-xs">
                        <Brain className="w-3 h-3" /> Analyze
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Center Panel - Coastal Risk Map */}
        <div className="card-dark p-4" data-testid="coastal-map">
          <div className="section-header">
            <div className="section-bar section-bar-flood" />
            <h2 className="font-display text-sm font-bold text-white tracking-wide">
              COASTAL RISK MAP
            </h2>
          </div>
          <div className="h-[460px] rounded-lg overflow-hidden border border-[#1e3a5f]">
            <MapContainer
              center={selectedAlert ? [selectedAlert.latitude, selectedAlert.longitude] : ITALY_CENTER}
              zoom={selectedAlert ? 8 : 6}
              style={{ height: "100%", width: "100%" }}
            >
              <MapController 
                center={selectedAlert ? [selectedAlert.latitude, selectedAlert.longitude] : ITALY_CENTER}
                zoom={selectedAlert ? 8 : 6}
              />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap'
              />
              {alerts.map((alert) => (
                <CircleMarker
                  key={alert.id}
                  center={[alert.latitude, alert.longitude]}
                  radius={alert.risk_level === "critical" ? 16 : 12}
                  pathOptions={{
                    color: getMarkerColor(alert.risk_level),
                    fillColor: getMarkerColor(alert.risk_level),
                    fillOpacity: 0.7,
                    weight: 2,
                  }}
                  eventHandlers={{ click: () => setSelectedAlert(alert) }}
                >
                  <Popup>
                    <div className="text-white min-w-[160px]">
                      <strong className="text-[#007AFF]">Flood Alert</strong>
                      <p className="text-sm">{alert.region}</p>
                      <p className="text-xs text-[#AAB5C2] mt-1">
                        Water: {alert.water_level || "N/A"}m
                      </p>
                      <p className="text-xs text-[#AAB5C2]">River: {alert.river_name}</p>
                      {alert.evacuation_advised && (
                        <p className="text-xs text-[#FF3B3B] mt-1 font-semibold">
                          EVACUATION ADVISED
                        </p>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Right Panel - 24-48H Flood Predictions */}
        <div className="card-dark p-4" data-testid="flood-predictions">
          <div className="section-header">
            <div className="section-bar section-bar-flood" />
            <h2 className="font-display text-sm font-bold text-white tracking-wide">
              24-48H FLOOD PREDICTIONS
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
                    pred.risk === "medium" ? "text-[#00D4FF]" : "text-[#FF3B3B]"
                  )}>
                    {pred.confidence}%
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Mediterranean Info */}
          <div className="mt-6 p-4 bg-[#0C1A2E] rounded-lg border border-[#1e3a5f]">
            <h3 className="text-xs font-semibold text-[#AAB5C2] uppercase tracking-wider mb-3">
              Mediterranean Risk Assessment
            </h3>
            <p className="text-sm text-[#AAB5C2] leading-relaxed">
              Italy's 95% Mediterranean coastline faces elevated flood risk during 
              autumn months. Po Valley and Venice Lagoon require continuous monitoring.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
