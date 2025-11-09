import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser } from '@shared';

interface AuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  requiresMFA: boolean;
  mfaEmail: string | null;
  setUser: (user: IUser | null) => void;
  setToken: (token: string | null) => void;
  setRequiresMFA: (requires: boolean, email?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      requiresMFA: false,
      mfaEmail: null,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
      }),

      setToken: (token) => {
        set({ token });
        if (token) {
          localStorage.setItem('satria_token', token);
        } else {
          localStorage.removeItem('satria_token');
        }
      },

      setRequiresMFA: (requires, email) => set({
        requiresMFA: requires,
        mfaEmail: email || null,
      }),

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          requiresMFA: false,
          mfaEmail: null,
        });
        localStorage.removeItem('satria_token');
        localStorage.removeItem('satria_user');
      },
    }),
    {
      name: 'satria-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
