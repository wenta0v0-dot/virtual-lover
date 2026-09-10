"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  phone: string;
  name: string | null;
  avatar: string | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

/**
 * 全局唯一的认证 Hook。
 * @param requireAuth 为 true（默认）时，未登录会自动跳转到 /login；
 *                    导航栏等允许未登录访问的场景请传 false。
 */
export function useAuth(requireAuth = true) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
  });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setState({
          user: data.user,
          loading: false,
          isAuthenticated: true,
        });
      } else {
        setState({
          user: null,
          loading: false,
          isAuthenticated: false,
        });
        if (requireAuth) {
          router.push("/login");
        }
      }
    } catch (error) {
      console.error("[useAuth] 检查登录状态失败:", error);
      setState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });
      if (requireAuth) {
        router.push("/login");
      }
    }
  }, [router, requireAuth]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });
      window.location.href = "/login";
    }
  }, []);

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    isLoading: state.loading,
    logout,
    refresh,
  };
}
