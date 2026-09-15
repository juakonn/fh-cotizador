export const COOKIE_ACCESO = "fh_acceso";
export const DURACION_ACCESO_SEGUNDOS = 60 * 60 * 24 * 400;
const CONTEXTO = "fh-cotizador:acceso:v1";

export class ErrorConfiguracion extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorConfiguracion";
  }
}

export function claveDeAcceso(): string {
  const clave = process.env.ACCESS_KEY ?? "";
  if (clave.length < 12) {
    throw new ErrorConfiguracion("ACCESS_KEY no está definida o tiene menos de 12 caracteres");
  }
  return clave;
}

function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}

function base64url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function tokenDeAcceso(clave: string = claveDeAcceso()): Promise<string> {
  const codificador = new TextEncoder();
  const llave = await crypto.subtle.importKey(
    "raw",
    codificador.encode(clave),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64url(await crypto.subtle.sign("HMAC", llave, codificador.encode(CONTEXTO)));
}

export async function esTokenValido(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  return iguales(token, await tokenDeAcceso());
}

export function claveCorrecta(intento: string): boolean {
  return iguales(intento, claveDeAcceso());
}
