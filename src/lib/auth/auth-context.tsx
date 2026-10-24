"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from "@/lib/api/auth";
import { getErrorMessage, isUnauthorized } from "@/lib/api/errors";
import type { AuthUser, LoginInput, RegisterInput } from "@/lib/api/types";

export type AuthStatus =
  "loading" | "authenticated" | "unauthenticated" | "error";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  login: (input: LoginInput) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const refreshController = useRef<AbortController | null>(null);

  const cancelRefresh = useCallback(() => {
    refreshController.current?.abort();
    refreshController.current = null;
  }, []);

  const refresh = useCallback(async () => {
    cancelRefresh();

    const controller = new AbortController();
    refreshController.current = controller;

    try {
      const currentUser = await getMe(controller.signal);

      if (controller.signal.aborted) {
        return;
      }

      setUser(currentUser);
      setStatus("authenticated");
      setError(null);
    } catch (caught) {
      if (controller.signal.aborted) {
        return;
      }

      if (isUnauthorized(caught)) {
        setUser(null);
        setStatus("unauthenticated");
        setError(null);
        return;
      }

      setUser(null);
      setError(getErrorMessage(caught));
      setStatus("error");
    } finally {
      if (refreshController.current === controller) {
        refreshController.current = null;
      }
    }
  }, [cancelRefresh]);

  useEffect(() => {
    const controller = new AbortController();
    refreshController.current = controller;

    void getMe(controller.signal)
      .then((currentUser) => {
        if (controller.signal.aborted) {
          return;
        }

        setUser(currentUser);
        setStatus("authenticated");
        setError(null);
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (isUnauthorized(caught)) {
          setUser(null);
          setStatus("unauthenticated");
          setError(null);
          return;
        }

        setUser(null);
        setError(getErrorMessage(caught));
        setStatus("error");
      })
      .finally(() => {
        if (refreshController.current === controller) {
          refreshController.current = null;
        }
      });

    return () => {
      cancelRefresh();
    };
  }, [cancelRefresh]);

  const login = useCallback(
    async (input: LoginInput): Promise<AuthUser> => {
      cancelRefresh();
      const currentUser = await loginRequest(input);
      setUser(currentUser);
      setStatus("authenticated");
      setError(null);
      return currentUser;
    },
    [cancelRefresh],
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<AuthUser> => {
      cancelRefresh();
      await registerRequest(input);
      const currentUser = await loginRequest({
        email: input.email,
        password: input.password,
      });
      setUser(currentUser);
      setStatus("authenticated");
      setError(null);
      return currentUser;
    },
    [cancelRefresh],
  );

  const logout = useCallback(async (): Promise<void> => {
    cancelRefresh();

    try {
      await logoutRequest();
    } finally {
      setUser(null);
      setStatus("unauthenticated");
      setError(null);
    }
  }, [cancelRefresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      error,
      login,
      register,
      logout,
      refresh,
    }),
    [error, login, logout, refresh, register, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
