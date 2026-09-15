import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizarCatalogo, type Producto } from "@/lib/catalogo/normalizar";
import { aplicar } from "@/lib/cotizacion/reducer";
import { type Borrador, crearBorradorVacio } from "@/lib/cotizacion/tipos";
import { interpretar } from "@/lib/interprete/interpretar";

const catalogo = normalizarCatalogo(
  JSON.parse(readFileSync("tests/fixtures/productos-shopify.json", "utf8")),
);

const DF554 = 46732183077152; // Dong Feng DF 554 G3 - 55HP 4x4 (U$S 17.300)
const DF554_CABINA = 45523976487200; // Dong Feng DF 554 G3 con cabina
const PALA_554 = 50404913873184; // Palas frontales para DF 554 (U$S 7.300)
const PALA_554_CABINA = 50892279316768; // Palas frontales para DF 554 cabina
const PALA_904 = 48570276970784;
const PALA_CAJON = 48058042155296;
const PALA_NIVELADORA = 47450481099040;
const COMBO_554 = 50892293308704; // Dong Feng DF 554 con Pala frontal
const RETRO = 49362879217952;
const FARMTRAC = 50605744423200;

function producto(id: number): Producto {
  const p = catalogo.find((x) => x.id === id);
  if (!p) throw new Error(`falta el producto ${id} en el fixture`);
  return p;
}

function conItems(...ids: number[]): Borrador {
  return ids.reduce(
    (b, id) => aplicar(b, { tipo: "agregar", producto: producto(id), cantidad: 1 }),
    crearBorradorVacio(),
  );
}

function ok(texto: string, borrador: Borrador = crearBorradorVacio()) {
  const r = interpretar(texto, { borrador, catalogo });
  if (r.estado !== "ok") throw new Error(`esperaba ok para «${texto}»: ${JSON.stringify(r)}`);
  return r;
}

describe("agregar productos", () => {
  it("«agregale la pala» con un DF 554 elige la pala del 554 sin cabina", () => {
    const r = ok("agregale la pala", conItems(DF554));
    expect(r.acciones).toHaveLength(1);
    expect(r.acciones[0]).toMatchObject({
      tipo: "agregar",
      cantidad: 1,
      producto: { id: PALA_554 },
    });
    expect(r.resumen).toEqual(["Agregué Palas frontales para DF 554 (U$S 7.300)"]);
  });
  it("con el DF 554 con cabina elige la pala para cabina", () => {
    const r = ok("agregale la pala", conItems(DF554_CABINA));
    expect(r.acciones[0]).toMatchObject({ tipo: "agregar", producto: { id: PALA_554_CABINA } });
  });
  it("sin tractor en la cotización pregunta cuál pala, con hasta 6 opciones", () => {
    const r = interpretar("agregá la pala", { borrador: crearBorradorVacio(), catalogo });
    expect(r.estado).toBe("elegir");
    if (r.estado !== "elegir") return;
    expect(r.pregunta).toBe("¿Cuál querés agregar?");
    const ids = r.opciones.map((o) => {
      const accion = o.acciones[0];
      return accion.tipo === "agregar" ? accion.producto.id : 0;
    });
    expect(new Set(ids)).toEqual(
      new Set([PALA_554, PALA_554_CABINA, PALA_904, PALA_CAJON, PALA_NIVELADORA, COMBO_554]),
    );
  });
  it("encuentra la retro por el comienzo de la palabra", () => {
    expect(ok("agregá la retro").acciones[0]).toMatchObject({ producto: { id: RETRO } });
  });
  it("agrega dos productos separados por «y»", () => {
    const r = ok("agregá la retro y la pala niveladora");
    expect(r.acciones.map((a) => (a.tipo === "agregar" ? a.producto.id : 0))).toEqual([
      RETRO,
      PALA_NIVELADORA,
    ]);
  });
  it("sin verbo, agrega solo si hay un único producto que coincide", () => {
    expect(ok("farmtrac 6050").acciones[0]).toMatchObject({ producto: { id: FARMTRAC } });
  });
  it("avisa cuando el producto no está en el catálogo", () => {
    const r = interpretar("agregá la sembradora", { borrador: crearBorradorVacio(), catalogo });
    expect(r).toEqual({
      estado: "no-entendi",
      mensaje: "No encontré «la sembradora» en el catálogo",
    });
  });
});

