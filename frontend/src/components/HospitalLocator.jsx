import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Building2, Phone, Search, MapPin, Bed, Heart, Shield, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { apiClient } from "@/App";
import { toast } from "sonner";

const ITALY_CENTER = [42.5, 12.5];

const hospitalIcon = L.divIcon({
  className: "custom-hospital-icon",
  html: `<div style="background: #20E3B2; width: 16px; height: 16px; border-radius: 4px; border: 2px solid white; box-shadow: 0 0 10px rgba(32,227,178,0.6);"></div>`,
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredHospitals = hospitals.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         h.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = regionFilter === "all" || h.region === regionFilter;
    return matchesSearch && matchesRegion;
  });

  const regions = [...new Set(hospitals.map(h => h.region))].sort();
  const avgCapacity = stats?.occupancy_rate ? (100 - stats.occupancy_rate).toFixed(0) : 19;

  return (
    <div className="p-6 min-h-[calc(100vh-56px)] bg-[#0C1A2E]" data-testid="hospital-locator">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-wide">
            HOSPITAL FINDER
          </h1>
          <p className="text-[#AAB5C2] text-sm mt-1">
            Real-time bed availability and equipment tracking (Privacy Protected)
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#FF9500]/10 border border-[#FF9500]/30 rounded text-[#FF9500] text-xs font-semibold uppercase">
          <Shield className="w-4 h-4" />
          No Patient Data · Equipment Only
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="stat-label">Hospitals Tracked</p>
          <p className="stat-value stat-value-flood">{stats?.total_hospitals || hospitals.length}</p>
          <Building2 className="stat-icon text-[#007AFF]" />
        </div>
        <div className="stat-card">
          <p className="stat-label">Available Beds</p>
          <p className="stat-value stat-value-hospital">{stats?.available_beds?.toLocaleString() || 2730}</p>
          <Bed className="stat-icon text-[#20E3B2]" />
        </div>
        <div className="stat-card">
          <p className="stat-label">ICU Available</p>
          <p className="stat-value text-[#FF9500]">{stats?.available_icu || 324}</p>
          <Heart className="stat-icon text-[#FF9500]" />
        </div>
        <div className="stat-card">
          <p className="stat-label">Avg Capacity</p>
          <p className="stat-value text-[#FF9500]">{avgCapacity}%</p>
          <Building2 className="stat-icon text-[#FF9500]" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAB5C2]" />
          <Input
            placeholder="Search hospitals or locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#13273E] border-[#1e3a5f] text-white placeholder:text-[#6B7A8A] focus:border-[#00D4FF]"
            data-testid="hospital-search"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#AAB5C2]" />
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-40 bg-[#13273E] border-[#1e3a5f] text-white" data-testid="region-filter">
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent className="bg-[#13273E] border-[#1e3a5f]">
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map(region => (
                <SelectItem key={region} value={region}>{region}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_280px] gap-4">
        {/* Left Panel - Hospital List */}
        <div className="card-dark p-4" data-testid="hospital-list">
          <div className="section-header">
            <div className="section-bar section-bar-hospital" />
            <h2 className="font-display text-sm font-bold text-white tracking-wide">
              HOSPITALS ({filteredHospitals.length})
            </h2>
          </div>
          <ScrollArea className="h-[420px]">
            <div className="space-y-3">
              {filteredHospitals.map((hospital, idx) => (
                <div 
                  key={hospital.id || idx} 
                  className={cn(
                    "event-card cursor-pointer",
                    selectedHospital?.id === hospital.id && "border-[#00D4FF]"
                  )}
                  onClick={() => setSelectedHospital(hospital)}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-[#20E3B2] mt-0.5" />
                    <div>
                      <p className="text-[#20E3B2] font-medium text-sm">{hospital.name}</p>
                      <p className="text-[#AAB5C2] text-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {hospital.city}, {hospital.region}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-[#AAB5C2] mb-1">General Beds</p>
                      <div className="flex items-center gap-2">
                        <div className="progress-bar flex-1">
                          <div 
                            className="progress-bar-fill progress-bar-fill-cyan" 
                            style={{ width: `${(hospital.available_beds / hospital.total_beds) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-[#00D4FF]">
                          {hospital.available_beds}/{hospital.total_beds}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-[#AAB5C2] mb-1">ICU Beds</p>
                      <div className="flex items-center gap-2">
                        <div className="progress-bar flex-1">
                          <div 
                            className="progress-bar-fill progress-bar-fill-red" 
                            style={{ width: `${(hospital.icu_available / hospital.icu_beds) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-[#FF9500]">
                          {hospital.icu_available}/{hospital.icu_beds}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Equipment Tags */}
                  <div className="flex flex-wrap mb-3">
                    {hospital.equipment?.slice(0, 3).map((eq, i) => (
                      <span key={i} className="equipment-tag">{eq}</span>
                    ))}
                    {hospital.equipment?.length > 3 && (
                      <span className="equipment-tag">+{hospital.equipment.length - 3}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#00D4FF]">
                    <Phone className="w-3 h-3" />
                    <span className="font-mono">{hospital.contact_phone}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center Panel - Hospital Map */}
        <div className="card-dark p-4" data-testid="hospital-map">
          <div className="section-header">
            <div className="section-bar section-bar-hospital" />
            <h2 className="font-display text-sm font-bold text-white tracking-wide">
              HOSPITAL LOCATIONS
            </h2>
          </div>
          <div className="h-[420px] rounded-lg overflow-hidden border border-[#1e3a5f]">
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
                  eventHandlers={{ click: () => setSelectedHospital(hospital) }}
                >
                  <Popup>
                    <div className="text-white min-w-[200px]">
                      <strong className="text-[#20E3B2]">{hospital.name}</strong>
                      <p className="text-sm">{hospital.city}</p>
                      <div className="mt-2 space-y-1 text-xs">
                        <p>Beds: {hospital.available_beds}/{hospital.total_beds}</p>
                        <p>ICU: {hospital.icu_available}/{hospital.icu_beds}</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Right Panel - Equipment Details & Privacy */}
        <div className="space-y-4">
          {/* Equipment Details */}
          <div className="card-dark p-4" data-testid="equipment-details">
            <div className="flex flex-col items-center justify-center h-[200px] text-center">
              {selectedHospital ? (
                <div className="w-full">
                  <h3 className="font-display text-sm font-bold text-white mb-4">
                    {selectedHospital.name}
                  </h3>
                  <div className="space-y-2">
                    {selectedHospital.equipment?.map((eq, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-[#AAB5C2]">{eq}</span>
                        <span className="text-[#20E3B2]">Available</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <Building2 className="w-12 h-12 text-[#AAB5C2] mb-4 opacity-50" />
                  <p className="text-[#AAB5C2] text-sm">
                    Select a hospital to view equipment details
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="privacy-notice" data-testid="privacy-notice">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-[#00D4FF]" />
              <span className="privacy-notice-title">Privacy Protected</span>
            </div>
            <p className="text-sm text-[#AAB5C2] leading-relaxed">
              This system displays only equipment availability and bed counts. No 
              patient information is stored or displayed in compliance with Italian 
              healthcare privacy regulations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
