"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes 需要挂载后才能读取主题，避免水合不一致
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        aria-label="切换主题"
        className="flex h-9 w-9 items-center justify-center rounded-full opacity-0"
      />
    );
  }

  const dark = resolvedTheme === "dark";

  return (
    <button
      aria-label={dark ? "切换到浅色模式" : "切换到深色模式"}
      title={dark ? "浅色模式" : "深色模式"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="flex h-9 w-9 items-center justify-center rounded-full text-[#9B8A8E] hover:bg-[#F8C8D4]/15 hover:text-[#F8A8BB] transition-all duration-200"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