describe("descuentos y precio final", () => {
  it("«5% de descuento» es un descuento general", () => {
    const r = ok("5% de descuento", conItems(DF554));
    expect(r.acciones).toEqual([
      { tipo: "descuentoGeneral", descuento: { tipo: "porcentaje", valor: 5 } },
    ]);
    expect(r.resumen).toEqual(["Descuento general 5%"]);
  });
  it("«descuento de 500 dólares» es un monto en centavos", () => {
    expect(ok("descuento de 500 dólares", conItems(DF554)).acciones).toEqual([
      { tipo: "descuentoGeneral", descuento: { tipo: "monto", centavos: 50000 } },
    ]);
  });
  it("«5% en el tractor» descuenta solo el tractor", () => {
    expect(ok("5% en el tractor", conItems(DF554, PALA_554)).acciones).toEqual([
      { tipo: "descuentoItem", productoId: DF554, descuento: { tipo: "porcentaje", valor: 5 } },
    ]);
  });
  it("«dejalo en 23.000» calcula el descuento general que falta", () => {
    const r = ok("dejalo en 23.000", conItems(DF554, PALA_554));
    expect(r.acciones).toEqual([
      { tipo: "descuentoGeneral", descuento: { tipo: "monto", centavos: 160000 } },
    ]);
    expect(r.resumen).toEqual(["Precio final U$S 23.000"]);
  });
  it("un precio final mayor al subtotal no se aplica", () => {
    const r = interpretar("dejalo en 30.000", { borrador: conItems(DF554, PALA_554), catalogo });
    expect(r).toEqual({
      estado: "no-entendi",
      mensaje: "El precio final tiene que ser menor que el subtotal (U$S 24.600)",
    });
  });
  it("«sin descuento» borra el descuento general", () => {
    expect(ok("sin descuento").acciones).toEqual([{ tipo: "descuentoGeneral", descuento: null }]);
  });
});

describe("condiciones y documento", () => {
  it("cambia la validez", () => {
    expect(ok("cambiá la validez a 15 días").acciones).toEqual([{ tipo: "validez", dias: 15 }]);
  });
  it("entrega inmediata y entrega en días", () => {
    expect(ok("entrega inmediata").acciones).toEqual([
      { tipo: "entrega", entrega: { tipo: "inmediata" } },
    ]);
    expect(ok("entrega en 30 días").acciones).toEqual([
      { tipo: "entrega", entrega: { tipo: "dias", dias: 30 } },
    ]);
  });
  it("«hacela proforma» cambia el tipo de documento", () => {
    expect(ok("hacela proforma").acciones).toEqual([{ tipo: "tipoDocumento", valor: "proforma" }]);
  });
});

describe("cliente", () => {
  it("empresa con RUT, respetando mayúsculas", () => {
    const r = ok("cliente Agro Ejemplo S.A. rut 211234560019");
    expect(r.acciones).toEqual([
      {
        tipo: "cliente",
        cliente: { tipo: "empresa", razonSocial: "Agro Ejemplo S.A.", rut: "211234560019" },
      },
    ]);
    expect(r.resumen).toEqual(["Cliente: Agro Ejemplo S.A. (RUT 211234560019)"]);
  });
  it("persona con cédula", () => {
    const r = ok("cliente Juan Pérez cédula 1.234.567-2");
    expect(r.acciones).toEqual([
      { tipo: "cliente", cliente: { tipo: "persona", nombre: "Juan Pérez", cedula: "12345672" } },
    ]);
    expect(r.resumen).toEqual(["Cliente: Juan Pérez (C.I. 1.234.567-2)"]);
  });
});

describe("quitar y cantidad", () => {
  it("«sacá la pala» quita la pala de la cotización", () => {
    expect(ok("sacá la pala", conItems(DF554, PALA_554)).acciones).toEqual([
      { tipo: "quitar", productoId: PALA_554 },
    ]);
  });
  it("«2 unidades de la pala» cambia la cantidad", () => {
    expect(ok("2 unidades de la pala", conItems(DF554, PALA_554)).acciones).toEqual([
      { tipo: "cantidad", productoId: PALA_554, cantidad: 2 },
    ]);
  });
});

describe("frases combinadas", () => {
  it("coma y «y» separan pedidos", () => {
    const r = ok("agregá la retro, validez 15 días");
    expect(r.acciones.map((a) => a.tipo)).toEqual(["agregar", "validez"]);
  });
  it("«agregale la pala y 5% de descuento» aplica las dos cosas", () => {
    const r = ok("agregale la pala y 5% de descuento", conItems(DF554));
    expect(r.acciones.map((a) => a.tipo)).toEqual(["agregar", "descuentoGeneral"]);
  });
  it("una frase que no entiende no aplica nada", () => {
    const r = interpretar("hola que tal", { borrador: crearBorradorVacio(), catalogo });
    expect(r).toEqual({ estado: "no-entendi", mensaje: "No entendí: «hola que tal»" });
  });
});
