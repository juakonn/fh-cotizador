import { z } from "zod";
import { ETIQUETA_IVA_INCLUIDO } from "@/lib/config/negocio";
import { type Linea, limpiarDescripcion } from "./descripcion";
import { aWinAnsi } from "./winansi";

const esquemaVariante = z.object({
  id: z.number(),
  title: z.string(),
  price: z.string(),
  available: z.boolean().optional(),
});

const esquemaProducto = z.object({
  id: z.number(),
  title: z.string(),
  handle: z.string(),
  body_html: z.string().nullable().optional(),
  product_type: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  variants: z.array(esquemaVariante),
  images: z.array(z.object({ src: z.string() })).optional(),
});

export const esquemaRespuestaShopify = z.object({ products: z.array(esquemaProducto) });
export type ProductoShopify = z.infer<typeof esquemaProducto>;

export type Producto = {
  id: number;
  productoId: number;
  handle: string;
  titulo: string;
  precioCentavos: number;
  imagenUrl: string | null;
  lineas: Linea[];
  ivaIncluido: boolean;
  sospechaIva: boolean;
  esRepuesto: boolean;
};

const SOSPECHA_IVA = /\b(palas?\s+frontal(es)?|pala\s+cajon|retroexcavadora|chipeadora)/;

export function sinAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function urlImagenPdf(src: string): string {
  return `${src}${src.includes("?") ? "&" : "?"}width=1000&format=pjpg`;
}

export function normalizarProductos(productos: ProductoShopify[]): Producto[] {
  const salida: Producto[] = [];
  for (const p of productos) {
    const ivaIncluido = (p.tags ?? []).some(
      (t) => t.trim().toLowerCase() === ETIQUETA_IVA_INCLUIDO,
    );
    const lineas = limpiarDescripcion(p.body_html ?? "");
    const imagen = p.images?.[0]?.src ?? null;
    for (const v of p.variants) {
      const precioCentavos = Math.round(Number(v.price) * 100);
      if (!Number.isFinite(precioCentavos) || precioCentavos <= 0) continue;
      const base = aWinAnsi(p.title);
      const titulo =
        p.variants.length > 1 && v.title !== "Default Title"
          ? `${base} - ${aWinAnsi(v.title)}`
          : base;
      salida.push({
        id: v.id,
        productoId: p.id,
        handle: p.handle,
        titulo,
        precioCentavos,
        imagenUrl: imagen ? urlImagenPdf(imagen) : null,
        lineas,
        ivaIncluido,
        sospechaIva: !ivaIncluido && SOSPECHA_IVA.test(sinAcentos(titulo)),
        esRepuesto: (p.product_type ?? "").toLowerCase().startsWith("repuesto"),
      });
    }
  }
  return salida;
}

export function normalizarCatalogo(crudo: unknown): Producto[] {
  return normalizarProductos(esquemaRespuestaShopify.parse(crudo).products);
}
