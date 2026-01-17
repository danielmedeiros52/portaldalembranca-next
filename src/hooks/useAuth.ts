import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";

export interface UserSession {
  id: number;
  name: string;
  email: string;
  type: string; // "funeral_home" | "family_user" | "family" | "admin"
  isDemo: boolean;
  loginTime: string;
}

const SESSION_KEY = "userSession";

export function useAuth() {
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = () => {
      try {
        const storedSession = localStorage.getItem(SESSION_KEY);
        if (storedSession) {
          const parsed = JSON.parse(storedSession) as UserSession;
          
          // Check if session is expired (24 hours)
          const loginTime = new Date(parsed.loginTime);
          const now = new Date();
          const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursDiff > 24) {
            localStorage.removeItem(SESSION_KEY);
            setSession(null);
          } else {
            setSession(parsed);
          }
        }
      } catch (error) {
        console.error("Error loading session:", error);
        localStorage.removeItem(SESSION_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setLocation("/login");
  }, [setLocation]);

  // Check if user is authenticated
  const isAuthenticated = session !== null;

  // Check if user is in demo mode
  const isDemo = session?.isDemo ?? false;

  // Get user type
  const userType = session?.type ?? null;

  // Redirect to login if not authenticated
  const requireAuth = useCallback((allowedTypes?: string[]) => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
      return false;
    }
    
    if (allowedTypes && session && !allowedTypes.includes(session.type)) {
      setLocation("/login");
      return false;
    }
    
    return true;
  }, [isLoading, isAuthenticated, session, setLocation]);

  return {
    session,
    isLoading,
    isAuthenticated,
    isDemo,
    userType,
    logout,
    requireAuth,
  };
}

// Hook for funeral home dashboard
export function useFuneralHomeAuth() {
  const auth = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      setLocation("/login");
    } else if (!auth.isLoading && auth.session) {
      // Allow funeral_home type or demo mode
      const isFuneralHome = auth.session.type === "funeral_home";
      if (!isFuneralHome && !auth.isDemo) {
        setLocation("/login");
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.session, auth.isDemo, setLocation]);

  return auth;
}

// Hook for family dashboard
export function useFamilyAuth() {
  const auth = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      setLocation("/login");
    } else if (!auth.isLoading && auth.session) {
      // Allow family_user or family type, or demo mode
      const isFamily = auth.session.type === "family_user" || auth.session.type === "family";
      if (!isFamily && !auth.isDemo) {
        setLocation("/login");
      }
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.session, auth.isDemo, setLocation]);

  return auth;
}

export default useAuth;
