import type { Cliente, TipoDocumento } from "@/lib/cotizacion/tipos";
import { fechaIso } from "./fecha";

export function nombreArchivo(
  tipo: TipoDocumento,
  cliente: Cliente | null,
  primerTitulo: string,
  fecha: Date,
): string {
  const tipoTexto = tipo === "proforma" ? "Proforma" : "Cotización";
  const nombreCliente = cliente
    ? (cliente.tipo === "empresa" ? cliente.razonSocial : cliente.nombre).trim()
    : "";
  const base = [tipoTexto, nombreCliente || "Sin cliente", primerTitulo, fechaIso(fecha)]
    .filter(Boolean)
    .join(" - ")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return `${base}.pdf`;
}

export function contentDisposition(nombre: string): string {
  const ascii = nombre
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^ -~]/g, "_")
    .replace(/"/g, "");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(nombre)}`;
}
