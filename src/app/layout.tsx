import type { Metadata } from "next";
import AppProviders from "@/components/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: "虚拟恋人 - AI 恋爱聊天",
  description: "选择你的虚拟恋人（男/女），开启沉浸式恋爱聊天体验",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
