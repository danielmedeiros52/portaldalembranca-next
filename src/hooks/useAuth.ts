// TODO: Implement useAuth hook with Next.js router
// This is a stub to allow the build to pass

export interface UserSession {
  id: number;
  name: string;
  email: string;
  type: string;
  isDemo: boolean;
  loginTime: string;
}

export function useAuth() {
  return {
    user: null,
    loading: false,
    login: () => Promise.resolve(),
    logout: () => Promise.resolve(),
  };
}
