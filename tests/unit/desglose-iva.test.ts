import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizarCatalogo, type Producto } from "@/lib/catalogo/normalizar";
import { sugerirDesgloseIva } from "@/lib/cotizacion/desgloseIva";

const catalogo = normalizarCatalogo(
  JSON.parse(readFileSync("tests/fixtures/productos-shopify.json", "utf8")),
);
const buscar = (texto: string): Producto => {
  const p = catalogo.find((x) => x.titulo.includes(texto));
  if (!p) throw new Error(`falta ${texto} en el fixture`);
  return p;
};

describe("sugerirDesgloseIva", () => {
  it("reparte el combo entre el tractor exento y la pala con IVA", () => {
    const combo = buscar("DF 554 con Pala frontal");
    const pala = buscar("Palas frontales para DF 554");
    expect(sugerirDesgloseIva(combo, catalogo)).toEqual({
      etiquetaExento: "Tractor",
      exentoCentavos: combo.precioCentavos - pala.precioCentavos,
      etiquetaConIva: "Pala frontal",
      conIvaCentavos: pala.precioCentavos,
    });
  });
  it("un tractor solo o una herramienta no llevan reparto", () => {
    expect(sugerirDesgloseIva(buscar("Farmtrac FT 6050"), catalogo)).toBeNull();
    expect(sugerirDesgloseIva(buscar("Retroexcavadora LW-6"), catalogo)).toBeNull();
  });
  it("sin la pala de ese modelo en el catálogo no inventa el reparto", () => {
    const combo = buscar("DF 554 con Pala frontal");
    const sinPalas = catalogo.filter((p) => !/palas? frontal/i.test(p.titulo));
    expect(sugerirDesgloseIva(combo, sinPalas)).toBeNull();
  });
});
