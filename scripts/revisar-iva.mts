// Lista qué productos tienen la etiqueta iva-incluido y cuáles parecen necesitarla.
// Uso: npm run iva:revisar            (lee la web)
//      npm run iva:revisar -- --fixture tests/fixtures/productos-shopify.json
import { readFileSync } from "node:fs";
import { normalizarCatalogo, type Producto } from "@/lib/catalogo/normalizar";
import { obtenerCatalogo } from "@/lib/catalogo/shopify";

function argumento(nombre: string): string | undefined {
  const i = process.argv.indexOf(nombre);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function cargar(): Promise<Producto[]> {
  const fixture = argumento("--fixture");
  if (fixture) return normalizarCatalogo(JSON.parse(readFileSync(fixture, "utf8")));
  return obtenerCatalogo();
}

const productos = await cargar();
const conIva = productos.filter((p) => p.ivaIncluido);
const sospechosos = productos.filter((p) => p.sospechaIva);
console.log(`Con la etiqueta iva-incluido (${conIva.length}):`);
for (const p of conIva) console.log(`  + ${p.titulo}`);
console.log(`Parecen llevar IVA pero no tienen la etiqueta (${sospechosos.length}):`);
for (const p of sospechosos) console.log(`  ! ${p.titulo}`);
console.log(
  sospechosos.length === 0
    ? "Todo en orden."
    : "Revisalos en Shopify y agregá la etiqueta iva-incluido a los que correspondan.",
);
