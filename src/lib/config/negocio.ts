export const URL_PRODUCTOS_SHOPIFY = "https://florenciohernandez.com.uy/products.json";
export const ETIQUETA_IVA_INCLUIDO = "iva-incluido";
export const VALIDEZ_POR_DEFECTO_DIAS = 30;
export const TEXTO_FORMA_DE_PAGO =
  "Forma de pago: contado o financiado con Mi Maquinaria by Santander.";
export const SUCURSALES = {
  "san-jacinto": "San Jacinto",
  montevideo: "Montevideo",
} as const;

// Celular fijo por vendedor (clave: primer nombre, sin tildes y en minúsculas). Gana sobre lo que se
// haya escrito en «Tu celular» de ese aparato.
export const CELULARES_VENDEDORES: Record<string, string> = {
  joaquin: "092 469 449",
};

export function celularDelVendedor(nombre: string, celularEscrito: string): string {
  const primerNombre = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .split(/\s+/)[0];
  return CELULARES_VENDEDORES[primerNombre] ?? celularEscrito.trim();
}
