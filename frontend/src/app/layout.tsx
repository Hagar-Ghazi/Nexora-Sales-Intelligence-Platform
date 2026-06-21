import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexora Sales Intelligence Platform",
  description: "AI Assistant with intelligent routing and 4-layer database security",
};

import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen antialiased flex bg-background text-foreground overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          {children}
        </div>
      </body>
    </html>
  );
}
