import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizarCatalogo } from "@/lib/catalogo/normalizar";
import { calcularDescuento, calcularTotales } from "@/lib/cotizacion/calculo";
import { esquemaSolicitudPdf } from "@/lib/cotizacion/esquema";
import {
  type Borrador,
  crearBorradorVacio,
  crearEmisorPorDefecto,
  type Item,
} from "@/lib/cotizacion/tipos";
import { advertencias, validarParaPdf } from "@/lib/cotizacion/validacion";

const catalogo = normalizarCatalogo(
  JSON.parse(readFileSync("tests/fixtures/productos-shopify.json", "utf8")),
);
const FARMTRAC = 50605744423200; // U$S 17.900, exento
const PALA_554 = 50404913873184; // U$S 7.300, etiqueta iva-incluido
const RETRO = 49362879217952; // U$S 5.900, sin etiqueta: sospecha de IVA

function item(productoId: number, extra: Partial<Item> = {}): Item {
  return {
    productoId,
    cantidad: 1,
    descuento: null,
    lineasOcultas: [],
    mostrarFoto: true,
    precioVistoCentavos: 0,
    ...extra,
  };
}

function borrador(extra: Partial<Borrador> = {}): Borrador {
  return { ...crearBorradorVacio(), ...extra };
}

function totales(b: Borrador) {
  const r = calcularTotales(b, catalogo);
  if (!r.ok) throw new Error(r.mensaje);
  return r.totales;
}

describe("calcularDescuento", () => {
  it("porcentaje redondeado al centavo", () => {
    expect(calcularDescuento(730000, { tipo: "porcentaje", valor: 5 })).toBe(36500);
    expect(calcularDescuento(999, { tipo: "porcentaje", valor: 33.3 })).toBe(333);
  });
  it("monto con tope en la base", () => {
    expect(calcularDescuento(730000, { tipo: "monto", centavos: 1000000 })).toBe(730000);
  });
  it("sin descuento", () => {
    expect(calcularDescuento(730000, null)).toBe(0);
  });
});

describe("calcularTotales", () => {
  it("tractor exento más pala con IVA incluido: mixto", () => {
    expect(totales(borrador({ items: [item(FARMTRAC), item(PALA_554)] }))).toMatchObject({
      subtotalCentavos: 2520000,
      descuentoGeneralCentavos: 0,
      totalCentavos: 2520000,
      iva: "mixto",
    });
  });
  it("aplica el descuento por ítem antes que el general", () => {
    const t = totales(
      borrador({
        items: [item(FARMTRAC), item(PALA_554, { descuento: { tipo: "porcentaje", valor: 5 } })],
        descuentoGeneral: { tipo: "monto", centavos: 50000 },
      }),
    );
    expect(t.lineas[1]).toMatchObject({
      brutoCentavos: 730000,
      descuentoCentavos: 36500,
      netoCentavos: 693500,
    });
    expect(t).toMatchObject({
      subtotalCentavos: 2483500,
      descuentoGeneralCentavos: 50000,
      totalCentavos: 2433500,
    });
  });
  it("descuento general porcentual", () => {
    const b = borrador({
      items: [item(FARMTRAC), item(PALA_554)],
      descuentoGeneral: { tipo: "porcentaje", valor: 10 },
    });
    expect(totales(b).totalCentavos).toBe(2268000);
  });
  it("multiplica por la cantidad", () => {
    expect(totales(borrador({ items: [item(PALA_554, { cantidad: 2 })] }))).toMatchObject({
      totalCentavos: 1460000,
      iva: "incluido",
    });
  });
  it("solo exentos da exento; vacío da cero", () => {
    expect(totales(borrador({ items: [item(FARMTRAC)] })).iva).toBe("exento");
    expect(totales(borrador())).toMatchObject({ totalCentavos: 0, iva: "exento", lineas: [] });
  });
  it("avisa si un producto ya no está en la web", () => {
    expect(calcularTotales(borrador({ items: [item(FARMTRAC), item(1)] }), catalogo)).toMatchObject(
      {
        ok: false,
        codigo: "PRODUCTO_NO_DISPONIBLE",
        productoIds: [1],
      },
    );
  });
});

describe("validarParaPdf", () => {
  it("un borrador vacío pide productos y plazo de entrega", () => {
    expect(validarParaPdf(borrador()).map((p) => p.campo)).toEqual(["items", "entrega"]);
  });
  it("la factura proforma exige cliente", () => {
    const b = borrador({
      tipoDocumento: "proforma",
      items: [item(FARMTRAC)],
      entrega: { tipo: "inmediata" },
    });
    expect(validarParaPdf(b)).toEqual([
      { campo: "cliente", mensaje: "La factura proforma necesita los datos del cliente" },
    ]);
  });
  it("una cotización completa sin cliente no tiene problemas", () => {
    const b = borrador({ items: [item(FARMTRAC)], entrega: { tipo: "dias", dias: 30 } });
    expect(validarParaPdf(b)).toEqual([]);
  });
  it("un cliente empresa sin RUT es un problema", () => {
    const b = borrador({
      items: [item(FARMTRAC)],
      entrega: { tipo: "inmediata" },
      cliente: { tipo: "empresa", razonSocial: "Agro Ejemplo S.A.", rut: "" },
    });
    expect(validarParaPdf(b)).toEqual([{ campo: "cliente", mensaje: "Falta el RUT" }]);
  });
});

describe("advertencias", () => {
  it("avisa un RUT inválido sin bloquear el PDF", () => {
    const b = borrador({
      items: [item(FARMTRAC)],
      entrega: { tipo: "inmediata" },
      cliente: { tipo: "empresa", razonSocial: "Agro Ejemplo S.A.", rut: "211234560018" },
    });
    expect(validarParaPdf(b)).toEqual([]);
    expect(advertencias(b, catalogo)).toEqual([
      { campo: "cliente", mensaje: "Revisá el RUT: El dígito verificador del RUT no coincide" },
    ]);
  });
  it("avisa productos que parecen llevar IVA sin la etiqueta", () => {
    expect(advertencias(borrador({ items: [item(RETRO)] }), catalogo)).toEqual([
      {
        campo: "items",
        mensaje:
          "«Retroexcavadora LW-6» parece llevar IVA pero no tiene la etiqueta iva-incluido en Shopify",
      },
    ]);
  });
});

describe("esquemaSolicitudPdf", () => {
  it("acepta una solicitud válida", () => {
    const solicitud = {
      borrador: borrador({
        items: [item(FARMTRAC, { precioVistoCentavos: 1790000 })],
        entrega: { tipo: "inmediata" },
      }),
      emisor: crearEmisorPorDefecto(),
    };
    expect(esquemaSolicitudPdf.safeParse(solicitud).success).toBe(true);
  });
  it("rechaza cantidad 0 y un porcentaje mayor a 100", () => {
    const emisor = crearEmisorPorDefecto();
    const cantidadCero = {
      borrador: borrador({ items: [item(FARMTRAC, { cantidad: 0 })] }),
      emisor,
    };
    const porcentaje = {
      borrador: borrador({ descuentoGeneral: { tipo: "porcentaje", valor: 150 } }),
      emisor,
    };
    expect(esquemaSolicitudPdf.safeParse(cantidadCero).success).toBe(false);
    expect(esquemaSolicitudPdf.safeParse(porcentaje).success).toBe(false);
  });
});
