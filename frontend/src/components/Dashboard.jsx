import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import { Activity, Waves, Thermometer, Building2, AlertTriangle, RefreshCw, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { apiClient } from "@/App";

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Italy center coordinates
const ITALY_CENTER = [42.5, 12.5];
const ITALY_BOUNDS = [[35.5, 6.5], [47.5, 19]];

// Map zoom controller
const MapController = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds);
    }
  }, [map, bounds]);
  return null;
};

export const Dashboard = ({ data, loading, error, onRefresh }) => {
  const [seismicEvents, setSeismicEvents] = useState([]);
  const [floodAlerts, setFloodAlerts] = useState([]);
  const [heatAlerts, setHeatAlerts] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);

  useEffect(() => {
    const fetchMapData = async () => {
      setMapLoading(true);
      try {
        const [seismicRes, floodRes, heatRes, hospitalRes] = await Promise.all([
          apiClient.get("/seismic/events?min_magnitude=2.5&days=7"),
          apiClient.get("/flood/alerts"),
          apiClient.get("/heatwave/alerts"),
          apiClient.get("/hospitals"),
        ]);
        setSeismicEvents(seismicRes.data || []);
        setFloodAlerts(floodRes.data || []);
        setHeatAlerts(heatRes.data || []);
        setHospitals(hospitalRes.data || []);
      } catch (e) {
        console.error("Error fetching map data:", e);
      } finally {
        setMapLoading(false);
      }
    };
    fetchMapData();
  }, []);

  const allAlerts = useMemo(() => {
    const alerts = [];
    
    seismicEvents.forEach(e => {
      if (e.risk_level === "high" || e.risk_level === "critical") {
        alerts.push({
          type: "seismic",
          level: e.risk_level,
          title: `M${e.magnitude} Earthquake`,
          location: e.location,
          time: new Date(e.timestamp),
          details: `Depth: ${e.depth}km`,
        });
      }
    });
    
    floodAlerts.forEach(a => {
      if (a.risk_level === "high" || a.risk_level === "critical") {
        alerts.push({
          type: "flood",
          level: a.risk_level,
          title: "Flood Warning",
          location: a.region,
          time: new Date(a.timestamp),
          details: a.evacuation_advised ? "Evacuation Advised" : `Water Level: ${a.water_level}m`,
        });
      }
    });
    
    heatAlerts.forEach(a => {
      if (a.risk_level === "high" || a.risk_level === "critical") {
        alerts.push({
          type: "heat",
          level: a.risk_level,
          title: "Heat Wave Alert",
          location: a.region,
          time: new Date(a.timestamp),
          details: `${a.temperature}°C (Feels like ${a.feels_like}°C)`,
        });
      }
    });
    
    return alerts.sort((a, b) => {
      const levelOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
      if (levelOrder[a.level] !== levelOrder[b.level]) {
        return levelOrder[a.level] - levelOrder[b.level];
      }
      return b.time - a.time;
    });
  }, [seismicEvents, floodAlerts, heatAlerts]);

  const getMarkerColor = (type, level) => {
    if (type === "seismic") return level === "critical" ? "#DC2626" : "#EF4444";
    if (type === "flood") return level === "critical" ? "#0369A1" : "#0EA5E9";
    if (type === "heat") return level === "critical" ? "#C2410C" : "#F97316";
    return "#10B981";
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4" data-testid="dashboard-loading">
        <div className="lg:col-span-8">
          <Skeleton className="h-[500px] w-full rounded-xl" />
        </div>
        <div className="lg:col-span-4 space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[60vh]" data-testid="dashboard-error">
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={onRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 grid-bg min-h-[calc(100vh-64px)]" data-testid="dashboard">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard
          title="Seismic Events"
          value={data?.seismic?.total_events || 0}
          subtitle="Last 30 days"
          icon={Activity}
          color="seismic"
          trend={`${data?.seismic?.critical_events || 0} critical`}
        />
        <StatCard
          title="Flood Alerts"
          value={data?.flood?.active_alerts || 0}
          subtitle="Active now"
          icon={Waves}
          color="flood"
          trend={`${data?.flood?.evacuations_advised || 0} evacuations`}
        />
        <StatCard
          title="Heat Alerts"
          value={data?.heatwave?.active_alerts || 0}
          subtitle="Active now"
          icon={Thermometer}
          color="heat"
          trend={`${data?.heatwave?.max_temperature || 0}°C max`}
        />
        <StatCard
          title="Hospital Beds"
          value={data?.hospitals?.available_beds || 0}
          subtitle="Available"
          icon={Building2}
          color="safe"
          trend={`${data?.hospitals?.occupancy_rate || 0}% occupied`}
        />
      </div>

      {/* Main Content - Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map Section */}
        <div className="lg:col-span-8 glass-card p-4 relative" data-testid="dashboard-map">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-['Chivo']">Italy Risk Overview</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2" /> Seismic
              </Badge>
              <Badge variant="outline" className="bg-sky-500/20 text-sky-400 border-sky-500/30">
                <span className="w-2 h-2 bg-sky-500 rounded-full mr-2" /> Flood
              </Badge>
              <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2" /> Heat
              </Badge>
            </div>
          </div>
          
          <div className="h-[450px] rounded-xl overflow-hidden border border-white/10">
            {mapLoading ? (
              <div className="h-full flex items-center justify-center bg-secondary/20">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <MapContainer
                center={ITALY_CENTER}
                zoom={6}
                style={{ height: "100%", width: "100%" }}
                className="z-0"
              >
                <MapController bounds={ITALY_BOUNDS} />
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                
                {/* Seismic markers */}
                {seismicEvents.map((event) => (
                  <CircleMarker
                    key={`seismic-${event.id}`}
                    center={[event.latitude, event.longitude]}
                    radius={Math.max(6, event.magnitude * 2)}
                    pathOptions={{
                      color: getMarkerColor("seismic", event.risk_level),
                      fillColor: getMarkerColor("seismic", event.risk_level),
                      fillOpacity: 0.6,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="text-foreground">
                        <strong className="text-red-400">M{event.magnitude} Earthquake</strong>
                        <p className="text-sm">{event.location}</p>
                        <p className="text-xs text-muted-foreground">Depth: {event.depth}km</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString("it-IT")}
                        </p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
                
                {/* Flood markers */}
                {floodAlerts.map((alert) => (
                  <CircleMarker
                    key={`flood-${alert.id}`}
                    center={[alert.latitude, alert.longitude]}
                    radius={alert.risk_level === "critical" ? 15 : 10}
                    pathOptions={{
                      color: getMarkerColor("flood", alert.risk_level),
                      fillColor: getMarkerColor("flood", alert.risk_level),
                      fillOpacity: 0.6,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="text-foreground">
                        <strong className="text-sky-400">Flood Alert</strong>
                        <p className="text-sm">{alert.region}</p>
                        <p className="text-xs">River: {alert.river_name}</p>
                        <p className="text-xs">Level: {alert.water_level}m</p>
                        {alert.evacuation_advised && (
                          <Badge className="mt-1 bg-red-500">Evacuation Advised</Badge>
                        )}
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
                      color: getMarkerColor("heat", alert.risk_level),
                      fillColor: getMarkerColor("heat", alert.risk_level),
                      fillOpacity: 0.6,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="text-foreground">
                        <strong className="text-orange-400">Heat Wave</strong>
                        <p className="text-sm">{alert.region}</p>
                        <p className="text-xs">{alert.temperature}°C (Feels: {alert.feels_like}°C)</p>
                        <p className="text-xs">Humidity: {alert.humidity}%</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
                
                {/* Hospital markers */}
                {hospitals.map((hospital) => (
                  <Marker
                    key={`hospital-${hospital.id}`}
                    position={[hospital.latitude, hospital.longitude]}
                    icon={L.divIcon({
                      className: "custom-hospital-marker",
                      html: `<div style="background: #10B981; width: 12px; height: 12px; border-radius: 3px; border: 2px solid white; box-shadow: 0 0 8px rgba(16,185,129,0.6);"></div>`,
                      iconSize: [12, 12],
                    })}
                  >
                    <Popup>
                      <div className="text-foreground">
                        <strong className="text-green-400">{hospital.name}</strong>
                        <p className="text-sm">{hospital.city}</p>
                        <p className="text-xs">Beds: {hospital.available_beds}/{hospital.total_beds}</p>
                        <p className="text-xs">ICU: {hospital.icu_available}/{hospital.icu_beds}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
        </div>

        {/* Alert Feed */}
        <div className="lg:col-span-4 glass-card p-4" data-testid="alert-feed">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-['Chivo']">Active Alerts</h2>
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          
          <ScrollArea className="h-[450px] pr-4">
            {allAlerts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No high-priority alerts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allAlerts.map((alert, idx) => (
                  <AlertItem key={idx} alert={alert} />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Seismic Annual Estimate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-['Chivo']">
              {(data?.seismic?.annual_estimate || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              earthquakes projected this year
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" /> Emergency Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-['Chivo']">
              {data?.hospitals?.emergency_ready || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              hospitals with emergency capacity
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4" /> ICU Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-['Chivo']">
              {data?.hospitals?.available_icu || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ICU beds available ({data?.hospitals?.icu_occupancy_rate || 0}% occupied)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => {
  const colorClasses = {
    seismic: "border-t-red-500",
    flood: "border-t-sky-500",
    heat: "border-t-orange-500",
    safe: "border-t-green-500",
  };

  const iconColors = {
    seismic: "text-red-500",
    flood: "text-sky-500",
    heat: "text-orange-500",
    safe: "text-green-500",
  };

  return (
    <Card className={cn("glass-card border-t-4", colorClasses[color])} data-testid={`stat-${color}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold font-['Chivo'] mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <Icon className={cn("w-8 h-8 opacity-80", iconColors[color])} />
        </div>
        {trend && (
          <p className="text-xs mt-3 text-muted-foreground">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
};

// Alert Item Component
const AlertItem = ({ alert }) => {
  const typeColors = {
    seismic: "border-red-500 bg-red-500/10",
    flood: "border-sky-500 bg-sky-500/10",
    heat: "border-orange-500 bg-orange-500/10",
  };

  const typeIcons = {
    seismic: Activity,
    flood: Waves,
    heat: Thermometer,
  };

  const Icon = typeIcons[alert.type];

  return (
    <div className={cn(
      "border-l-4 p-3 rounded-r-lg",
      typeColors[alert.type],
      alert.level === "critical" && "alert-pulse"
    )}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{alert.title}</span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] uppercase",
                alert.level === "critical" && "bg-red-500/20 text-red-400 border-red-500/30",
                alert.level === "high" && "bg-orange-500/20 text-orange-400 border-orange-500/30"
              )}
            >
              {alert.level}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{alert.location}</p>
          <p className="text-xs text-muted-foreground">{alert.details}</p>
          <p className="text-[10px] text-muted-foreground mt-1 font-mono">
            {alert.time.toLocaleString("it-IT")}
          </p>
        </div>
      </div>
    </div>
  );
};
