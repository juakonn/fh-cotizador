import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FH Cotizador",
    short_name: "Cotizador",
    description: "Cotizaciones y facturas proforma de Florencio Hernández",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6f8",
    theme_color: "#0c2641",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
