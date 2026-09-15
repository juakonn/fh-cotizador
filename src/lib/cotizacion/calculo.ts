import type { Producto } from "@/lib/catalogo/normalizar";
import type { Borrador, Descuento, LineaCalculada, Totales } from "./tipos";

export function calcularDescuento(baseCentavos: number, descuento: Descuento | null): number {
  if (!descuento) return 0;
  const bruto =
    descuento.tipo === "porcentaje"
      ? Math.round((baseCentavos * descuento.valor) / 100)
      : descuento.centavos;
  return Math.min(baseCentavos, Math.max(0, bruto));
}

export type ResultadoTotales =
  | { ok: true; totales: Totales }
  | { ok: false; codigo: "PRODUCTO_NO_DISPONIBLE"; mensaje: string; productoIds: number[] };

export function calcularTotales(borrador: Borrador, catalogo: Producto[]): ResultadoTotales {
  const porId = new Map(catalogo.map((p) => [p.id, p]));
  const lineas: LineaCalculada[] = [];
  const faltantes: number[] = [];
  for (const item of borrador.items) {
    const producto = porId.get(item.productoId);
    if (!producto) {
      faltantes.push(item.productoId);
      continue;
    }
    const brutoCentavos = producto.precioCentavos * item.cantidad;
    const descuentoCentavos = calcularDescuento(brutoCentavos, item.descuento);
    lineas.push({
      productoId: producto.id,
      titulo: producto.titulo,
      cantidad: item.cantidad,
      precioUnitarioCentavos: producto.precioCentavos,
      brutoCentavos,
      descuentoCentavos,
      netoCentavos: brutoCentavos - descuentoCentavos,
      ivaIncluido: producto.ivaIncluido,
    });
  }
  if (faltantes.length > 0) {
    return {
      ok: false,
      codigo: "PRODUCTO_NO_DISPONIBLE",
      mensaje: "Hay productos de la cotización que ya no están en la web",
      productoIds: faltantes,
    };
  }
  const subtotalCentavos = lineas.reduce((suma, l) => suma + l.netoCentavos, 0);
  const descuentoGeneralCentavos = calcularDescuento(subtotalCentavos, borrador.descuentoGeneral);
  const conIva = lineas.filter((l) => l.ivaIncluido).length;
  const iva: Totales["iva"] =
    conIva === 0 ? "exento" : conIva === lineas.length ? "incluido" : "mixto";
  return {
    ok: true,
    totales: {
      lineas,
      subtotalCentavos,
      descuentoGeneralCentavos,
      totalCentavos: subtotalCentavos - descuentoGeneralCentavos,
      iva,
    },
  };
}
