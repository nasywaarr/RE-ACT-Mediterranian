import { useState, useEffect } from "react";
import { Target, RefreshCw, TrendingUp, CheckCircle, AlertTriangle, Activity } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { apiClient } from "@/App";
import { toast } from "sonner";

export const AdminPanel = () => {
  const [loading, setLoading] = useState(true);
  const [predictionHistory, setPredictionHistory] = useState([]);

  // Simulated accuracy data
  const accuracyData = {
    seismic: { predicted: 156, accurate: 141, accuracy: 90.4 },
    flood: { predicted: 89, accurate: 78, accuracy: 87.6 },
    heatwave: { predicted: 234, accurate: 212, accuracy: 90.6 },
    overall: 89.5
  };

  const monthlyData = [
    { month: "Jan", seismic: 88, flood: 85, heat: 92 },
    { month: "Feb", seismic: 91, flood: 87, heat: 89 },
    { month: "Mar", seismic: 87, flood: 90, heat: 91 },
    { month: "Apr", seismic: 92, flood: 88, heat: 93 },
    { month: "May", seismic: 89, flood: 86, heat: 90 },
    { month: "Jun", seismic: 90, flood: 89, heat: 88 },
  ];

  const recentPredictions = [
    { type: "seismic", region: "Emilia-Romagna", predicted: "M4.2", actual: "M4.0", accuracy: 95, status: "verified" },
    { type: "flood", region: "Venice", predicted: "High Risk", actual: "High Risk", accuracy: 100, status: "verified" },
    { type: "heatwave", region: "Sicily", predicted: "42°C", actual: "41°C", accuracy: 97, status: "verified" },
    { type: "seismic", region: "Calabria", predicted: "M3.8", actual: "M3.5", accuracy: 92, status: "verified" },
    { type: "flood", region: "Po Valley", predicted: "Medium Risk", actual: "Low Risk", accuracy: 75, status: "review" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get("/predictions/history?limit=10");
        setPredictionHistory(response.data || []);
      } catch (e) {
        console.error("Failed to fetch prediction history");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getTypeColor = (type) => {
    switch (type) {
      case "seismic": return "text-[#34C759]";
      case "flood": return "text-[#007AFF]";
      case "heatwave": return "text-[#FF9500]";
      default: return "text-white";
    }
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 90) return "text-[#34C759]";
    if (accuracy >= 80) return "text-[#00D4FF]";
    if (accuracy >= 70) return "text-[#FF9500]";
    return "text-[#FF3B3B]";
  };

  return (
    <div className="p-6 min-h-[calc(100vh-56px)] bg-[#0C1A2E]" data-testid="admin-panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-white tracking-wide">
            PREDICTION ACCURACY
          </h1>
          <p className="text-[#AAB5C2] text-sm mt-1">
            Model performance tracking and validation metrics
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#34C759]/10 border border-[#34C759]/30 rounded text-[#34C759] text-sm font-semibold">
          <CheckCircle className="w-4 h-4" />
          {accuracyData.overall}% Overall Accuracy
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="stat-label">Seismic Accuracy</p>
          <p className="stat-value stat-value-seismic">{accuracyData.seismic.accuracy}%</p>
          <p className="stat-description">{accuracyData.seismic.accurate}/{accuracyData.seismic.predicted} correct</p>
          <Activity className="stat-icon text-[#34C759]" />
        </div>
        <div className="stat-card">
          <p className="stat-label">Flood Accuracy</p>
          <p className="stat-value stat-value-flood">{accuracyData.flood.accuracy}%</p>
          <p className="stat-description">{accuracyData.flood.accurate}/{accuracyData.flood.predicted} correct</p>
          <Activity className="stat-icon text-[#007AFF]" />
        </div>
        <div className="stat-card">
          <p className="stat-label">Heat Wave Accuracy</p>
          <p className="stat-value stat-value-heat">{accuracyData.heatwave.accuracy}%</p>
          <p className="stat-description">{accuracyData.heatwave.accurate}/{accuracyData.heatwave.predicted} correct</p>
          <Activity className="stat-icon text-[#FF9500]" />
        </div>
        <div className="stat-card">
          <p className="stat-label">Overall Accuracy</p>
          <p className="stat-value stat-value-hospital">{accuracyData.overall}%</p>
          <p className="stat-description">2025 YTD performance</p>
          <Target className="stat-icon text-[#20E3B2]" />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Left - Monthly Trends */}
        <div className="card-dark p-4" data-testid="monthly-trends">
          <div className="section-header">
            <div className="section-bar section-bar-hospital" />
            <h2 className="font-display text-sm font-bold text-white tracking-wide">
              MONTHLY ACCURACY TRENDS
            </h2>
          </div>
          
          <div className="grid grid-cols-6 gap-4 mb-4">
            {monthlyData.map((month, idx) => (
              <div key={idx} className="text-center">
                <p className="text-xs text-[#AAB5C2] mb-2">{month.month}</p>
                <div className="space-y-2">
                  <div className="h-24 bg-[#0C1A2E] rounded relative flex flex-col justify-end">
                    <div 
                      className="bg-[#34C759]/30 border-t-2 border-[#34C759] rounded-t"
                      style={{ height: `${month.seismic}%` }}
                    />
                  </div>
                  <div className="h-24 bg-[#0C1A2E] rounded relative flex flex-col justify-end">
                    <div 
                      className="bg-[#007AFF]/30 border-t-2 border-[#007AFF] rounded-t"
                      style={{ height: `${month.flood}%` }}
                    />
                  </div>
                  <div className="h-24 bg-[#0C1A2E] rounded relative flex flex-col justify-end">
                    <div 
                      className="bg-[#FF9500]/30 border-t-2 border-[#FF9500] rounded-t"
                      style={{ height: `${month.heat}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-[#1e3a5f]">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded bg-[#34C759]" />
              <span className="text-[#AAB5C2]">Seismic</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded bg-[#007AFF]" />
              <span className="text-[#AAB5C2]">Flood</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded bg-[#FF9500]" />
              <span className="text-[#AAB5C2]">Heat Wave</span>
            </div>
          </div>
        </div>

        {/* Right - Recent Predictions */}
        <div className="card-dark p-4" data-testid="recent-predictions">
          <div className="section-header">
            <div className="section-bar section-bar-seismic" />
            <h2 className="font-display text-sm font-bold text-white tracking-wide">
              RECENT VALIDATIONS
            </h2>
          </div>
          <ScrollArea className="h-[380px]">
            <div className="space-y-3">
              {recentPredictions.map((pred, idx) => (
                <div key={idx} className="event-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-xs font-semibold uppercase", getTypeColor(pred.type))}>
                      {pred.type}
                    </span>
                    <span className={cn(
                      "risk-badge",
                      pred.status === "verified" ? "risk-badge-low" : "risk-badge-medium"
                    )}>
                      {pred.status}
                    </span>
                  </div>
                  <p className="text-white text-sm font-medium mb-2">{pred.region}</p>
                  <div className="grid grid-cols-2 gap-4 text-xs mb-2">
                    <div>
                      <p className="text-[#AAB5C2]">Predicted</p>
                      <p className="text-white font-mono">{pred.predicted}</p>
                    </div>
                    <div>
                      <p className="text-[#AAB5C2]">Actual</p>
                      <p className="text-white font-mono">{pred.actual}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#AAB5C2]">Accuracy</span>
                    <span className={cn("text-sm font-bold font-mono", getAccuracyColor(pred.accuracy))}>
                      {pred.accuracy}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Model Info */}
      <div className="card-dark p-4 mt-4" data-testid="model-info">
        <div className="section-header">
          <div className="section-bar section-bar-hospital" />
          <h2 className="font-display text-sm font-bold text-white tracking-wide">
            AI MODEL INFORMATION
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#0C1A2E] rounded-lg border border-[#1e3a5f]">
            <h3 className="text-[#34C759] font-semibold text-sm mb-2">Seismic Model</h3>
            <p className="text-xs text-[#AAB5C2] mb-2">GPT-5.2 with USGS data integration</p>
            <p className="text-xs text-[#AAB5C2]">Training: 15,000+ Italian seismic events (2020-2025)</p>
          </div>
          <div className="p-4 bg-[#0C1A2E] rounded-lg border border-[#1e3a5f]">
            <h3 className="text-[#007AFF] font-semibold text-sm mb-2">Flood Model</h3>
            <p className="text-xs text-[#AAB5C2] mb-2">GPT-5.2 with Mediterranean coastal data</p>
            <p className="text-xs text-[#AAB5C2]">Training: Po Valley, Venice, coastal flood records</p>
          </div>
          <div className="p-4 bg-[#0C1A2E] rounded-lg border border-[#1e3a5f]">
            <h3 className="text-[#FF9500] font-semibold text-sm mb-2">Heat Wave Model</h3>
            <p className="text-xs text-[#AAB5C2] mb-2">GPT-5.2 with OpenWeatherMap integration</p>
            <p className="text-xs text-[#AAB5C2]">Training: 2022, 2025 Italy heat events</p>
          </div>
        </div>
      </div>
    </div>
  );
};
