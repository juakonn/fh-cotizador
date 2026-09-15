import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { limpiarDescripcion } from "@/lib/catalogo/descripcion";
import { normalizarCatalogo, urlImagenPdf } from "@/lib/catalogo/normalizar";
import { ErrorCatalogo, type FetchCatalogo, obtenerCatalogo } from "@/lib/catalogo/shopify";
import { aWinAnsi } from "@/lib/catalogo/winansi";

const crudo = JSON.parse(readFileSync("tests/fixtures/productos-shopify.json", "utf8"));
const catalogo = normalizarCatalogo(crudo);
const porId = (id: number) => catalogo.find((p) => p.id === id);

describe("aWinAnsi", () => {
  it("conserva acentos, ñ, ×, comillas tipográficas y viñetas", () => {
    expect(aWinAnsi("Tracción 4×4 “Ñandú” • ok")).toBe("Tracción 4×4 “Ñandú” • ok");
  });
  it("quita emojis, cambia flechas por guion y colapsa espacios", () => {
    expect(aWinAnsi("🎯  Ideal para →")).toBe("Ideal para -");
  });
});

describe("limpiarDescripcion", () => {
  it("devuelve una lista vacía para html vacío", () => {
    expect(limpiarDescripcion("")).toEqual([]);
  });
  it("decodifica entidades y distingue párrafos de ítems", () => {
    expect(limpiarDescripcion("<p>Hola&nbsp;&amp; chau</p><ul><li>Uno</li></ul>")).toEqual([
      { id: "L1", tipo: "parrafo", texto: "Hola & chau", importante: true },
      { id: "L2", tipo: "item", texto: "Uno", importante: true },
    ]);
  });
  it("marca como no importantes las secciones de venta y deja la ficha técnica", () => {
    const html =
      "<p>Intro</p><h3>Ideal para</h3><ul><li>Chacras</li></ul><h3>Ficha técnica</h3><ul><li>Peso: 550 kg</li></ul><h3>El respaldo Florencio Hernández</h3><p>65 años</p>";
    expect(limpiarDescripcion(html).map((l) => [l.texto, l.importante])).toEqual([
      ["Intro", true],
      ["Ideal para", false],
      ["Chacras", false],
      ["Ficha técnica", true],
      ["Peso: 550 kg", true],
      ["El respaldo Florencio Hernández", false],
      ["65 años", false],
    ]);
  });
  it("descarta precios escritos a mano en la descripción", () => {
    const lineas = limpiarDescripcion("<p>Tanque 800 lts</p><p>CONTADO U$S 2610</p>");
    expect(lineas.map((l) => l.texto)).toEqual(["Tanque 800 lts"]);
  });
  it("limpia la descripción real del Farmtrac 6050", () => {
    const lineas = porId(50605744423200)?.lineas ?? [];
    expect(lineas.length).toBeGreaterThan(3);
    expect(lineas.map((l) => l.id)).toEqual(lineas.map((_, i) => `L${i + 1}`));
    expect(lineas.some((l) => l.texto.includes("50 HP"))).toBe(true);
    expect(lineas.some((l) => l.tipo === "item")).toBe(true);
    for (const l of lineas) {
      expect(aWinAnsi(l.texto)).toBe(l.texto);
      expect(l.texto).not.toMatch(/whatsapp|financi|santander|cuotas|precalific/i);
    }
  });
});

describe("normalizarCatalogo", () => {
  it("excluye los productos sin precio (tutoriales)", () => {
    expect(catalogo.some((p) => p.titulo.startsWith("Tutorial"))).toBe(false);
    expect(catalogo.every((p) => p.precioCentavos > 0)).toBe(true);
  });
  it("usa la variante como id y el precio en centavos", () => {
    expect(porId(50605744423200)).toMatchObject({
      productoId: 10028189352224,
      titulo: "Farmtrac FT 6050 - 50HP - 4x4",
      precioCentavos: 1790000,
      ivaIncluido: false,
      sospechaIva: false,
      esRepuesto: false,
    });
  });
  it("lee el IVA de la etiqueta iva-incluido", () => {
    expect(porId(50404913873184)).toMatchObject({ ivaIncluido: true, sospechaIva: false });
  });
  it("marca como sospechosos de IVA a palas frontales, palas cajón y retros sin etiqueta", () => {
    expect(porId(49362879217952)).toMatchObject({ ivaIncluido: false, sospechaIva: true });
    expect(porId(48058042155296)).toMatchObject({ ivaIncluido: false, sospechaIva: true });
    expect(porId(47450481099040)).toMatchObject({ sospechaIva: false });
  });
  it("marca los repuestos", () => {
    expect(catalogo.filter((p) => p.esRepuesto).length).toBeGreaterThan(0);
  });
  it("pide la foto a Shopify en JPG de 1000 px", () => {
    expect(urlImagenPdf("https://x/a.png?v=1")).toBe("https://x/a.png?v=1&width=1000&format=pjpg");
    expect(urlImagenPdf("https://x/a.webp")).toBe("https://x/a.webp?width=1000&format=pjpg");
    expect(porId(50605744423200)?.imagenUrl).toMatch(/&width=1000&format=pjpg$/);
  });
});

function respuestaJson(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { "content-type": "application/json" },
  });
}

describe("obtenerCatalogo", () => {
  it("pide la página 1 con limit=250 y normaliza", async () => {
    const urls: string[] = [];
    const fetchImpl: FetchCatalogo = async (url) => {
      urls.push(url);
      return respuestaJson(crudo);
    };
    const productos = await obtenerCatalogo({ fetchImpl });
    expect(urls).toEqual(["https://florenciohernandez.com.uy/products.json?limit=250&page=1"]);
    expect(productos).toEqual(catalogo);
  });
  it("sigue a la página 2 cuando la primera viene llena", async () => {
    const base = crudo.products[0];
    const llena = Array.from({ length: 250 }, (_, i) => ({
      ...base,
      id: 1000 + i,
      variants: [{ ...base.variants[0], id: 5000 + i }],
    }));
    const urls: string[] = [];
    const fetchImpl: FetchCatalogo = async (url) => {
      urls.push(url);
      return respuestaJson({
        products: url.endsWith("page=1") ? llena : crudo.products.slice(0, 2),
      });
    };
    const productos = await obtenerCatalogo({ fetchImpl });
    expect(urls).toHaveLength(2);
    expect(productos.length).toBe(252);
  });
  it("falla con SHOPIFY_NO_DISPONIBLE si la web responde error", async () => {
    const fetchImpl: FetchCatalogo = async () => respuestaJson({}, 503);
    await expect(obtenerCatalogo({ fetchImpl })).rejects.toMatchObject({
      name: "ErrorCatalogo",
      codigo: "SHOPIFY_NO_DISPONIBLE",
    });
    await expect(obtenerCatalogo({ fetchImpl })).rejects.toBeInstanceOf(ErrorCatalogo);
  });
});
