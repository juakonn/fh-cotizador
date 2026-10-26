import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizarCatalogo } from "@/lib/catalogo/normalizar";
import { calcularDescuento, calcularPlanDePago, calcularTotales } from "@/lib/cotizacion/calculo";
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
    agregados: [],
    precioManualCentavos: null,
    desgloseIva: null,
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
  it("un cliente sin RUT se acepta, pero sin razón social no", () => {
    const base = { items: [item(FARMTRAC)], entrega: { tipo: "inmediata" as const } };
    const sinRut = borrador({
      ...base,
      cliente: {
        tipo: "empresa",
        razonSocial: "Asociación Uruguaya de Fútbol",
        rut: "",
        contacto: "",
        email: "",
      },
    });
    expect(validarParaPdf(sinRut)).toEqual([]);
    const sinNombre = borrador({
      ...base,
      cliente: { tipo: "empresa", razonSocial: "  ", rut: "", contacto: "", email: "" },
    });
    expect(validarParaPdf(sinNombre)).toEqual([
      { campo: "cliente", mensaje: "Falta la razón social" },
    ]);
  });
});

describe("advertencias", () => {
  it("avisa un RUT inválido sin bloquear el PDF", () => {
    const b = borrador({
      items: [item(FARMTRAC)],
      entrega: { tipo: "inmediata" },
      cliente: {
        tipo: "empresa",
        razonSocial: "Agro Ejemplo S.A.",
        rut: "211234560018",
        contacto: "",
        email: "",
      },
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

describe("precio puesto a mano", () => {
  it("el total usa el precio del vendedor y no el de la web", () => {
    const base = crearBorradorVacio();
    const borrador = {
      ...base,
      items: [
        {
          productoId: FARMTRAC,
          cantidad: 2,
          descuento: null,
          lineasOcultas: [],
          mostrarFoto: true,
          precioVistoCentavos: 1790000,
          agregados: [],
          precioManualCentavos: 1650000,
          desgloseIva: null,
        },
      ],
    };
    const r = calcularTotales(borrador, catalogo);
    if (!r.ok) throw new Error(r.mensaje);
    expect(r.totales.lineas[0].precioUnitarioCentavos).toBe(1650000);
    expect(r.totales.totalCentavos).toBe(3300000);
  });
});

describe("plan de pago", () => {
  it("reparte entrega y cuotas sin perder centavos", () => {
    const plan = calcularPlanDePago(440000, { entregaPorcentaje: 30, cuotas: 7 });
    if (!plan) throw new Error("falta el plan");
    expect(plan.entregaCentavos).toBe(132000);
    expect(plan.cuotaCentavos).toBe(44000);
    expect(plan.ultimaCuotaCentavos).toBe(44000);
    expect(plan.entregaCentavos + plan.cuotaCentavos * 6 + plan.ultimaCuotaCentavos).toBe(440000);
  });
  it("cuando no divide justo, la última cuota absorbe la diferencia", () => {
    const plan = calcularPlanDePago(100000, { entregaPorcentaje: 10, cuotas: 3 });
    if (!plan) throw new Error("falta el plan");
    expect(plan.entregaCentavos).toBe(10000);
    expect(plan.cuotaCentavos).toBe(30000);
    expect(plan.ultimaCuotaCentavos).toBe(30000);
    const plan2 = calcularPlanDePago(100001, { entregaPorcentaje: 0, cuotas: 3 });
    if (!plan2) throw new Error("falta el plan");
    expect(plan2.cuotaCentavos * 2 + plan2.ultimaCuotaCentavos).toBe(100001);
  });
  it("sin financiación no hay plan", () => {
    expect(calcularPlanDePago(440000, null)).toBeNull();
  });
});

describe("toma de máquinas", () => {
  it("resta las tomas del total y deja el saldo a pagar", () => {
    const b = borrador({
      items: [item(FARMTRAC)],
      entrega: { tipo: "inmediata" },
      tomas: [
        { detalle: "Tractor Ford 5000", centavos: 500000 },
        { detalle: "Rastra vieja", centavos: 90000 },
      ],
    });
    const r = calcularTotales(b, catalogo);
    if (!r.ok) throw new Error(r.mensaje);
    expect(r.totales.totalCentavos).toBe(1790000);
    expect(r.totales.tomaCentavos).toBe(590000);
    expect(r.totales.saldoCentavos).toBe(1200000);
  });
  it("sin tomas el saldo es igual al total", () => {
    const r = calcularTotales(borrador({ items: [item(FARMTRAC)] }), catalogo);
    if (!r.ok) throw new Error(r.mensaje);
    expect(r.totales.tomaCentavos).toBe(0);
    expect(r.totales.saldoCentavos).toBe(r.totales.totalCentavos);
  });
});
