"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { useTheme } from "next-themes";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <Toaster
      position="top-center"
      theme={dark ? "dark" : "light"}
      toastOptions={{
        style: {
          background: dark ? "#262024" : "#fff",
          border: dark ? "1px solid #3A3236" : "1px solid #EDE5E0",
          color: dark ? "#F2E8EA" : "#3D2C2E",
        },
      }}
    />
  );
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
      <ThemedToaster />
    </ThemeProvider>
  );
}
