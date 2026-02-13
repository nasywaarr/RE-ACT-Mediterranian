import { Link, useLocation } from "react-router-dom";
import { Activity, Waves, Thermometer, Building2, Shield, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

export const Navbar = ({ dashboardData }) => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/seismic", label: "Seismic", icon: Activity },
    { path: "/flood", label: "Flood", icon: Waves },
    { path: "/heatwave", label: "Heat Wave", icon: Thermometer },
    { path: "/hospitals", label: "Hospitals", icon: Building2 },
    { path: "/admin", label: "Admin", icon: Shield },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "moderate": return "bg-yellow-500";
      default: return "bg-green-500";
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-white/10" data-testid="navbar">
      <div className="max-w-[1800px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" data-testid="nav-logo">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 via-orange-500 to-sky-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              {dashboardData?.overall_status && (
                <span 
                  className={cn(
                    "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card",
                    getStatusColor(dashboardData.overall_status),
                    dashboardData.overall_status === "critical" && "animate-pulse"
                  )}
                />
              )}
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg font-['Chivo'] tracking-tight text-foreground">
                DisasterWatch
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Italy Emergency Monitor
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 md:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-white/10 text-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Status Indicator */}
          {dashboardData && (
            <div className="hidden lg:flex items-center gap-4" data-testid="status-indicator">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className={cn(
                  "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider",
                  dashboardData.overall_status === "critical" && "bg-red-500/20 text-red-400",
                  dashboardData.overall_status === "high" && "bg-orange-500/20 text-orange-400",
                  dashboardData.overall_status === "moderate" && "bg-yellow-500/20 text-yellow-400",
                  dashboardData.overall_status === "normal" && "bg-green-500/20 text-green-400"
                )}>
                  {dashboardData.overall_status}
                </span>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {new Date().toLocaleTimeString("it-IT")}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
