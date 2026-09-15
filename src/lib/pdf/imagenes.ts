import sharp from "sharp";

export type FormatoImagen = "jpg" | "png";
export type ImagenPdf = { data: Buffer; format: FormatoImagen };

export function formatoImagen(datos: Uint8Array): FormatoImagen | null {
  if (datos[0] === 0xff && datos[1] === 0xd8 && datos[2] === 0xff) return "jpg";
  if (datos[0] === 0x89 && datos[1] === 0x50 && datos[2] === 0x4e && datos[3] === 0x47) {
    return "png";
  }
  return null;
}

// Shopify devuelve PNG de 1–2,5 MB cuando la foto tiene transparencia, aunque se pida JPG.
// Toda foto se recomprime acá: fondo blanco, 1000 px de ancho como máximo, JPG calidad 80.
export async function prepararImagen(datos: Uint8Array): Promise<ImagenPdf | null> {
  try {
    const data = await sharp(datos)
      .flatten({ background: "#ffffff" })
      .resize({ width: 1000, withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    return { data, format: "jpg" };
  } catch {
    return null;
  }
}

export async function descargarImagen(
  url: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 8000,
): Promise<ImagenPdf | null> {
  try {
    const respuesta = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!respuesta.ok) return null;
    return await prepararImagen(new Uint8Array(await respuesta.arrayBuffer()));
  } catch {
    return null;
  }
}
