"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "@/components/ThemeToggle";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, isLoading, logout } = useAuth(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleMenuClick(action: string) {
    setIsOpen(false);

    switch (action) {
      case "profile":
        router.push("/profile");
        break;
      case "history":
        router.push("/history");
        break;
      case "logout":
        logout();
        break;
      default:
        break;
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-full p-1.5">
        <ThemeToggle />
        <div className="h-9 w-9 rounded-full bg-[#F8C8D4]/20 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="flex items-center gap-2 rounded-full px-4 py-2 bg-gradient-to-r from-[#F8C8D4] to-[#FFB6C1] text-white text-sm font-medium hover:shadow-lg hover:shadow-[#F8C8D4]/30 transition-all duration-200"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10,17 15,12 10,7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
        登录
      </button>
    );
  }

  const displayName = user.name || `用户${user.phone.slice(-4)}`;

  return (
    <div className="flex items-center gap-1.5">
      <ThemeToggle />
      <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full p-1.5 hover:bg-white/50 transition-all duration-200 group"
      >
        <div className="relative">
          <Avatar className="h-9 w-9 ring-2 ring-[#F8C8D4]/30 group-hover:ring-[#F8C8D4] transition-all duration-200">
            {user.avatar ? (
              <img src={user.avatar} alt={displayName} />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-[#F8C8D4] to-[#FFB6C1] text-white text-sm font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-white" />
        </div>

        <span className="text-sm font-medium text-[#3D2C2E] hidden sm:block max-w-[100px] truncate">
          {displayName}
        </span>

        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`hidden sm:block text-[#9B8A8E] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white/95 backdrop-blur-xl shadow-lg shadow-[#F8C8D4]/10 border border-[#EDE5E0]/50 overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
          <div className="p-3 bg-gradient-to-r from-[#F8C8D4]/10 to-[#FFB6C1]/10 border-b border-[#EDE5E0]/30">
            <p className="text-sm font-semibold text-[#3D2C2E]">
              {displayName}
            </p>
            <p className="text-xs text-[#9B8A8E] mt-0.5 truncate">
              {user.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}
            </p>
          </div>

          <div className="py-1.5">
            <button
              onClick={() => handleMenuClick("profile")}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[#3D2C2E] hover:bg-[#F8C8D4]/10 transition-colors duration-150"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#9B8A8E]"
              >
                <circle cx="12" cy="8" r="5" />
                <path d="M20 21a8 8 0 1 0-16 0" />
              </svg>
              个人中心
            </button>

            <button
              onClick={() => handleMenuClick("history")}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[#3D2C2E] hover:bg-[#F8C8D4]/10 transition-colors duration-150"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#9B8A8E]"
              >
                <path d="M12 8v4l3 3" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              历史记录
            </button>

            <div className="my-1.5 mx-3 h-px bg-[#EDE5E0]" />

            <button
              onClick={() => handleMenuClick("logout")}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors duration-150"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              退出登录
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
