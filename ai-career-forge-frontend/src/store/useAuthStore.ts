import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'USER' | 'RECRUITER' | 'ADMIN' | 'PENDING';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  setAuth: (user: User, token: string, needsOnboarding?: boolean) => void;
  setToken: (token: string) => void;
  setNeedsOnboarding: (needs: boolean) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      needsOnboarding: false,
      setAuth: (user, token, needsOnboarding = false) => {
        localStorage.setItem('auth_token', token);
        set({ user, token, isAuthenticated: true, needsOnboarding });
      },
      setToken: (token) => {
        localStorage.setItem('auth_token', token);
        set({ token, isAuthenticated: true });
      },
      setNeedsOnboarding: (needs) => {
        set({ needsOnboarding: needs });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
        set({ user: null, token: null, isAuthenticated: false, needsOnboarding: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        needsOnboarding: state.needsOnboarding,
      }),
    }
  )
);

export default useAuthStore;
