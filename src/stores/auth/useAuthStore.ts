import { defineStore } from 'pinia';

import type { AuthUser, LoginPayload, LoginResult } from '@/api/auth/auth.types';
import * as authApi from '@/api/auth/authApi';
import {
  clearStoredSession,
  getStoredSession,
  isTokenExpired,
  persistSession,
} from '@/stores/auth/tokenStorage';

let initializePromise: Promise<void> | null = null;

interface AuthState {
  accessToken: string;
  expiresAt: string;
  user: AuthUser | null;
  initialized: boolean;
  loading: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    accessToken: '',
    expiresAt: '',
    user: null,
    initialized: false,
    loading: false,
  }),
  getters: {
    isAuthenticated: (state) =>
      Boolean(state.accessToken) && Boolean(state.user) && !isTokenExpired(state.expiresAt),
  },
  actions: {
    applySession(session: LoginResult) {
      this.accessToken = session.accessToken;
      this.expiresAt = session.expiresAt;
      this.user = session.user;
      persistSession({
        accessToken: session.accessToken,
        expiresAt: session.expiresAt,
      });
    },
    resetState() {
      this.accessToken = '';
      this.expiresAt = '';
      this.user = null;
    },
    clearSession() {
      clearStoredSession();
      this.resetState();
      this.initialized = true;
    },
    restoreSessionFromStorage() {
      const storedSession = getStoredSession();

      if (!storedSession || isTokenExpired(storedSession.expiresAt)) {
        clearStoredSession();
        this.resetState();
        return false;
      }

      this.accessToken = storedSession.accessToken;
      this.expiresAt = storedSession.expiresAt;
      return true;
    },
    async refreshUser() {
      const user = await authApi.getMe();
      this.user = user;
    },
    async initialize() {
      if (this.initialized) {
        return;
      }

      if (initializePromise) {
        return initializePromise;
      }

      initializePromise = (async () => {
        const hasSession = this.restoreSessionFromStorage();

        if (!hasSession) {
          this.initialized = true;
          return;
        }

        try {
          await this.refreshUser();
        } catch {
          this.clearSession();
          return;
        }

        this.initialized = true;
      })();

      try {
        await initializePromise;
      } finally {
        initializePromise = null;
      }
    },
    async syncFromStorage() {
      const previousToken = this.accessToken;
      const hasSession = this.restoreSessionFromStorage();

      if (!hasSession) {
        this.user = null;
        this.initialized = true;
        return;
      }

      if (!this.user || previousToken !== this.accessToken) {
        try {
          await this.refreshUser();
        } catch {
          this.clearSession();
          return;
        }
      }

      this.initialized = true;
    },
    async login(payload: LoginPayload) {
      this.loading = true;

      try {
        const session = await authApi.login(payload);
        this.applySession(session);
        this.initialized = true;
      } finally {
        this.loading = false;
      }
    },
    async logout() {
      this.loading = true;

      try {
        await authApi.logout();
      } catch {
        // Ignore logout transport failures and clear local session regardless.
      } finally {
        this.clearSession();
        this.loading = false;
      }
    },
  },
});
