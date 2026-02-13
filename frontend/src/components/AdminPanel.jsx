import { useState, useEffect } from "react";
import { Shield, Building2, Bed, Save, RefreshCw, Plus, Edit, Check, X, Heart, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { apiClient } from "@/App";
import { toast } from "sonner";

export const AdminPanel = () => {
  const [hospitals, setHospitals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingHospital, setEditingHospital] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newHospital, setNewHospital] = useState({
    name: "",
    address: "",
    city: "",
    region: "",
    latitude: "",
    longitude: "",
    total_beds: "",
    available_beds: "",
    icu_beds: "",
    icu_available: "",
    contact_phone: "",
    equipment: [],
  });

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

  const startEditing = (hospital) => {
    setEditingHospital(hospital.id);
    setEditValues({
      available_beds: hospital.available_beds,
      icu_available: hospital.icu_available,
      emergency_capacity: hospital.emergency_capacity,
    });
  };

  const cancelEditing = () => {
    setEditingHospital(null);
    setEditValues({});
  };

  const saveChanges = async (hospitalId) => {
    setSaving(true);
    try {
      await apiClient.put(`/hospitals/${hospitalId}`, editValues);
      toast.success("Hospital updated successfully");
      setEditingHospital(null);
      fetchData();
    } catch (e) {
      toast.error("Failed to update hospital");
    } finally {
      setSaving(false);
    }
  };

  const addNewHospital = async () => {
    try {
      const hospitalData = {
        ...newHospital,
        latitude: parseFloat(newHospital.latitude),
        longitude: parseFloat(newHospital.longitude),
        total_beds: parseInt(newHospital.total_beds),
        available_beds: parseInt(newHospital.available_beds),
        icu_beds: parseInt(newHospital.icu_beds),
        icu_available: parseInt(newHospital.icu_available),
        equipment: newHospital.equipment.length > 0 ? newHospital.equipment : ["Ventilators", "X-Ray", "ECG"],
      };
      
      await apiClient.post("/hospitals", hospitalData);
      toast.success("Hospital added successfully");
      setShowAddDialog(false);
      setNewHospital({
        name: "", address: "", city: "", region: "",
        latitude: "", longitude: "", total_beds: "", available_beds: "",
        icu_beds: "", icu_available: "", contact_phone: "", equipment: [],
      });
      fetchData();
    } catch (e) {
      toast.error("Failed to add hospital");
    }
  };

  if (loading && hospitals.length === 0) {
    return (
      <div className="p-4 md:p-6 grid-bg min-h-[calc(100vh-64px)]" data-testid="admin-loading">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 grid-bg min-h-[calc(100vh-64px)]" data-testid="admin-panel">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold font-['Chivo'] flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-500" />
            Hospital Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage hospital bed availability and equipment data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button data-testid="add-hospital-btn">
                <Plus className="w-4 h-4 mr-2" />
                Add Hospital
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-card">
              <DialogHeader>
                <DialogTitle>Add New Hospital</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Hospital Name</Label>
                  <Input
                    value={newHospital.name}
                    onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })}
                    placeholder="Ospedale San Marco"
                    data-testid="new-hospital-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={newHospital.city}
                    onChange={(e) => setNewHospital({ ...newHospital, city: e.target.value })}
                    placeholder="Roma"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={newHospital.address}
                    onChange={(e) => setNewHospital({ ...newHospital, address: e.target.value })}
                    placeholder="Via Roma, 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Input
                    value={newHospital.region}
                    onChange={(e) => setNewHospital({ ...newHospital, region: e.target.value })}
                    placeholder="Lazio"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={newHospital.latitude}
                    onChange={(e) => setNewHospital({ ...newHospital, latitude: e.target.value })}
                    placeholder="41.9028"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={newHospital.longitude}
                    onChange={(e) => setNewHospital({ ...newHospital, longitude: e.target.value })}
                    placeholder="12.4964"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Beds</Label>
                  <Input
                    type="number"
                    value={newHospital.total_beds}
                    onChange={(e) => setNewHospital({ ...newHospital, total_beds: e.target.value })}
                    placeholder="500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Available Beds</Label>
                  <Input
                    type="number"
                    value={newHospital.available_beds}
                    onChange={(e) => setNewHospital({ ...newHospital, available_beds: e.target.value })}
                    placeholder="200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ICU Beds</Label>
                  <Input
                    type="number"
                    value={newHospital.icu_beds}
                    onChange={(e) => setNewHospital({ ...newHospital, icu_beds: e.target.value })}
                    placeholder="50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ICU Available</Label>
                  <Input
                    type="number"
                    value={newHospital.icu_available}
                    onChange={(e) => setNewHospital({ ...newHospital, icu_available: e.target.value })}
                    placeholder="20"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    value={newHospital.contact_phone}
                    onChange={(e) => setNewHospital({ ...newHospital, contact_phone: e.target.value })}
                    placeholder="+39 06 1234567"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={addNewHospital} data-testid="save-new-hospital">
                  <Save className="w-4 h-4 mr-2" />
                  Save Hospital
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={fetchData} data-testid="refresh-btn">
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card border-t-4 border-t-indigo-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Hospitals</p>
            <p className="text-3xl font-bold font-['Chivo'] mt-1">{stats?.total_hospitals || 0}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-t-4 border-t-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Available Beds</p>
            <p className="text-3xl font-bold font-['Chivo'] mt-1">{stats?.available_beds?.toLocaleString() || 0}</p>
            <Progress 
              value={100 - (stats?.occupancy_rate || 0)} 
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>
        <Card className="glass-card border-t-4 border-t-red-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">ICU Available</p>
            <p className="text-3xl font-bold font-['Chivo'] mt-1">{stats?.available_icu || 0}</p>
            <Progress 
              value={100 - (stats?.icu_occupancy_rate || 0)} 
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>
        <Card className="glass-card border-t-4 border-t-orange-500">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Emergency Ready</p>
            <p className="text-3xl font-bold font-['Chivo'] mt-1">{stats?.emergency_ready || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Hospital Table */}
      <Card className="glass-card" data-testid="hospital-table">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Hospital Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead>Hospital</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Beds</TableHead>
                  <TableHead className="text-center">ICU</TableHead>
                  <TableHead className="text-center">Emergency</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hospitals.map((hospital) => (
                  <TableRow key={hospital.id} className="border-white/10">
                    <TableCell>
                      <div>
                        <p className="font-medium text-green-400">{hospital.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{hospital.contact_phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{hospital.city}</p>
                        <p className="text-xs text-muted-foreground">{hospital.region}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {editingHospital === hospital.id ? (
                        <Input
                          type="number"
                          value={editValues.available_beds}
                          onChange={(e) => setEditValues({ ...editValues, available_beds: parseInt(e.target.value) })}
                          className="w-20 mx-auto bg-secondary/50 text-center"
                          data-testid={`edit-beds-${hospital.id}`}
                        />
                      ) : (
                        <div>
                          <span className="font-mono">{hospital.available_beds}</span>
                          <span className="text-muted-foreground">/{hospital.total_beds}</span>
                          <Progress 
                            value={(hospital.available_beds / hospital.total_beds) * 100} 
                            className="h-1 mt-1"
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingHospital === hospital.id ? (
                        <Input
                          type="number"
                          value={editValues.icu_available}
                          onChange={(e) => setEditValues({ ...editValues, icu_available: parseInt(e.target.value) })}
                          className="w-20 mx-auto bg-secondary/50 text-center"
                          data-testid={`edit-icu-${hospital.id}`}
                        />
                      ) : (
                        <div>
                          <span className="font-mono text-red-400">{hospital.icu_available}</span>
                          <span className="text-muted-foreground">/{hospital.icu_beds}</span>
                          <Progress 
                            value={(hospital.icu_available / hospital.icu_beds) * 100} 
                            className="h-1 mt-1"
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingHospital === hospital.id ? (
                        <Switch
                          checked={editValues.emergency_capacity}
                          onCheckedChange={(checked) => setEditValues({ ...editValues, emergency_capacity: checked })}
                          data-testid={`edit-emergency-${hospital.id}`}
                        />
                      ) : (
                        <Badge 
                          variant="outline"
                          className={cn(
                            hospital.emergency_capacity 
                              ? "border-green-500/30 text-green-400" 
                              : "border-red-500/30 text-red-400"
                          )}
                        >
                          {hospital.emergency_capacity ? "Yes" : "No"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingHospital === hospital.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => saveChanges(hospital.id)}
                            disabled={saving}
                            data-testid={`save-${hospital.id}`}
                          >
                            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={cancelEditing}
                            data-testid={`cancel-${hospital.id}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => startEditing(hospital)}
                          data-testid={`edit-${hospital.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="glass-card mt-4 border-indigo-500/20" data-testid="admin-instructions">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Wrench className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h4 className="font-semibold text-indigo-400">Admin Instructions</h4>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Click the edit button to update bed availability for any hospital</li>
                <li>• Changes are saved immediately to the database</li>
                <li>• Only equipment and bed counts are tracked - no patient data is stored</li>
                <li>• Update data regularly to maintain accuracy during emergencies</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
