import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "FH Cotizador",
  description: "Cotizaciones y facturas proforma de Florencio Hernández",
  appleWebApp: { capable: true, title: "FH Cotizador", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0c2641",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-UY">
      <body>{children}</body>
    </html>
  );
}
