import type { Producto } from "@/lib/catalogo/normalizar";
import {
  type Borrador,
  type Cliente,
  crearBorradorVacio,
  type Descuento,
  type Entrega,
  type TipoDocumento,
} from "./tipos";

export type Accion =
  | { tipo: "agregar"; producto: Producto; cantidad: number }
  | { tipo: "quitar"; productoId: number }
  | { tipo: "cantidad"; productoId: number; cantidad: number }
  | { tipo: "descuentoItem"; productoId: number; descuento: Descuento | null }
  | { tipo: "descuentoGeneral"; descuento: Descuento | null }
  | { tipo: "validez"; dias: number }
  | { tipo: "entrega"; entrega: Entrega | null }
  | { tipo: "tipoDocumento"; valor: TipoDocumento }
  | { tipo: "cliente"; cliente: Cliente | null }
  | { tipo: "ocultarLinea"; productoId: number; lineaId: string; oculta: boolean }
  | { tipo: "mostrarFoto"; productoId: number; mostrar: boolean }
  | { tipo: "actualizarPrecio"; productoId: number; precioCentavos: number }
  | { tipo: "nota"; texto: string }
  | { tipo: "quitarNota"; indice: number }
  | { tipo: "nuevo" }
  | { tipo: "reemplazar"; borrador: Borrador };

const MAX_HISTORIAL = 30;
const MAX_NOTAS = 10;

function acotar(valor: number, minimo: number, maximo: number): number {
  return Math.min(maximo, Math.max(minimo, Math.round(valor)));
}

export function aplicar(b: Borrador, a: Accion): Borrador {
  switch (a.tipo) {
    case "agregar": {
      const existe = b.items.some((i) => i.productoId === a.producto.id);
      if (existe) {
        return {
          ...b,
          items: b.items.map((i) =>
            i.productoId === a.producto.id
              ? {
                  ...i,
                  cantidad: acotar(i.cantidad + a.cantidad, 1, 99),
                  precioVistoCentavos: a.producto.precioCentavos,
                }
              : i,
          ),
        };
      }
      return {
        ...b,
        items: [
          ...b.items,
          {
            productoId: a.producto.id,
            cantidad: acotar(a.cantidad, 1, 99),
            descuento: null,
            lineasOcultas: a.producto.lineas.filter((l) => !l.importante).map((l) => l.id),
            mostrarFoto: true,
            precioVistoCentavos: a.producto.precioCentavos,
          },
        ],
      };
    }
    case "quitar":
      return { ...b, items: b.items.filter((i) => i.productoId !== a.productoId) };
    case "cantidad":
      return {
        ...b,
        items: b.items.map((i) =>
          i.productoId === a.productoId ? { ...i, cantidad: acotar(a.cantidad, 1, 99) } : i,
        ),
      };
    case "descuentoItem":
      return {
        ...b,
        items: b.items.map((i) =>
          i.productoId === a.productoId ? { ...i, descuento: a.descuento } : i,
        ),
      };
    case "descuentoGeneral":
      return { ...b, descuentoGeneral: a.descuento };
    case "validez":
      return { ...b, validezDias: acotar(a.dias, 1, 365) };
    case "entrega":
      return { ...b, entrega: a.entrega };
    case "tipoDocumento":
      return { ...b, tipoDocumento: a.valor };
    case "cliente":
      return { ...b, cliente: a.cliente };
    case "ocultarLinea":
      return {
        ...b,
        items: b.items.map((i) => {
          if (i.productoId !== a.productoId) return i;
          const sin = i.lineasOcultas.filter((id) => id !== a.lineaId);
          return { ...i, lineasOcultas: a.oculta ? [...sin, a.lineaId] : sin };
        }),
      };
    case "mostrarFoto":
      return {
        ...b,
        items: b.items.map((i) =>
          i.productoId === a.productoId ? { ...i, mostrarFoto: a.mostrar } : i,
        ),
      };
    case "actualizarPrecio":
      return {
        ...b,
        items: b.items.map((i) =>
          i.productoId === a.productoId ? { ...i, precioVistoCentavos: a.precioCentavos } : i,
        ),
      };
    case "nota": {
      const texto = a.texto.trim();
      if (!texto || b.notas.length >= MAX_NOTAS) return b;
      return { ...b, notas: [...b.notas, texto.slice(0, 200)] };
    }
    case "quitarNota":
      return { ...b, notas: b.notas.filter((_, i) => i !== a.indice) };
    case "nuevo":
      return crearBorradorVacio();
    case "reemplazar":
      return a.borrador;
  }
}

export type Historial = { actual: Borrador; pasado: Borrador[] };

export function crearHistorial(borrador: Borrador = crearBorradorVacio()): Historial {
  return { actual: borrador, pasado: [] };
}

export function conHistorial(h: Historial, acciones: Accion[]): Historial {
  if (acciones.length === 0) return h;
  const actual = acciones.reduce(aplicar, h.actual);
  return { actual, pasado: [...h.pasado, h.actual].slice(-MAX_HISTORIAL) };
}

export function deshacer(h: Historial): Historial {
  const previo = h.pasado.at(-1);
  if (!previo) return h;
  return { actual: previo, pasado: h.pasado.slice(0, -1) };
}
