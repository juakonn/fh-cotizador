import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Producto } from "@/lib/catalogo/normalizar";
import { obtenerCatalogo } from "@/lib/catalogo/shopify";
import { calcularTotales } from "@/lib/cotizacion/calculo";
import { esquemaSolicitudPdf } from "@/lib/cotizacion/esquema";
import { validarParaPdf } from "@/lib/cotizacion/validacion";
import { nombreArchivo } from "./archivo";
import { renderizarPdf } from "./documento";
import { descargarImagen, type ImagenPdf } from "./imagenes";

export type CodigoErrorPdf =
  | "SOLICITUD_INVALIDA"
  | "BORRADOR_INCOMPLETO"
  | "SHOPIFY_NO_DISPONIBLE"
  | "PRODUCTO_NO_DISPONIBLE"
  | "PRECIO_CAMBIO";

export type ResultadoGenerar =
  | { ok: true; pdf: Buffer; nombre: string }
  | { ok: false; estado: number; codigo: CodigoErrorPdf; mensaje: string; detalle?: unknown };

export type Dependencias = {
  obtenerCatalogo: () => Promise<Producto[]>;
  fetchImagen: typeof fetch;
  ahora: () => Date;
  leerAsset: (nombre: string) => Promise<Buffer>;
};

export function dependenciasReales(): Dependencias {
  return {
    obtenerCatalogo: () => obtenerCatalogo(),
    fetchImagen: fetch,
    ahora: () => new Date(),
    leerAsset: (nombre) => readFile(path.join(process.cwd(), "src/lib/pdf/assets", nombre)),
  };
}

export async function generarPdf(cuerpo: unknown, deps: Dependencias): Promise<ResultadoGenerar> {
  const solicitud = esquemaSolicitudPdf.safeParse(cuerpo);
  if (!solicitud.success) {
    return {
      ok: false,
      estado: 400,
      codigo: "SOLICITUD_INVALIDA",
      mensaje: "Los datos de la cotización no tienen el formato esperado",
      detalle: solicitud.error.issues.map((i) => ({ ruta: i.path.join("."), mensaje: i.message })),
    };
  }
  const { borrador, emisor } = solicitud.data;
  const problemas = validarParaPdf(borrador);
  if (problemas.length > 0) {
    return {
      ok: false,
      estado: 422,
      codigo: "BORRADOR_INCOMPLETO",
      mensaje: problemas.map((p) => p.mensaje).join(". "),
      detalle: problemas,
    };
  }
  let catalogo: Producto[];
  try {
    catalogo = await deps.obtenerCatalogo();
  } catch {
    return {
      ok: false,
      estado: 502,
      codigo: "SHOPIFY_NO_DISPONIBLE",
      mensaje: "No se pudo leer el catálogo de la web. Probá de nuevo en un rato.",
    };
  }
  const calculo = calcularTotales(borrador, catalogo);
  if (!calculo.ok) {
    return {
      ok: false,
      estado: 409,
      codigo: "PRODUCTO_NO_DISPONIBLE",
      mensaje: calculo.mensaje,
      detalle: { productoIds: calculo.productoIds },
    };
  }
  const porId = new Map(catalogo.map((p) => [p.id, p]));
  const cambios = borrador.items.flatMap((i) => {
    const p = porId.get(i.productoId);
    return p && p.precioCentavos !== i.precioVistoCentavos
      ? [
          {
            productoId: p.id,
            titulo: p.titulo,
            antesCentavos: i.precioVistoCentavos,
            ahoraCentavos: p.precioCentavos,
          },
        ]
      : [];
  });
  if (cambios.length > 0) {
    return {
      ok: false,
      estado: 409,
      codigo: "PRECIO_CAMBIO",
      mensaje: `Cambió el precio en la web de: ${cambios.map((c) => c.titulo).join(", ")}`,
      detalle: cambios,
    };
  }
  const fotos: Record<number, ImagenPdf | null> = {};
  await Promise.all(
    borrador.items.map(async (item) => {
      const url = porId.get(item.productoId)?.imagenUrl;
      fotos[item.productoId] =
        item.mostrarFoto && url ? await descargarImagen(url, deps.fetchImagen) : null;
    }),
  );
  const [membrete, logo] = await Promise.all([
    deps.leerAsset("membrete-fh-a4.jpg"),
    deps.leerAsset("mi-maquinaria.png"),
  ]);
  const fecha = deps.ahora();
  const pdf = await renderizarPdf({
    borrador,
    totales: calculo.totales,
    productos: catalogo,
    emisor,
    fecha,
    fotos,
    membrete: { data: membrete, format: "jpg" },
    logoPago: { data: logo, format: "png" },
  });
  const primerTitulo = calculo.totales.lineas[0]?.titulo ?? "";
  return {
    ok: true,
    pdf,
    nombre: nombreArchivo(borrador.tipoDocumento, borrador.cliente, primerTitulo, fecha),
  };
}
