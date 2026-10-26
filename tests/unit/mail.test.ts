import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizarCatalogo } from "@/lib/catalogo/normalizar";
import { calcularTotales } from "@/lib/cotizacion/calculo";
import { armarMail } from "@/lib/cotizacion/mail";
import { aplicar } from "@/lib/cotizacion/reducer";
import { type Borrador, crearBorradorVacio, type Emisor } from "@/lib/cotizacion/tipos";

const catalogo = normalizarCatalogo(
  JSON.parse(readFileSync("tests/fixtures/productos-shopify.json", "utf8")),
);
function buscarFarmtrac() {
  const p = catalogo.find((x) => x.titulo.startsWith("Farmtrac FT 6050"));
  if (!p) throw new Error("falta el Farmtrac en el fixture");
  return p;
}
const farmtrac = buscarFarmtrac();
const emisor: Emisor = {
  sucursal: "san-jacinto",
  vendedorNombre: "Joaquín",
  vendedorCelular: "092 469 449",
};

function conProducto(extra: Partial<Borrador> = {}): Borrador {
  const base = {
    ...crearBorradorVacio(),
    entrega: { tipo: "inmediata" as const },
    ...extra,
  };
  return aplicar(base, { tipo: "agregar", producto: farmtrac, cantidad: 2 });
}

function mailDe(borrador: Borrador) {
  const r = calcularTotales(borrador, catalogo);
  if (!r.ok) throw new Error(r.mensaje);
  return armarMail(borrador, r.totales, emisor, "092 469 449");
}

describe("armarMail", () => {
  it("escribe el saludo, los productos, el total y la firma", () => {
    const mail = mailDe(
      conProducto({
        cliente: {
          tipo: "empresa",
          razonSocial: "Agro Ejemplo S.A.",
          rut: "211234560019",
          contacto: "",
          email: "compras@agroejemplo.com",
        },
      }),
    );
    expect(mail.para).toBe("compras@agroejemplo.com");
    expect(mail.asunto).toBe("Cotización Florencio Hernández - Farmtrac FT 6050 - 50HP - 4x4");
    expect(mail.cuerpo).toContain("Hola, Agro Ejemplo S.A.:");
    expect(mail.cuerpo).toContain("- 2 x Farmtrac FT 6050 - 50HP - 4x4: U$S 35.800");
    expect(mail.cuerpo).toContain("Total: U$S 35.800");
    expect(mail.cuerpo).toContain("Validez de la oferta: 30 días.");
    expect(mail.cuerpo).toContain("Entrega inmediata.");
    expect(mail.cuerpo).toContain(
      "Forma de pago: contado o financiado con Mi Maquinaria by Santander.",
    );
    expect(mail.cuerpo).toContain("Cualquier consulta quedo a las órdenes.");
    expect(mail.cuerpo).toContain("Joaquín");
    expect(mail.cuerpo).toContain("Cel. 092 469 449");
    expect(mail.enlace.startsWith("mailto:compras%40agroejemplo.com?subject=")).toBe(true);
  });
  it("con toma y cuotas escribe el saldo y el plan", () => {
    const mail = mailDe(
      conProducto({
        tomas: [{ detalle: "Tractor Ford 5000", centavos: 580000 }],
        financiacion: { entregaPorcentaje: 50, cuotas: 5 },
      }),
    );
    expect(mail.cuerpo).toContain("Toma de Tractor Ford 5000: U$S 5.800");
    expect(mail.cuerpo).toContain("Saldo a pagar: U$S 30.000");
    expect(mail.cuerpo).toContain("entrega de 50% (U$S 15.000) y 5 cuotas de U$S 3.000.");
  });
  it("sin cliente saluda igual y deja el destinatario vacío", () => {
    const mail = mailDe(conProducto());
    expect(mail.para).toBe("");
    expect(mail.cuerpo.startsWith("Hola:")).toBe(true);
    expect(mail.enlace.startsWith("mailto:?subject=")).toBe(true);
  });
});
