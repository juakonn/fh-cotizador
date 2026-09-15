import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/pdf/route";
import { normalizarCatalogo } from "@/lib/catalogo/normalizar";
import { ErrorCatalogo } from "@/lib/catalogo/shopify";
import { type Borrador, crearBorradorVacio, crearEmisorPorDefecto } from "@/lib/cotizacion/tipos";
import { type Dependencias, generarPdf } from "@/lib/pdf/generar";

const catalogo = normalizarCatalogo(
  JSON.parse(readFileSync("tests/fixtures/productos-shopify.json", "utf8")),
);
const FARMTRAC = 50605744423200;
const foto = readFileSync("tests/fixtures/foto.jpg");

function deps(extra: Partial<Dependencias> = {}): Dependencias {
  return {
    obtenerCatalogo: async () => catalogo,
    fetchImagen: async () => new Response(foto, { headers: { "content-type": "image/jpeg" } }),
    ahora: () => new Date("2026-09-11T15:00:00Z"),
    leerAsset: async (nombre) => readFileSync(`src/lib/pdf/assets/${nombre}`),
    ...extra,
  };
}

function cotizacion(precioVistoCentavos = 1790000): Borrador {
  return {
    ...crearBorradorVacio(),
    items: [
      {
        productoId: FARMTRAC,
        cantidad: 1,
        descuento: null,
        lineasOcultas: [],
        mostrarFoto: true,
        precioVistoCentavos,
      },
    ],
    entrega: { tipo: "dias", dias: 30 },
  };
}

const emisor = crearEmisorPorDefecto();

describe("generarPdf", () => {
  it("genera el PDF y su nombre de archivo", async () => {
    const r = await generarPdf({ borrador: cotizacion(), emisor }, deps());
    if (!r.ok) throw new Error(r.mensaje);
    expect(r.pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(r.nombre).toBe(
      "Cotización - Sin cliente - Farmtrac FT 6050 - 50HP - 4x4 - 2026-09-11.pdf",
    );
  });
  it("400 si la solicitud no tiene el formato esperado", async () => {
    expect(await generarPdf({ hola: 1 }, deps())).toMatchObject({
      ok: false,
      estado: 400,
      codigo: "SOLICITUD_INVALIDA",
    });
  });
  it("422 si falta el plazo de entrega, sin leer el catálogo", async () => {
    let leido = false;
    const borrador = { ...cotizacion(), entrega: null };
    const r = await generarPdf(
      { borrador, emisor },
      deps({
        obtenerCatalogo: async () => {
          leido = true;
          return catalogo;
        },
      }),
    );
    expect(r).toMatchObject({ ok: false, estado: 422, codigo: "BORRADOR_INCOMPLETO" });
    expect(leido).toBe(false);
  });
  it("409 PRECIO_CAMBIO si el precio de la web cambió desde que se armó", async () => {
    const r = await generarPdf({ borrador: cotizacion(1700000), emisor }, deps());
    expect(r).toMatchObject({
      ok: false,
      estado: 409,
      codigo: "PRECIO_CAMBIO",
      detalle: [{ productoId: FARMTRAC, antesCentavos: 1700000, ahoraCentavos: 1790000 }],
    });
  });
  it("409 PRODUCTO_NO_DISPONIBLE si el producto ya no está en la web", async () => {
    const r = await generarPdf(
      { borrador: cotizacion(), emisor },
      deps({ obtenerCatalogo: async () => [] }),
    );
    expect(r).toMatchObject({ ok: false, estado: 409, codigo: "PRODUCTO_NO_DISPONIBLE" });
  });
  it("502 si la web de Shopify no responde", async () => {
    const r = await generarPdf(
      { borrador: cotizacion(), emisor },
      deps({
        obtenerCatalogo: async () => {
          throw new ErrorCatalogo("SHOPIFY_NO_DISPONIBLE", "sin conexión");
        },
      }),
    );
    expect(r).toMatchObject({ ok: false, estado: 502, codigo: "SHOPIFY_NO_DISPONIBLE" });
  });
  it("si una foto no se puede bajar, igual genera el PDF", async () => {
    const r = await generarPdf(
      { borrador: cotizacion(), emisor },
      deps({ fetchImagen: async () => new Response("no", { status: 404 }) }),
    );
    expect(r.ok).toBe(true);
  });
});

describe("POST /api/pdf", () => {
  it("400 con un cuerpo que no es JSON", async () => {
    const r = await POST(new Request("http://localhost/api/pdf", { method: "POST", body: "{x" }));
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({
      error: { codigo: "SOLICITUD_INVALIDA", mensaje: "El cuerpo de la solicitud no es JSON" },
    });
  });
  it("422 con el sobre de error cuando falta información", async () => {
    const cuerpo = JSON.stringify({ borrador: crearBorradorVacio(), emisor });
    const r = await POST(new Request("http://localhost/api/pdf", { method: "POST", body: cuerpo }));
    expect(r.status).toBe(422);
    const json = await r.json();
    expect(json.error.codigo).toBe("BORRADOR_INCOMPLETO");
    expect(json.error.mensaje).toBe("Agregá al menos un producto. Elegí el plazo de entrega");
  });
});
