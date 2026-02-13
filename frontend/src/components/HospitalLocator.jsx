import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Building2, Phone, Bed, Search, RefreshCw, MapPin, Activity, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { apiClient } from "@/App";
import { toast } from "sonner";

const ITALY_CENTER = [42.5, 12.5];

// Custom hospital icon
const hospitalIcon = L.divIcon({
  className: "custom-hospital-icon",
  html: `<div style="background: #10B981; width: 16px; height: 16px; border-radius: 4px; border: 2px solid white; box-shadow: 0 0 12px rgba(16,185,129,0.6); display: flex; align-items: center; justify-content: center;">
    <span style="color: white; font-size: 10px; font-weight: bold;">H</span>
  </div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
};

export const HospitalLocator = () => {
  const [hospitals, setHospitals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hospitalsRes, statsRes] = await Promise.all([
        apiClient.get("/hospitals"),
        apiClient.get("/hospitals/stats"),
      ]);
      setHospitals(hospitalsRes.data || []);
      setStats(statsRes.data);
    } catch (e) {
      toast.error("Failed to fetch hospital data");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const findNearMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lon: longitude });
          
          try {
            const response = await apiClient.get(`/hospitals/nearby?lat=${latitude}&lon=${longitude}&limit=5`);
            setNearbyHospitals(response.data || []);
            toast.success("Found nearby hospitals");
          } catch (e) {
            toast.error("Failed to find nearby hospitals");
          }
        },
        (error) => {
          toast.error("Location access denied. Please enable location services.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const filteredHospitals = hospitals.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         h.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = regionFilter === "all" || h.region === regionFilter;
    return matchesSearch && matchesRegion;
  });

  const regions = [...new Set(hospitals.map(h => h.region))].sort();

  const getOccupancyColor = (available, total) => {
    const ratio = available / total;
    if (ratio > 0.5) return "bg-green-500";
    if (ratio > 0.2) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading && hospitals.length === 0) {
    return (
      <div className="p-4 md:p-6 grid-bg min-h-[calc(100vh-64px)]" data-testid="hospital-loading">
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
    <div className="p-4 md:p-6 grid-bg min-h-[calc(100vh-64px)]" data-testid="hospital-locator">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold font-['Chivo'] flex items-center gap-3">
            <Building2 className="w-8 h-8 text-green-500" />
            Hospital Locator
          </h1>
          <p className="text-muted-foreground mt-1">
            Find hospitals with bed availability across Italy
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={findNearMe} data-testid="find-near-me">
            <MapPin className="w-4 h-4 mr-2" />
            Find Near Me
          </Button>
          <Button variant="outline" onClick={fetchData} data-testid="refresh-btn">
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card border-t-4 border-t-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Hospitals</p>
            <p className="text-3xl font-bold font-['Chivo'] mt-1">{stats?.total_hospitals || 0}</p>
            <p className="text-xs text-muted-foreground">in database</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-t-4 border-t-sky-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Available Beds</p>
            <p className="text-3xl font-bold font-['Chivo'] mt-1">{stats?.available_beds?.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground">of {stats?.total_beds?.toLocaleString() || 0} total</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-t-4 border-t-red-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">ICU Available</p>
            <p className="text-3xl font-bold font-['Chivo'] mt-1">{stats?.available_icu || 0}</p>
            <p className="text-xs text-muted-foreground">{stats?.icu_occupancy_rate || 0}% occupied</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-t-4 border-t-orange-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Occupancy Rate</p>
            <p className="text-3xl font-bold font-['Chivo'] mt-1">{stats?.occupancy_rate || 0}%</p>
            <p className="text-xs text-muted-foreground">overall</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map */}
        <div className="lg:col-span-8 glass-card p-4" data-testid="hospital-map">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-['Chivo']">Hospital Map</h2>
            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
              {filteredHospitals.length} hospitals
            </Badge>
          </div>
          <div className="h-[450px] rounded-xl overflow-hidden border border-white/10">
            <MapContainer
              center={selectedHospital ? [selectedHospital.latitude, selectedHospital.longitude] : ITALY_CENTER}
              zoom={selectedHospital ? 10 : 6}
              style={{ height: "100%", width: "100%" }}
            >
              <MapController 
                center={selectedHospital ? [selectedHospital.latitude, selectedHospital.longitude] : ITALY_CENTER}
                zoom={selectedHospital ? 10 : 6}
              />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap'
              />
              
              {filteredHospitals.map((hospital) => (
                <Marker
                  key={hospital.id}
                  position={[hospital.latitude, hospital.longitude]}
                  icon={hospitalIcon}
                  eventHandlers={{
                    click: () => setSelectedHospital(hospital),
                  }}
                >
                  <Popup>
                    <div className="text-foreground min-w-[280px]">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-5 h-5 text-green-400" />
                        <strong className="text-green-400 text-lg">{hospital.name}</strong>
                      </div>
                      <p className="text-sm">{hospital.address}</p>
                      <p className="text-sm text-muted-foreground">{hospital.city}, {hospital.region}</p>
                      
                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center gap-1">
                              <Bed className="w-4 h-4" /> Beds Available
                            </span>
                            <span className="font-mono font-bold">
                              {hospital.available_beds}/{hospital.total_beds}
                            </span>
                          </div>
                          <Progress 
                            value={(hospital.available_beds / hospital.total_beds) * 100} 
                            className="h-2"
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4 text-red-400" /> ICU Available
                            </span>
                            <span className="font-mono font-bold">
                              {hospital.icu_available}/{hospital.icu_beds}
                            </span>
                          </div>
                          <Progress 
                            value={(hospital.icu_available / hospital.icu_beds) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <p className="text-xs text-muted-foreground mb-2">Equipment:</p>
                        <div className="flex flex-wrap gap-1">
                          {hospital.equipment?.slice(0, 4).map((eq, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">
                              {eq}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-green-400" />
                        <a href={`tel:${hospital.contact_phone}`} className="font-mono hover:text-green-400">
                          {hospital.contact_phone}
                        </a>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* User location marker */}
              {userLocation && (
                <Marker
                  position={[userLocation.lat, userLocation.lon]}
                  icon={L.divIcon({
                    className: "user-location",
                    html: `<div style="background: #3B82F6; width: 12px; height: 12px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(59,130,246,0.8);"></div>`,
                    iconSize: [12, 12],
                    iconAnchor: [6, 6],
                  })}
                >
                  <Popup>Your Location</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Search & Filter */}
          <Card className="glass-card" data-testid="hospital-search">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search Hospitals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Search by name or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-secondary/50"
                data-testid="hospital-search-input"
              />
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="bg-secondary/50" data-testid="region-filter">
                  <SelectValue placeholder="Filter by region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Hospital List */}
          <Card className="glass-card" data-testid="hospital-list">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                {nearbyHospitals.length > 0 ? "Nearest Hospitals" : "Hospital List"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px]">
                {(nearbyHospitals.length > 0 ? nearbyHospitals : filteredHospitals).map((hospital) => (
                  <div
                    key={hospital.id}
                    className={cn(
                      "p-3 mb-2 rounded-lg cursor-pointer border border-green-500/20 bg-green-500/5",
                      "hover:bg-green-500/10 transition-colors",
                      selectedHospital?.id === hospital.id && "ring-1 ring-green-500/50"
                    )}
                    onClick={() => setSelectedHospital(hospital)}
                    data-testid={`hospital-item-${hospital.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-green-400">{hospital.name}</p>
                        <p className="text-xs text-muted-foreground">{hospital.city}, {hospital.region}</p>
                      </div>
                      <Badge 
                        className={cn(
                          "text-[10px]",
                          getOccupancyColor(hospital.available_beds, hospital.total_beds)
                        )}
                      >
                        {hospital.available_beds} beds
                      </Badge>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Beds</p>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(hospital.available_beds / hospital.total_beds) * 100} 
                            className="h-1.5 flex-1"
                          />
                          <span className="text-[10px] font-mono">
                            {hospital.available_beds}/{hospital.total_beds}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">ICU</p>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={(hospital.icu_available / hospital.icu_beds) * 100} 
                            className="h-1.5 flex-1"
                          />
                          <span className="text-[10px] font-mono">
                            {hospital.icu_available}/{hospital.icu_beds}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {hospital.emergency_capacity && (
                      <Badge variant="outline" className="mt-2 text-[10px] border-green-500/30 text-green-400">
                        Emergency Ready
                      </Badge>
                    )}
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Privacy Notice */}
      <Card className="glass-card mt-4 border-blue-500/20" data-testid="privacy-notice">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-400">Privacy Notice</h4>
              <p className="text-sm text-muted-foreground mt-1">
                This system displays only equipment availability and bed counts. No patient information is collected, 
                stored, or displayed. Hospital data is updated periodically by authorized administrators to ensure 
                privacy compliance with Italian and EU healthcare regulations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
