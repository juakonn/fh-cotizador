import type { Producto } from "@/lib/catalogo/normalizar";
import { tokenizar } from "./texto";

const VACIAS = new Set([
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "de",
  "del",
  "para",
  "con",
  "y",
  "al",
  "a",
  "otra",
  "otro",
  "otros",
  "otras",
  "tambien",
  "mas",
  "le",
  "lo",
]);
const MARCAS = /^(dong feng|farmtrac|iseki|landtrac)\b/i;
const PIDE_MARCA = new Set([
  "dong",
  "feng",
  "farmtrac",
  "iseki",
  "landtrac",
  "tractor",
  "tractores",
]);
const PIDE_REPUESTO = new Set(["filtro", "filtros", "repuesto", "repuestos"]);

export type Candidato = { producto: Producto; puntaje: number };
export type Eleccion =
  | { tipo: "unico"; producto: Producto }
  | { tipo: "varios"; opciones: Producto[] }
  | { tipo: "ninguno" };

function raiz(token: string): string {
  return token.length > 4 ? token.replace(/(es|s)$/, "") : token;
}

export function tokensConsulta(consulta: string): string[] {
  return tokenizar(consulta).filter((t) => !VACIAS.has(t) && (t.length > 1 || /\d/.test(t)));
}

function coincide(consulta: string, producto: Producto, tokens: string[]): boolean {
  if (consulta === "tractor" || consulta === "tractores") return MARCAS.test(producto.titulo);
  if (/^\d/.test(consulta)) return tokens.includes(consulta);
  const q = raiz(consulta);
  return tokens.some((t) => raiz(t).startsWith(q));
}

export function buscarProductos(
  consulta: string,
  espacio: Producto[],
  contexto: { enBorrador: Producto[] } = { enBorrador: [] },
): Candidato[] {
  const consultas = tokensConsulta(consulta);
  if (consultas.length === 0) return [];
  const pideMarca = consultas.some((t) => PIDE_MARCA.has(t));
  const pideRepuesto = consultas.some((t) => PIDE_REPUESTO.has(t));
  const tractores = contexto.enBorrador.filter((p) => MARCAS.test(p.titulo));
  const hayTractor = tractores.length > 0;
  const modelos = new Set(
    tractores.flatMap((p) => tokenizar(p.titulo).filter((t) => /^\d{3,4}$/.test(t))),
  );
  const tractorConCabina = tractores.some((p) => tokenizar(p.titulo).includes("cabina"));
  const candidatos: Candidato[] = [];
  for (const producto of espacio) {
    const tokens = tokenizar(producto.titulo);
    if (!consultas.every((q) => coincide(q, producto, tokens))) continue;
    let puntaje = 100;
    if (producto.esRepuesto && !pideRepuesto) puntaje -= 50;
    if (hayTractor) {
      if (tokens.some((t) => modelos.has(t))) puntaje += 30;
      const tieneCabina = tokens.includes("cabina");
      if (tractorConCabina) puntaje += tieneCabina ? 10 : -10;
      else if (tieneCabina) puntaje -= 10;
      if (MARCAS.test(producto.titulo) && !pideMarca) puntaje -= 40;
    }
    candidatos.push({ producto, puntaje });
  }
  return candidatos.sort(
    (a, b) => b.puntaje - a.puntaje || a.producto.titulo.localeCompare(b.producto.titulo, "es"),
  );
}

export function elegir(candidatos: Candidato[]): Eleccion {
  const [primero, segundo] = candidatos;
  if (!primero) return { tipo: "ninguno" };
  if (!segundo || primero.puntaje - segundo.puntaje >= 10) {
    return { tipo: "unico", producto: primero.producto };
  }
  const opciones = candidatos
    .filter((c) => c.puntaje > primero.puntaje - 10)
    .slice(0, 6)
    .map((c) => c.producto);
  return { tipo: "varios", opciones };
}
