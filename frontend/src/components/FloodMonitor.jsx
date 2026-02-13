import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Waves, AlertTriangle, RefreshCw, TrendingUp, MapPin, Clock, ArrowRight, Users, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { apiClient } from "@/App";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
  const [safeZones, setSafeZones] = useState([]);
  const [generatingPrediction, setGeneratingPrediction] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertsRes, statsRes, safeRes] = await Promise.all([
        apiClient.get("/flood/alerts"),
        apiClient.get("/flood/stats"),
        apiClient.get("/safezones?zone_type=flood_high_ground"),
      ]);
      setAlerts(alertsRes.data || []);
      setStats(statsRes.data);
      setSafeZones(safeRes.data || []);
    } catch (e) {
      toast.error("Failed to fetch flood data");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  const generatePrediction = async () => {
    setGeneratingPrediction(true);
    try {
      const response = await apiClient.post("/predictions/generate", null, {
        params: { disaster_type: "flood", region: "Po Valley" }
      });
      setPrediction(response.data);
      toast.success("Flood prediction generated");
    } catch (e) {
      toast.error("Failed to generate prediction");
    } finally {
      setGeneratingPrediction(false);
    }
  };

  const getMarkerColor = (riskLevel) => {
    switch (riskLevel) {
      case "critical": return "#0369A1";
      case "high": return "#0EA5E9";
      case "moderate": return "#38BDF8";
      default: return "#7DD3FC";
    }
  };

  const getMarkerSize = (riskLevel) => {
    switch (riskLevel) {
      case "critical": return 18;
      case "high": return 14;
      case "moderate": return 10;
      default: return 8;
    }
  };

  // Prepare chart data
  const chartData = alerts.map(alert => ({
    name: alert.region.split(" - ")[0].slice(0, 10),
    level: alert.water_level || 0,
    risk: alert.risk_level === "critical" ? 4 : alert.risk_level === "high" ? 3 : alert.risk_level === "moderate" ? 2 : 1
  }));

  if (loading && alerts.length === 0) {
    return (
      <div className="p-4 md:p-6 grid-bg min-h-[calc(100vh-64px)]" data-testid="flood-loading">
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
    <div className="p-4 md:p-6 grid-bg min-h-[calc(100vh-64px)]" data-testid="flood-monitor">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold font-['Chivo'] flex items-center gap-3">
            <Waves className="w-8 h-8 text-sky-500" />
            Flood Risk Monitor
          </h1>
          <p className="text-muted-foreground mt-1">
            Hydrological monitoring and flood prediction for Italy
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} data-testid="refresh-btn">
          <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card border-t-4 border-t-sky-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Alerts</p>
            <p className="text-3xl font-bold font-['Chivo'] mt-1">{stats?.active_alerts || 0}</p>
            <p className="text-xs text-muted-foreground">monitoring now</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-t-4 border-t-red-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Critical Zones</p>
            <p className="text-3xl font-bold font-['Chivo'] mt-1">{stats?.critical_zones || 0}</p>
            <p className="text-xs text-muted-foreground">immediate risk</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-t-4 border-t-orange-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Evacuations</p>
            <p className="text-3xl font-bold font-['Chivo'] mt-1">{stats?.evacuations_advised || 0}</p>
            <p className="text-xs text-muted-foreground">areas advised</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-t-4 border-t-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Regions Affected</p>
            <p className="text-3xl font-bold font-['Chivo'] mt-1">{stats?.affected_regions?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Italian regions</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map */}
        <div className="lg:col-span-8 glass-card p-4" data-testid="flood-map">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-['Chivo']">Flood Risk Map</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-sky-500/20 text-sky-400 border-sky-500/30">
                <span className="w-2 h-2 bg-sky-500 rounded-full mr-2" /> Flood Zone
              </Badge>
              <Badge variant="outline" className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2" /> High Ground
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
              {alerts.map((alert) => (
                <CircleMarker
                  key={alert.id}
                  center={[alert.latitude, alert.longitude]}
                  radius={getMarkerSize(alert.risk_level)}
                  pathOptions={{
                    color: getMarkerColor(alert.risk_level),
                    fillColor: getMarkerColor(alert.risk_level),
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
                        <Waves className="w-5 h-5 text-sky-400" />
                        <span className="font-bold text-sky-400">Flood Alert</span>
                      </div>
                      <p className="text-sm font-medium">{alert.region}</p>
                      <div className="mt-2 space-y-1 text-xs">
                        <p>River: {alert.river_name}</p>
                        <p>Water Level: {alert.water_level}m</p>
                        <Badge className={cn(
                          "mt-1",
                          alert.risk_level === "critical" && "bg-red-500",
                          alert.risk_level === "high" && "bg-orange-500",
                          alert.risk_level === "moderate" && "bg-yellow-500"
                        )}>
                          {alert.risk_level.toUpperCase()}
                        </Badge>
                      </div>
                      {alert.evacuation_advised && (
                        <div className="mt-2 p-2 bg-red-500/20 rounded text-red-400 text-xs flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Evacuation Advised
                        </div>
                      )}
                      {alert.affected_population && (
                        <p className="mt-2 text-xs flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {alert.affected_population.toLocaleString()} people affected
                        </p>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
              {/* Safe zones */}
              {safeZones.map((zone) => (
                <CircleMarker
                  key={zone.id}
                  center={[zone.latitude, zone.longitude]}
                  radius={10}
                  pathOptions={{
                    color: "#6366F1",
                    fillColor: "#6366F1",
                    fillOpacity: 0.8,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="text-foreground">
                      <div className="flex items-center gap-2 mb-1">
                        <Navigation className="w-4 h-4 text-indigo-400" />
                        <strong className="text-indigo-400">Safe Zone</strong>
                      </div>
                      <p className="text-sm">{zone.name}</p>
                      <p className="text-xs text-muted-foreground">Capacity: {zone.capacity.toLocaleString()}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Alerts */}
          <Card className="glass-card" data-testid="flood-alerts">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-sky-500" />
                Active Flood Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[180px]">
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Waves className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No active flood alerts</p>
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
                        alert.risk_level === "low" && "border-green-500 bg-green-500/10",
                        selectedAlert?.id === alert.id && "ring-1 ring-white/30"
                      )}
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{alert.region.split(" - ")[0]}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {alert.risk_level}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.river_name} • {alert.water_level}m
                      </p>
                      {alert.evacuation_advised && (
                        <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Evacuation Advised
                        </p>
                      )}
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* AI Prediction */}
          <Card className="glass-card" data-testid="flood-prediction">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-sky-500" />
                24h Flood Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={generatePrediction} 
                disabled={generatingPrediction}
                className="w-full mb-4"
                variant="outline"
                data-testid="generate-flood-prediction"
              >
                {generatingPrediction ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Generate Prediction
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
                          <span className="text-sky-500">•</span>
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

      {/* Water Level Chart */}
      <Card className="glass-card mt-4" data-testid="water-level-chart">
        <CardHeader>
          <CardTitle className="text-lg">Water Levels by Region</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#F8FAFC"
                    }}
                  />
                  <Bar dataKey="level" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No water level data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
