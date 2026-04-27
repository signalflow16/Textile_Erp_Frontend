import "antd/dist/reset.css";
import "./globals.css";

import type { Metadata } from "next";

import { AuthGate } from "@/components/auth-gate";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Textile ERP",
  description: "Next.js frontend for ERPNext textile operations"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AuthGate>{children}</AuthGate>
        </Providers>
      </body>
    </html>
  );
}