import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { adminService } from "@/services/adminService";
import { Loader2, Shield } from "lucide-react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const session = adminService.getSession();
      if (!session) {
        setLocation("/admin/login");
        return;
      }
      
      // Check if session is expired (24 hours)
      const loginTime = new Date(session.loginTime);
      const now = new Date();
      const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        adminService.clearSession();
        setLocation("/admin/login");
        return;
      }
      
      setIsAuthenticated(true);
      setIsChecking(false);
    };

    checkAuth();
  }, [setLocation]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 mb-4">
            <Shield className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Verificando autenticação...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
