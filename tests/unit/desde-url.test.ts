import { describe, expect, it } from "vitest";
import { leerBorradorDeUrl, PARAMETRO } from "@/lib/cotizacion/desdeUrl";
import type { Borrador } from "@/lib/cotizacion/tipos";

const BORRADOR: Borrador = {
  version: 1,
  tipoDocumento: "cotizacion",
  cliente: { tipo: "empresa", razonSocial: "Intendencia de Cerro Largo", rut: "" },
  items: [
    {
      productoId: 10234324451616,
      cantidad: 1,
      descuento: null,
      lineasOcultas: [],
      mostrarFoto: true,
      precioVistoCentavos: 2290000,
      agregados: [],
      precioManualCentavos: null,
    },
  ],
  descuentoGeneral: null,
  validezDias: 30,
  entrega: null,
  notas: ["Licitación Abreviada 42/2026 — Intendencia de Cerro Largo"],
};

function aBase64Url(dato: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(dato));
  const binario = String.fromCharCode(...bytes);
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function conBorrador(dato: unknown): string {
  return `?${PARAMETRO}=${aBase64Url(dato)}`;
}

describe("cotización que llega armada en la dirección", () => {
  it("lee un borrador válido mandado desde el monitor de licitaciones", () => {
    const leido = leerBorradorDeUrl(conBorrador(BORRADOR));
    expect(leido).toEqual(BORRADOR);
  });

  it("conserva la referencia al llamado en las notas", () => {
    const leido = leerBorradorDeUrl(conBorrador(BORRADOR));
    expect(leido?.notas[0]).toContain("Licitación Abreviada 42/2026");
  });

  it("sin parámetro devuelve null y la app abre normal", () => {
    expect(leerBorradorDeUrl("")).toBeNull();
    expect(leerBorradorDeUrl("?otra=cosa")).toBeNull();
  });

  it("ignora un borrador que no cumple el esquema", () => {
    expect(leerBorradorDeUrl(conBorrador({ version: 1, items: "no es una lista" }))).toBeNull();
  });

  it("ignora base64 roto sin romper la app", () => {
    expect(leerBorradorDeUrl(`?${PARAMETRO}=%%%no-es-base64%%%`)).toBeNull();
  });

  it("ignora cantidades fuera de rango", () => {
    const malo = { ...BORRADOR, items: [{ ...BORRADOR.items[0], cantidad: 9999 }] };
    expect(leerBorradorDeUrl(conBorrador(malo))).toBeNull();
  });

  it("ignora un precio negativo", () => {
    const malo = {
      ...BORRADOR,
      items: [{ ...BORRADOR.items[0], precioManualCentavos: -100 }],
    };
    expect(leerBorradorDeUrl(conBorrador(malo))).toBeNull();
  });

  it("acepta tildes y eñes en el nombre del organismo", () => {
    const conEnie = {
      ...BORRADOR,
      cliente: { tipo: "empresa" as const, razonSocial: "Intendencia de Paysandú", rut: "" },
    };
    expect(leerBorradorDeUrl(conBorrador(conEnie))?.cliente).toEqual(conEnie.cliente);
  });
});
