import { esquemaBorrador, esquemaEmisor } from "./esquema";
import { type Borrador, crearEmisorPorDefecto, type Emisor } from "./tipos";

export type Almacen = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const CLAVE_BORRADOR = "fh-cotizador:borrador:v1";
export const CLAVE_EMISOR = "fh-cotizador:emisor:v1";

function leer<T>(almacen: Almacen, clave: string, validar: (dato: unknown) => T | null): T | null {
  try {
    const texto = almacen.getItem(clave);
    if (!texto) return null;
    return validar(JSON.parse(texto));
  } catch {
    return null;
  }
}

function guardar(almacen: Almacen, clave: string, dato: unknown): void {
  try {
    almacen.setItem(clave, JSON.stringify(dato));
  } catch {
    // almacenamiento lleno o bloqueado por el navegador: el borrador sigue en memoria
  }
}

export function leerBorrador(almacen: Almacen): Borrador | null {
  return leer(almacen, CLAVE_BORRADOR, (dato) => {
    const r = esquemaBorrador.safeParse(dato);
    return r.success ? r.data : null;
  });
}

export function guardarBorrador(almacen: Almacen, borrador: Borrador): void {
  guardar(almacen, CLAVE_BORRADOR, borrador);
}

export function leerEmisor(almacen: Almacen): Emisor {
  return (
    leer(almacen, CLAVE_EMISOR, (dato) => {
      const r = esquemaEmisor.safeParse(dato);
      return r.success ? r.data : null;
    }) ?? crearEmisorPorDefecto()
  );
}

export function guardarEmisor(almacen: Almacen, emisor: Emisor): void {
  guardar(almacen, CLAVE_EMISOR, emisor);
}
