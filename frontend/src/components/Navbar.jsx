import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Activity, Droplets, Thermometer, Building2, Target, LayoutDashboard, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Navbar = ({ dashboardData }) => {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAlert, setShowAlert] = useState(true);
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalAlerts = dashboardData?.active_alerts?.total || 0;
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/seismic", label: "Seismic", icon: Activity },
    { path: "/flood", label: "Flood Risk", icon: Droplets },
    { path: "/heatwave", label: "Heat Wave", icon: Thermometer },
    { path: "/hospitals", label: "Hospitals", icon: Building2 },
    { path: "/admin", label: "Accuracy", icon: Target },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 nav-container" data-testid="navbar">
      <div className="max-w-[1920px] mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3" data-testid="nav-logo">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-2 border-[#00D4FF]" />
              <div className="absolute inset-1 rounded-full border border-[#00D4FF] opacity-50" />
            </div>
            <div>
              <h1 className="font-display text-sm font-bold tracking-wider">
                <span className="text-white">RE-ACT</span>{" "}
                <span className="text-[#00D4FF]">Mediterranean</span>
              </h1>
              <p className="text-[10px] text-[#AAB5C2] uppercase tracking-widest">
                Disaster Risk Management
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                  className={cn(
                    "nav-link",
                    isActive && "nav-link-active"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side - Time & Status */}
          <div className="flex items-center gap-4">
            {/* Alert Notification */}
            {totalAlerts > 0 && showAlert && (
              <div className="alert-notification hidden lg:flex" data-testid="alert-notification">
                <AlertTriangle className="w-5 h-5 text-[#FF9500]" />
                <span className="text-sm text-white">
                  {totalAlerts} active risk alerts detected
                </span>
              </div>
            )}

            {/* Time Display */}
            <div className="text-right hidden md:block" data-testid="time-display">
              <div className="font-mono text-lg font-bold text-white">
                {currentTime.toLocaleTimeString("it-IT", { hour12: false })}
              </div>
              <div className="text-[10px] text-[#AAB5C2] uppercase tracking-wider">
                {currentTime.toLocaleDateString("it-IT")} UTC+1
              </div>
            </div>

            {/* Online Status */}
            <div className="status-badge status-badge-online" data-testid="status-online">
              <span className="w-2 h-2 bg-[#20E3B2] rounded-full animate-pulse" />
              <span>Online</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
