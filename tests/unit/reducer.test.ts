import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizarCatalogo, type Producto } from "@/lib/catalogo/normalizar";
import {
  type Almacen,
  CLAVE_BORRADOR,
  guardarBorrador,
  guardarEmisor,
  leerBorrador,
  leerEmisor,
} from "@/lib/cotizacion/persistencia";
import { aplicar, conHistorial, crearHistorial, deshacer } from "@/lib/cotizacion/reducer";
import { crearBorradorVacio, crearEmisorPorDefecto } from "@/lib/cotizacion/tipos";

const catalogo = normalizarCatalogo(
  JSON.parse(readFileSync("tests/fixtures/productos-shopify.json", "utf8")),
);

function producto(id: number): Producto {
  const p = catalogo.find((x) => x.id === id);
  if (!p) throw new Error(`falta el producto ${id} en el fixture`);
  return p;
}

const FARMTRAC = producto(50605744423200);
const PALA = producto(50404913873184);

function almacenFalso(): Almacen {
  const datos = new Map<string, string>();
  return {
    getItem: (clave) => datos.get(clave) ?? null,
    setItem: (clave, valor) => {
      datos.set(clave, valor);
    },
    removeItem: (clave) => {
      datos.delete(clave);
    },
  };
}

describe("aplicar", () => {
  it("agregar dos veces el mismo producto suma la cantidad y guarda el precio visto", () => {
    let b = aplicar(crearBorradorVacio(), { tipo: "agregar", producto: PALA, cantidad: 1 });
    b = aplicar(b, { tipo: "agregar", producto: PALA, cantidad: 1 });
    expect(b.items).toEqual([
      {
        productoId: PALA.id,
        cantidad: 2,
        descuento: null,
        lineasOcultas: [],
        mostrarFoto: true,
        precioVistoCentavos: 730000,
      },
    ]);
  });
  it("acota la cantidad a 1–99 y la validez a 1–365, y quita productos", () => {
    let b = aplicar(crearBorradorVacio(), { tipo: "agregar", producto: FARMTRAC, cantidad: 1 });
    b = aplicar(b, { tipo: "cantidad", productoId: FARMTRAC.id, cantidad: 500 });
    expect(b.items[0].cantidad).toBe(99);
    b = aplicar(b, { tipo: "validez", dias: 0 });
    expect(b.validezDias).toBe(1);
    b = aplicar(b, { tipo: "quitar", productoId: FARMTRAC.id });
    expect(b.items).toEqual([]);
  });
  it("oculta y vuelve a mostrar una línea de la descripción sin duplicarla", () => {
    let b = aplicar(crearBorradorVacio(), { tipo: "agregar", producto: FARMTRAC, cantidad: 1 });
    const deVenta = FARMTRAC.lineas.filter((l) => !l.importante).map((l) => l.id);
    expect(deVenta).toEqual(["L2", "L3", "L4", "L5", "L6", "L7", "L8", "L9", "L10", "L26", "L27"]);
    expect(b.items[0].lineasOcultas).toEqual(deVenta);
    const ocultar = { tipo: "ocultarLinea", productoId: FARMTRAC.id, lineaId: "L12" } as const;
    b = aplicar(b, { ...ocultar, oculta: true });
    b = aplicar(b, { ...ocultar, oculta: true });
    expect(b.items[0].lineasOcultas).toEqual([...deVenta, "L12"]);
    b = aplicar(b, { ...ocultar, oculta: false });
    expect(b.items[0].lineasOcultas).toEqual(deVenta);
  });
  it("actualizarPrecio acepta el precio nuevo de la web", () => {
    let b = aplicar(crearBorradorVacio(), { tipo: "agregar", producto: FARMTRAC, cantidad: 1 });
    b = aplicar(b, { tipo: "actualizarPrecio", productoId: FARMTRAC.id, precioCentavos: 1850000 });
    expect(b.items[0].precioVistoCentavos).toBe(1850000);
  });
  it("nuevo vuelve al borrador vacío", () => {
    const b = aplicar(crearBorradorVacio(), { tipo: "agregar", producto: FARMTRAC, cantidad: 1 });
    expect(aplicar(b, { tipo: "nuevo" })).toEqual(crearBorradorVacio());
  });
});

describe("historial", () => {
  it("varias acciones juntas se deshacen de una sola vez", () => {
    const h1 = conHistorial(crearHistorial(), [
      { tipo: "agregar", producto: FARMTRAC, cantidad: 1 },
      { tipo: "validez", dias: 15 },
    ]);
    expect(h1.actual.validezDias).toBe(15);
    const h2 = deshacer(h1);
    expect(h2.actual).toEqual(crearBorradorVacio());
    expect(deshacer(h2)).toEqual(h2);
  });
  it("guarda como máximo 30 pasos", () => {
    let h = crearHistorial();
    for (let dias = 1; dias <= 40; dias++) h = conHistorial(h, [{ tipo: "validez", dias }]);
    expect(h.pasado).toHaveLength(30);
    expect(h.actual.validezDias).toBe(40);
  });
});

describe("persistencia", () => {
  it("guarda y lee el borrador", () => {
    const almacen = almacenFalso();
    const b = aplicar(crearBorradorVacio(), { tipo: "agregar", producto: FARMTRAC, cantidad: 1 });
    guardarBorrador(almacen, b);
    expect(leerBorrador(almacen)).toEqual(b);
  });
  it("ignora un borrador corrupto o de otra versión", () => {
    const almacen = almacenFalso();
    almacen.setItem(CLAVE_BORRADOR, "{no es json");
    expect(leerBorrador(almacen)).toBeNull();
    almacen.setItem(CLAVE_BORRADOR, JSON.stringify({ version: 2 }));
    expect(leerBorrador(almacen)).toBeNull();
  });
  it("el emisor arranca con valores por defecto y se puede cambiar", () => {
    const almacen = almacenFalso();
    expect(leerEmisor(almacen)).toEqual(crearEmisorPorDefecto());
    guardarEmisor(almacen, {
      sucursal: "montevideo",
      vendedorNombre: "Ana",
      vendedorCelular: "099 123 456",
    });
    expect(leerEmisor(almacen).sucursal).toBe("montevideo");
  });
});
