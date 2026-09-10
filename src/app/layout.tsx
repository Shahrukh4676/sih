import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "NEXUS AI — Enterprise Content Intelligence & Transformation",
  description:
    "Secure AI-powered content intelligence platform. Transform raw documents, URLs, and advisories into verified communication artefacts under human approval and security guardrails.",
};

import { ToastProvider } from "@/components/ui/ToastProvider";
import { CommandPalette } from "@/components/ui/CommandPalette";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        <AuthProvider>
          <ToastProvider>
            {children}
            <CommandPalette />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
