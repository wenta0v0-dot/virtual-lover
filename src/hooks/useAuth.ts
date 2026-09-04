"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  name: string | null;
  avatar: string | null;
}

export function useAuth(requireAuth = true) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          setUser(null);

          // 如果需要登录且未登录，跳转到登录页
          if (requireAuth) {
            router.push("/login");
          }
        }
      } catch (error) {
        console.error("[useAuth] 检查登录状态失败:", error);
        setUser(null);

        if (requireAuth) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router, requireAuth]);

  return { user, loading };
}
