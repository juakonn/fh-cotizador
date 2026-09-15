import { URL_PRODUCTOS_SHOPIFY } from "@/lib/config/negocio";
import {
  esquemaRespuestaShopify,
  normalizarProductos,
  type Producto,
  type ProductoShopify,
} from "./normalizar";

export type CodigoErrorCatalogo = "SHOPIFY_NO_DISPONIBLE" | "RESPUESTA_INVALIDA";

export class ErrorCatalogo extends Error {
  readonly codigo: CodigoErrorCatalogo;
  constructor(codigo: CodigoErrorCatalogo, mensaje: string) {
    super(mensaje);
    this.name = "ErrorCatalogo";
    this.codigo = codigo;
  }
}

export type FetchCatalogo = (
  url: string,
  init?: RequestInit & { next?: { revalidate?: number } },
) => Promise<Response>;

const POR_PAGINA = 250;
const MAX_PAGINAS = 10;

export async function obtenerCatalogo(
  opciones: { fetchImpl?: FetchCatalogo } = {},
): Promise<Producto[]> {
  const fetchImpl = opciones.fetchImpl ?? (fetch as FetchCatalogo);
  const todos: ProductoShopify[] = [];
  for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
    let respuesta: Response;
    try {
      respuesta = await fetchImpl(`${URL_PRODUCTOS_SHOPIFY}?limit=${POR_PAGINA}&page=${pagina}`, {
        next: { revalidate: 300 },
      });
    } catch {
      throw new ErrorCatalogo("SHOPIFY_NO_DISPONIBLE", "No se pudo conectar con la web");
    }
    if (!respuesta.ok) {
      throw new ErrorCatalogo("SHOPIFY_NO_DISPONIBLE", `La web respondió ${respuesta.status}`);
    }
    const datos = esquemaRespuestaShopify.safeParse(await respuesta.json());
    if (!datos.success) {
      throw new ErrorCatalogo(
        "RESPUESTA_INVALIDA",
        "La lista de productos no tiene el formato esperado",
      );
    }
    todos.push(...datos.data.products);
    if (datos.data.products.length < POR_PAGINA) break;
  }
  return normalizarProductos(todos);
}
