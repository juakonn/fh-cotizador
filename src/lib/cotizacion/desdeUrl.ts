import { esquemaBorrador } from "./esquema";
import type { Borrador } from "./tipos";

/**
 * Lee una cotización que viene armada en la dirección, para abrir el cotizador
 * con todo cargado desde otro lado.
 *
 * Lo usa el monitor de licitaciones: cuando aparece un llamado del Estado que
 * nos sirve, el mail trae un botón que abre esta app con el organismo como
 * cliente, el producto sugerido y la cantidad que pide el pliego. El vendedor
 * ajusta el precio —que en una licitación casi nunca es el de lista— y exporta
 * el PDF en papel membretado, que es lo que los pliegos exigen.
 *
 * El borrador viaja en base64url dentro de `?borrador=`. Se valida con el mismo
 * esquema que todo lo demás: si viene roto o manipulado, se ignora y la app
 * abre normal. Nunca se confía en que la dirección traiga algo sano.
 */

export const PARAMETRO = "borrador";

function desdeBase64Url(texto: string): string {
  const base64 = texto.replace(/-/g, "+").replace(/_/g, "/");
  const relleno = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binario = atob(relleno);
  const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function leerBorradorDeUrl(busqueda: string): Borrador | null {
  let codificado: string | null;
  try {
    codificado = new URLSearchParams(busqueda).get(PARAMETRO);
  } catch {
    return null;
  }
  if (!codificado) return null;

  try {
    const resultado = esquemaBorrador.safeParse(JSON.parse(desdeBase64Url(codificado)));
    return resultado.success ? resultado.data : null;
  } catch {
    return null;
  }
}

/** Saca el parámetro de la barra de direcciones para que al recargar no vuelva
 *  a pisar lo que el vendedor haya editado. */
export function limpiarUrl(window: Window): void {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(PARAMETRO)) return;
    url.searchParams.delete(PARAMETRO);
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  } catch {
    // si el navegador no deja tocar el historial, no pasa nada grave
  }
}
