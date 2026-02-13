import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import "leaflet/dist/leaflet.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { Dashboard } from "@/components/Dashboard";
import { SeismicMonitor } from "@/components/SeismicMonitor";
import { FloodMonitor } from "@/components/FloodMonitor";
import { HeatWaveMonitor } from "@/components/HeatWaveMonitor";
import { HospitalLocator } from "@/components/HospitalLocator";
import { AdminPanel } from "@/components/AdminPanel";
import { Navbar } from "@/components/Navbar";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Create axios instance with base config
export const apiClient = axios.create({
  baseURL: API,
  timeout: 30000,
});

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await apiClient.get("/dashboard/summary");
      setDashboardData(response.data);
      setError(null);
    } catch (e) {
      console.error("Error fetching dashboard data:", e);
      setError("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // Refresh data every 60 seconds
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <BrowserRouter>
        <Navbar dashboardData={dashboardData} />
        <main className="pt-16">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  data={dashboardData}
                  loading={loading}
                  error={error}
                  onRefresh={fetchDashboardData}
                />
              }
            />
            <Route path="/seismic" element={<SeismicMonitor />} />
            <Route path="/flood" element={<FloodMonitor />} />
            <Route path="/heatwave" element={<HeatWaveMonitor />} />
            <Route path="/hospitals" element={<HospitalLocator />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </main>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
