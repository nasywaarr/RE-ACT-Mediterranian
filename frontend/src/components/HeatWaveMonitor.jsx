import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Thermometer, AlertTriangle, RefreshCw, TrendingUp, Building2, Phone, Bed, ArrowRight, Wind } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { apiClient } from "@/App";
import { toast } from "sonner";

const ITALY_CENTER = [42.5, 12.5];

// Custom hospital icon
const hospitalIcon = L.divIcon({
  className: "custom-hospital-icon",
  html: `<div style="background: #10B981; width: 14px; height: 14px; border-radius: 4px; border: 2px solid white; box-shadow: 0 0 10px rgba(16,185,129,0.6);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

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
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [generatingPrediction, setGeneratingPrediction] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [coolingCenters, setCoolingCenters] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertsRes, statsRes, hospitalsRes, coolRes] = await Promise.all([
        apiClient.get("/heatwave/alerts"),
        apiClient.get("/heatwave/stats"),
        apiClient.get("/hospitals"),
        apiClient.get("/safezones?zone_type=cooling_center"),
      ]);
      setAlerts(alertsRes.data || []);
      setStats(statsRes.data);
      setHospitals(hospitalsRes.data || []);
      setCoolingCenters(coolRes.data || []);
    } catch (e) {
      toast.error("Failed to fetch heat wave data");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  const generatePrediction = async () => {
    setGeneratingPrediction(true);
    try {
      const response = await apiClient.post("/predictions/generate", null, {
        params: { disaster_type: "heatwave", region: "Southern Italy" }
      });
      setPrediction(response.data);
      toast.success("Heat wave prediction generated");
    } catch (e) {
      toast.error("Failed to generate prediction");
    } finally {
      setGeneratingPrediction(false);
    }
  };

  const findNearbyHospitals = async (lat, lon) => {
    try {
      const response = await apiClient.get(`/hospitals/nearby?lat=${lat}&lon=${lon}&limit=5`);
      return response.data;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const getTemperatureColor = (temp) => {
    if (temp >= 40) return "#DC2626";
    if (temp >= 35) return "#F97316";
    if (temp >= 32) return "#FBBF24";
    return "#22C55E";
  };

  const getMarkerSize = (riskLevel) => {
    switch (riskLevel) {
      case "critical": return 16;
      case "high": return 13;
      case "moderate": return 10;
      default: return 8;
    }
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="p-4 md:p-6 grid-bg min-h-[calc(100vh-64px)]" data-testid="heatwave-loading">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8">
            <Skeleton className="h-[500px] w-full rounded-xl" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 grid-bg min-h-[calc(100vh-64px)]" data-testid="heatwave-monitor">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold font-['Chivo'] flex items-center gap-3">
            <Thermometer className="w-8 h-8 text-orange-500" />
            Heat Wave Monitor
          </h1>
          <p className="text-muted-foreground mt-1">
            Heat wave alerts and hospital locator for Italy
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} data-testid="refresh-btn">
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card border-t-4 border-t-orange-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Heat Alerts</p>
            <p className="text-3xl font-bold font-['Chivo'] mt-1">{stats?.active_alerts || 0}</p>
            <p className="text-xs text-muted-foreground">cities affected</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-t-4 border-t-red-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Max Temperature</p>
            <p className="text-3xl font-bold font-['Chivo'] mt-1">{stats?.max_temperature || 0}°C</p>
            <p className="text-xs text-muted-foreground">recorded</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-t-4 border-t-yellow-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Avg Temperature</p>
            <p className="text-3xl font-bold font-['Chivo'] mt-1">{stats?.avg_temperature || 0}°C</p>
            <p className="text-xs text-muted-foreground">across alerts</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-t-4 border-t-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Critical Areas</p>
            <p className="text-3xl font-bold font-['Chivo'] mt-1">{stats?.critical_areas || 0}</p>
            <p className="text-xs text-muted-foreground">extreme heat</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map */}
        <div className="lg:col-span-8 glass-card p-4" data-testid="heatwave-map">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-['Chivo']">Heat Wave & Hospital Map</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2" /> Heat Zone
              </Badge>
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2" /> Hospital
              </Badge>
            </div>
          </div>
          <div className="h-[450px] rounded-xl overflow-hidden border border-white/10">
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
              
              {/* Heat wave markers */}
              {alerts.map((alert) => (
                <CircleMarker
                  key={alert.id}
                  center={[alert.latitude, alert.longitude]}
                  radius={getMarkerSize(alert.risk_level)}
                  pathOptions={{
                    color: getTemperatureColor(alert.temperature),
                    fillColor: getTemperatureColor(alert.temperature),
                    fillOpacity: 0.6,
                    weight: 2,
                  }}
                  eventHandlers={{
                    click: () => setSelectedAlert(alert),
                  }}
                >
                  <Popup>
                    <div className="text-foreground min-w-[220px]">
                      <div className="flex items-center gap-2 mb-2">
                        <Thermometer className="w-5 h-5 text-orange-400" />
                        <span className="text-2xl font-bold text-orange-400">{alert.temperature}°C</span>
                      </div>
                      <p className="text-sm font-medium">{alert.region}</p>
                      <div className="mt-2 space-y-1 text-xs">
                        <p className="flex items-center gap-1">
                          <Wind className="w-3 h-3" /> Feels like: {alert.feels_like}°C
                        </p>
                        <p>Humidity: {alert.humidity}%</p>
                        <p>Duration: ~{alert.duration_hours}h</p>
                      </div>
                      <Badge className={cn(
                        "mt-2",
                        alert.risk_level === "critical" && "bg-red-500",
                        alert.risk_level === "high" && "bg-orange-500",
                        alert.risk_level === "moderate" && "bg-yellow-500"
                      )}>
                        {alert.risk_level.toUpperCase()}
                      </Badge>
                      <p className="mt-2 text-xs text-muted-foreground italic">
                        {alert.advisory}
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
              
              {/* Hospital markers */}
              {hospitals.map((hospital) => (
                <Marker
                  key={hospital.id}
                  position={[hospital.latitude, hospital.longitude]}
                  icon={hospitalIcon}
                  eventHandlers={{
                    click: () => setSelectedHospital(hospital),
                  }}
                >
                  <Popup>
                    <div className="text-foreground min-w-[240px]">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-5 h-5 text-green-400" />
                        <strong className="text-green-400">{hospital.name}</strong>
                      </div>
                      <p className="text-sm">{hospital.city}, {hospital.region}</p>
                      <div className="mt-3 space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Beds Available</span>
                            <span className="font-mono">{hospital.available_beds}/{hospital.total_beds}</span>
                          </div>
                          <Progress 
                            value={(hospital.available_beds / hospital.total_beds) * 100} 
                            className="h-2"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>ICU Available</span>
                            <span className="font-mono">{hospital.icu_available}/{hospital.icu_beds}</span>
                          </div>
                          <Progress 
                            value={(hospital.icu_available / hospital.icu_beds) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <Phone className="w-3 h-3" />
                        <span className="font-mono">{hospital.contact_phone}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Cooling centers */}
              {coolingCenters.map((center) => (
                <CircleMarker
                  key={center.id}
                  center={[center.latitude, center.longitude]}
                  radius={8}
                  pathOptions={{
                    color: "#6366F1",
                    fillColor: "#6366F1",
                    fillOpacity: 0.8,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="text-foreground">
                      <strong className="text-indigo-400">{center.name}</strong>
                      <p className="text-xs">Cooling Center</p>
                      <p className="text-xs text-muted-foreground">Capacity: {center.capacity.toLocaleString()}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Heat Alerts */}
          <Card className="glass-card" data-testid="heat-alerts">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Active Heat Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[180px]">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Thermometer className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No active heat alerts</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        "p-3 mb-2 rounded-lg cursor-pointer border-l-4",
                        alert.risk_level === "critical" && "border-red-500 bg-red-500/10",
                        alert.risk_level === "high" && "border-orange-500 bg-orange-500/10",
                        alert.risk_level === "moderate" && "border-yellow-500 bg-yellow-500/10",
                        selectedAlert?.id === alert.id && "ring-1 ring-white/30"
                      )}
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold" style={{ color: getTemperatureColor(alert.temperature) }}>
                          {alert.temperature}°C
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {alert.risk_level}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.region}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Feels like {alert.feels_like}°C • {alert.humidity}% humidity
                      </p>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Nearby Hospitals */}
          <Card className="glass-card" data-testid="nearby-hospitals">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-500" />
                Hospitals with Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[180px]">
                {hospitals.filter(h => h.available_beds > 0).slice(0, 5).map((hospital) => (
                  <div
                    key={hospital.id}
                    className={cn(
                      "p-3 mb-2 rounded-lg cursor-pointer bg-green-500/5 border border-green-500/20",
                      selectedHospital?.id === hospital.id && "ring-1 ring-green-500/50"
                    )}
                    onClick={() => setSelectedHospital(hospital)}
                  >
                    <p className="font-medium text-sm text-green-400">{hospital.name}</p>
                    <p className="text-xs text-muted-foreground">{hospital.city}</p>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="flex items-center gap-1 text-xs">
                        <Bed className="w-3 h-3 text-green-400" />
                        <span>{hospital.available_beds} beds</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-red-400">ICU:</span>
                        <span>{hospital.icu_available}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* AI Prediction */}
          <Card className="glass-card" data-testid="heat-prediction">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                Heat Wave Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={generatePrediction} 
                disabled={generatingPrediction}
                className="w-full mb-4"
                variant="outline"
                data-testid="generate-heat-prediction"
              >
                {generatingPrediction ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Generate 48h Forecast
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
              
              {prediction && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      "uppercase",
                      prediction.risk_level === "critical" && "bg-red-500",
                      prediction.risk_level === "high" && "bg-orange-500",
                      prediction.risk_level === "moderate" && "bg-yellow-500",
                      prediction.risk_level === "low" && "bg-green-500"
                    )}>
                      {prediction.risk_level} Risk
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(prediction.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-sm">{prediction.prediction_text}</p>
                  {prediction.recommendations?.length > 0 && (
                    <ul className="text-xs space-y-1 mt-2">
                      {prediction.recommendations.slice(0, 3).map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-orange-500">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Historical Context */}
      <Card className="glass-card mt-4" data-testid="heat-history">
        <CardHeader>
          <CardTitle className="text-lg">Heat Wave Historical Context</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <h4 className="font-bold text-orange-400">2022 Heat Wave</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Record temperatures exceeding 45°C in Sicily. Over 18,000 excess deaths attributed to heat.
              </p>
            </div>
            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <h4 className="font-bold text-red-400">2025 Heat Event</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Extended heat dome covering Southern Italy. Emergency cooling centers activated nationwide.
              </p>
            </div>
            <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <h4 className="font-bold text-yellow-400">Annual Pattern</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Peak heat wave risk: July-August. Mediterranean climate amplifies urban heat island effects.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
