import type { Producto } from "@/lib/catalogo/normalizar";
import { sinAcentos } from "@/lib/catalogo/normalizar";
import type { DesgloseIva } from "./tipos";

/**
 * Un tractor vendido con la pala puesta tiene dos partes: el tractor va exento de IVA y la pala lo
 * lleva incluido. En la web el combo cuesta exactamente lo mismo que el tractor solo más la pala
 * sola, así que el reparto se puede proponer solo: se busca la pala de ese modelo en el catálogo y
 * lo que queda es la parte exenta. El vendedor lo puede corregir en la cotización.
 */

const COMBO = /(dong feng|iseki|farmtrac|landtrac).*con .*pala/;

function modeloDelCombo(titulo: string): string | null {
  return titulo.match(/\b(\d{3,4})\b/)?.[1] ?? null;
}

export function sugerirDesgloseIva(producto: Producto, catalogo: Producto[]): DesgloseIva | null {
  const titulo = sinAcentos(producto.titulo);
  if (!COMBO.test(titulo)) return null;
  const modelo = modeloDelCombo(titulo);
  if (!modelo) return null;

  const conCabina = /cabina/.test(titulo);
  const palas = catalogo.filter((p) => {
    const t = sinAcentos(p.titulo);
    return /palas? frontal(es)?/.test(t) && t.includes(modelo) && /cabina/.test(t) === conCabina;
  });
  const pala = palas.find(
    (p) => p.precioCentavos > 0 && p.precioCentavos < producto.precioCentavos,
  );
  if (!pala) return null;

  return {
    etiquetaExento: "Tractor",
    exentoCentavos: producto.precioCentavos - pala.precioCentavos,
    etiquetaConIva: "Pala frontal",
    conIvaCentavos: pala.precioCentavos,
  };
}
