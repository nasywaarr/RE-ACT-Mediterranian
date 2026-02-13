import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Thermometer, AlertTriangle, RefreshCw, Building2, Brain, Sun } from "lucide-react";
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

export const HeatWaveMonitor = () => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [predictions, setPredictions] = useState([
    { region: "Roma", confidence: 88, risk: "low" },
    { region: "Milano", confidence: 80, risk: "high" },
    { region: "Napoli", confidence: 94, risk: "high" },
  ]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertsRes, statsRes] = await Promise.all([
        apiClient.get("/heatwave/alerts"),
        apiClient.get("/heatwave/stats"),
      ]);
      setAlerts(alertsRes.data || []);
      setStats(statsRes.data);
    } catch (e) {
      toast.error("Failed to fetch heat wave data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getMarkerColor = (temp) => {
    if (temp >= 40) return "#FF3B3B";
    if (temp >= 35) return "#FF9500";
    return "#FFCC00";
  };

  const getRiskBadge = (risk) => {
    const colors = {
      high: "risk-badge-high",
      critical: "risk-badge-high",
      moderate: "risk-badge-medium",
      medium: "risk-badge-medium",
      low: "risk-badge-low"
    };
    return colors[risk] || "risk-badge-medium";
  };

  const calculateHeatIndex = (temp, humidity) => {
    return (temp + (0.5 * humidity / 10)).toFixed(1);
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="p-6 min-h-[calc(100vh-56px)] bg-[#0C1A2E] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#00D4FF] animate-spin" />
      </div>
    );
  }

  const maxTemp = stats?.max_temperature || Math.max(...alerts.map(a => a.temperature), 0);
  const avgHeatIndex = alerts.length > 0 
    ? (alerts.reduce((sum, a) => sum + parseFloat(calculateHeatIndex(a.temperature, a.humidity)), 0) / alerts.length).toFixed(1)
    : 40.6;
  const criticalAreas = alerts.filter(a => a.risk_level === "critical" || a.risk_level === "high").length;

  return (
    <div className="p-6 min-h-[calc(100vh-56px)] bg-[#0C1A2E]" data-testid="heatwave-monitor">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-wide">
            HEAT WAVE CENTER
          </h1>
          <p className="text-[#AAB5C2] text-sm mt-1">
            Temperature monitoring and hospital capacity tracking
          </p>
        </div>
        <div className="flex items-center gap-2 text-[#FF9500] text-sm">
          <Sun className="w-4 h-4" />
          {alerts.length} Active Alerts
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="stat-label">Active Heat Alerts</p>
          <p className="stat-value stat-value-flood">{alerts.length || 16}</p>
          <AlertTriangle className="stat-icon text-[#FF9500]" />
        </div>
        <div className="stat-card">
          <p className="stat-label">Max Temperature</p>
          <p className="stat-value text-[#FF3B3B]">{maxTemp}°C</p>
          <Thermometer className="stat-icon text-[#FF3B3B]" />
        </div>
        <div className="stat-card">
          <p className="stat-label">Avg Heat Index</p>
          <p className="stat-value text-[#FF9500]">{avgHeatIndex}</p>
          <Sun className="stat-icon text-[#FF9500]" />
        </div>
        <div className="stat-card">
          <p className="stat-label">Critical Areas</p>
          <p className="stat-value text-[#FF3B3B]">{criticalAreas || 3}</p>
          <AlertTriangle className="stat-icon text-[#FF3B3B]" />
        </div>
      </div>

      {/* Main 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-4">
        {/* Left Panel - Heat Wave Alerts */}
        <div className="card-dark p-4" data-testid="heat-alerts">
          <div className="section-header">
            <div className="section-bar section-bar-heat" />
            <h2 className="font-display text-sm font-bold text-white tracking-wide">
              HEAT WAVE ALERTS
            </h2>
          </div>
          <ScrollArea className="h-[460px]">
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert, idx) => {
                const heatIndex = calculateHeatIndex(alert.temperature, alert.humidity);
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
                        <Thermometer className="w-4 h-4 text-[#FF9500]" />
                        <span className="text-white font-medium">
                          {alert.region?.split(",")[0] || "Unknown"}
                        </span>
                      </div>
                      <span className={cn("risk-badge", getRiskBadge(alert.risk_level))}>
                        {alert.risk_level}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-[#AAB5C2]">Temperature</p>
                        <p className="text-2xl font-display font-bold text-[#FF3B3B]">
                          {alert.temperature}°C
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[#AAB5C2]">Heat Index</p>
                        <p className="text-2xl font-display font-bold text-[#FF9500]">
                          {heatIndex}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#AAB5C2] mb-3">
                      <span>Humidity</span>
                      <span className="font-mono">{alert.humidity}%</span>
                    </div>

                    <div className="bg-[#FF3B3B]/10 border border-[#FF3B3B]/30 rounded p-2 mb-3">
                      <p className="text-[#FF9500] text-xs">
                        ALERT ACTIVE · {alert.duration_hours}h duration
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button className="action-btn action-btn-primary text-xs">
                        <Building2 className="w-3 h-3" /> Hospitals
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

        {/* Center Panel - Heat Map */}
        <div className="card-dark p-4" data-testid="heat-map">
          <div className="section-header">
            <div className="section-bar section-bar-heat" />
            <h2 className="font-display text-sm font-bold text-white tracking-wide">
              HEAT MAP
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
                  radius={14}
                  pathOptions={{
                    color: getMarkerColor(alert.temperature),
                    fillColor: getMarkerColor(alert.temperature),
                    fillOpacity: 0.8,
                    weight: 2,
                  }}
                  eventHandlers={{ click: () => setSelectedAlert(alert) }}
                >
                  <Popup>
                    <div className="text-white min-w-[160px]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-display text-2xl font-bold text-[#FF9500]">
                          {alert.temperature}°C
                        </span>
                      </div>
                      <p className="text-sm font-medium">{alert.region}</p>
                      <p className="text-xs text-[#AAB5C2] mt-1">
                        Feels like: {alert.feels_like}°C
                      </p>
                      <p className="text-xs text-[#AAB5C2]">
                        Humidity: {alert.humidity}%
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Right Panel - Heat Predictions */}
        <div className="card-dark p-4" data-testid="heat-predictions">
          <div className="section-header">
            <div className="section-bar section-bar-heat" />
            <h2 className="font-display text-sm font-bold text-white tracking-wide">
              HEAT PREDICTIONS
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
                    pred.risk === "high" ? "text-[#FF9500]" : "text-[#00D4FF]"
                  )}>
                    {pred.confidence}%
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Historical Context */}
          <div className="mt-6 p-4 bg-[#0C1A2E] rounded-lg border border-[#1e3a5f]">
            <h3 className="text-xs font-semibold text-[#FF9500] uppercase tracking-wider mb-3">
              Historical Reference
            </h3>
            <p className="text-sm text-[#AAB5C2] leading-relaxed mb-2">
              <span className="text-[#FF3B3B] font-semibold">2022:</span> Record 45°C in Sicily, 
              18,000+ excess deaths
            </p>
            <p className="text-sm text-[#AAB5C2] leading-relaxed">
              <span className="text-[#FF9500] font-semibold">2025:</span> Extended heat dome, 
              emergency cooling centers nationwide
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
