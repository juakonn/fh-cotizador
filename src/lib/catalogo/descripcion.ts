import { aWinAnsi } from "./winansi";

export type Linea = {
  id: string;
  tipo: "titulo" | "item" | "parrafo";
  texto: string;
  importante: boolean;
};

const ENTIDADES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  aacute: "á",
  eacute: "é",
  iacute: "í",
  oacute: "ó",
  uacute: "ú",
  Aacute: "Á",
  Eacute: "É",
  Iacute: "Í",
  Oacute: "Ó",
  Uacute: "Ú",
  ntilde: "ñ",
  Ntilde: "Ñ",
  uuml: "ü",
  Uuml: "Ü",
  iquest: "¿",
  iexcl: "¡",
  deg: "°",
  ordm: "º",
  ordf: "ª",
  laquo: "«",
  raquo: "»",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  ldquo: "“",
  rdquo: "”",
  lsquo: "‘",
  rsquo: "’",
  bull: "•",
  times: "×",
  frac12: "½",
  sup2: "²",
  sup3: "³",
};

// Se descartan siempre: llamados a la acción, financiación (ya va al pie) y precios escritos a mano
// en la descripción (el precio vale solo el de Shopify).
const DESCARTAR =
  /whatsapp|consult[aá]|escrib[ií]nos|precalific|https?:|www\.|financi|cuotas|mi maquinaria|santander|u\$s|\busd\b|\bcontado\b/i;

// Secciones de venta: sus líneas quedan con importante=false (ocultas por defecto en el PDF).
const SECCION_DE_VENTA = /ideal para|por qu[eé]|respaldo|garant[ií]a|beneficio|ventaja|servicio/i;

// Marcas internas: caracteres de control que aWinAnsi elimina solos.
const MARCA_TITULO = String.fromCharCode(1);
const MARCA_ITEM = String.fromCharCode(2);

function decodificar(texto: string): string {
  return texto.replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi, (original, entidad: string) => {
    if (entidad.startsWith("#")) {
      const hex = entidad[1] === "x" || entidad[1] === "X";
      const cp = hex
        ? Number.parseInt(entidad.slice(2), 16)
        : Number.parseInt(entidad.slice(1), 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : "";
    }
    return ENTIDADES[entidad] ?? original;
  });
}

export function limpiarDescripcion(html: string): Linea[] {
  if (!html) return [];
  const marcado = html
    .replace(/<h[1-6]\b[^>]*>/gi, `\n${MARCA_TITULO}`)
    .replace(/<li\b[^>]*>/gi, `\n${MARCA_ITEM}`)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(
      /<\/?(p|div|ul|ol|li|h[1-6]|tr|td|th|table|tbody|thead|section|blockquote)\b[^>]*>/gi,
      "\n",
    )
    .replace(/<[^>]+>/g, "");
  const lineas: Linea[] = [];
  let pendiente: Linea["tipo"] | null = null;
  let enSeccionDeVenta = false;
  for (const cruda of decodificar(marcado).split("\n")) {
    if (cruda.includes(MARCA_TITULO)) pendiente = "titulo";
    else if (cruda.includes(MARCA_ITEM)) pendiente = "item";
    const texto = aWinAnsi(cruda)
      .replace(/^[•·*-]+\s*/, "")
      .trim();
    if (texto.length < 2) continue;
    if (DESCARTAR.test(texto)) {
      pendiente = null;
      continue;
    }
    const tipo = pendiente ?? "parrafo";
    if (tipo === "titulo") enSeccionDeVenta = SECCION_DE_VENTA.test(texto);
    lineas.push({ id: `L${lineas.length + 1}`, tipo, texto, importante: !enSeccionDeVenta });
    pendiente = null;
  }
  return lineas;
}
