import { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { Activity, AlertTriangle, RefreshCw, TrendingUp, MapPin, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { apiClient } from "@/App";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

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
  const [minMagnitude, setMinMagnitude] = useState("2.5");
  const [days, setDays] = useState("7");
  const [generatingPrediction, setGeneratingPrediction] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [safeZones, setSafeZones] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, statsRes, safeRes] = await Promise.all([
        apiClient.get(`/seismic/events?min_magnitude=${minMagnitude}&days=${days}`),
        apiClient.get("/seismic/stats"),
        apiClient.get("/safezones?zone_type=earthquake_shelter"),
      ]);
      setEvents(eventsRes.data || []);
      setStats(statsRes.data);
      setSafeZones(safeRes.data || []);
    } catch (e) {
      toast.error("Failed to fetch seismic data");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [minMagnitude, days]);

  const generatePrediction = async () => {
    setGeneratingPrediction(true);
    try {
      const response = await apiClient.post("/predictions/generate", null, {
        params: { disaster_type: "seismic", region: "Central Italy" }
      });
      setPrediction(response.data);
      toast.success("Prediction generated");
    } catch (e) {
      toast.error("Failed to generate prediction");
    } finally {
      setGeneratingPrediction(false);
    }
  };

  const getMarkerSize = (magnitude) => Math.max(6, magnitude * 3);
  
  const getMarkerColor = (riskLevel) => {
    switch (riskLevel) {
      case "critical": return "#DC2626";
      case "high": return "#EF4444";
      case "moderate": return "#FBBF24";
      default: return "#22C55E";
    }
  };

  // Prepare chart data
  const chartData = events.reduce((acc, event) => {
    const date = new Date(event.timestamp).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.count++;
      existing.maxMag = Math.max(existing.maxMag, event.magnitude);
    } else {
      acc.push({ date, count: 1, maxMag: event.magnitude });
    }
    return acc;
  }, []).slice(-14);

  if (loading && events.length === 0) {
    return (
      <div className="p-4 md:p-6 grid-bg min-h-[calc(100vh-64px)]" data-testid="seismic-loading">
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
    <div className="p-4 md:p-6 grid-bg min-h-[calc(100vh-64px)]" data-testid="seismic-monitor">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold font-['Chivo'] flex items-center gap-3">
            <Activity className="w-8 h-8 text-red-500" />
            Seismic Activity Monitor
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time earthquake tracking for Italy region
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={minMagnitude} onValueChange={setMinMagnitude}>
            <SelectTrigger className="w-32 bg-secondary/50" data-testid="magnitude-filter">
              <SelectValue placeholder="Min Mag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2.0">M 2.0+</SelectItem>
              <SelectItem value="2.5">M 2.5+</SelectItem>
              <SelectItem value="3.0">M 3.0+</SelectItem>
              <SelectItem value="4.0">M 4.0+</SelectItem>
            </SelectContent>
          </Select>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-32 bg-secondary/50" data-testid="days-filter">
              <SelectValue placeholder="Days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">24 Hours</SelectItem>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="14">14 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchData} data-testid="refresh-btn">
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card border-t-4 border-t-red-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Events</p>
            <p className="text-3xl font-bold font-['Chivo'] mt-1">{stats?.total_events || 0}</p>
            <p className="text-xs text-muted-foreground">last {days} days</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-t-4 border-t-orange-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Max Magnitude</p>
            <p className="text-3xl font-bold font-['Chivo'] mt-1">M{stats?.max_magnitude || 0}</p>
            <p className="text-xs text-muted-foreground">recorded</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-t-4 border-t-yellow-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Critical Events</p>
            <p className="text-3xl font-bold font-['Chivo'] mt-1">{stats?.critical_events || 0}</p>
            <p className="text-xs text-muted-foreground">M5.0+</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-t-4 border-t-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Annual Estimate</p>
            <p className="text-3xl font-bold font-['Chivo'] mt-1">{(stats?.annual_estimate || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">projected</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map */}
        <div className="lg:col-span-8 glass-card p-4" data-testid="seismic-map">
          <h2 className="text-xl font-bold font-['Chivo'] mb-4">Earthquake Map</h2>
          <div className="h-[450px] rounded-xl overflow-hidden border border-white/10">
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
                    fillOpacity: 0.6,
                    weight: 2,
                  }}
                  eventHandlers={{
                    click: () => setSelectedEvent(event),
                  }}
                >
                  <Popup>
                    <div className="text-foreground min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl font-bold text-red-400">M{event.magnitude}</span>
                        <Badge className={cn(
                          event.risk_level === "critical" && "bg-red-500",
                          event.risk_level === "high" && "bg-orange-500",
                          event.risk_level === "moderate" && "bg-yellow-500",
                          event.risk_level === "low" && "bg-green-500"
                        )}>
                          {event.risk_level}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{event.location}</p>
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Depth: {event.depth}km
                        </p>
                        <p className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(event.timestamp).toLocaleString("it-IT")}
                        </p>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
              {/* Safe zones */}
              {safeZones.map((zone) => (
                <CircleMarker
                  key={zone.id}
                  center={[zone.latitude, zone.longitude]}
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
                      <strong className="text-indigo-400">{zone.name}</strong>
                      <p className="text-xs">Capacity: {zone.capacity.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{zone.region}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Recent Events */}
          <Card className="glass-card" data-testid="recent-events">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Recent Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                {events.slice(0, 10).map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "p-3 mb-2 rounded-lg cursor-pointer border border-transparent hover:border-white/10",
                      selectedEvent?.id === event.id ? "bg-white/10" : "bg-white/5"
                    )}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-red-400">M{event.magnitude}</span>
                      <Badge variant="outline" className={cn(
                        "text-[10px]",
                        event.risk_level === "critical" && "border-red-500 text-red-400",
                        event.risk_level === "high" && "border-orange-500 text-orange-400"
                      )}>
                        {event.risk_level}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{event.location}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {new Date(event.timestamp).toLocaleString("it-IT")}
                    </p>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* AI Prediction */}
          <Card className="glass-card" data-testid="ai-prediction">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-sky-500" />
                AI Prediction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={generatePrediction} 
                disabled={generatingPrediction}
                className="w-full mb-4"
                data-testid="generate-prediction-btn"
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
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Recommendations:</p>
                      <ul className="text-xs space-y-1">
                        {prediction.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-sky-500">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Chart */}
      <Card className="glass-card mt-4" data-testid="activity-chart">
        <CardHeader>
          <CardTitle className="text-lg">Seismic Activity Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#F8FAFC"
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#EF4444"
                  fill="rgba(239,68,68,0.3)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
