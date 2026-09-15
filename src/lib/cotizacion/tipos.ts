import { VALIDEZ_POR_DEFECTO_DIAS } from "@/lib/config/negocio";

export type TipoDocumento = "cotizacion" | "proforma";

export type Cliente =
  | { tipo: "empresa"; razonSocial: string; rut: string }
  | { tipo: "persona"; nombre: string; cedula: string };

export type Descuento = { tipo: "porcentaje"; valor: number } | { tipo: "monto"; centavos: number };

export type Entrega =
  | { tipo: "inmediata" }
  | { tipo: "dias"; dias: number }
  | { tipo: "texto"; texto: string };

export type Item = {
  productoId: number;
  cantidad: number;
  descuento: Descuento | null;
  lineasOcultas: string[];
  mostrarFoto: boolean;
  precioVistoCentavos: number;
};

export type Borrador = {
  version: 1;
  tipoDocumento: TipoDocumento;
  cliente: Cliente | null;
  items: Item[];
  descuentoGeneral: Descuento | null;
  validezDias: number;
  entrega: Entrega | null;
  notas: string[];
};

export type Emisor = {
  sucursal: "san-jacinto" | "montevideo";
  vendedorNombre: string;
  vendedorCelular: string;
};

export type LineaCalculada = {
  productoId: number;
  titulo: string;
  cantidad: number;
  precioUnitarioCentavos: number;
  brutoCentavos: number;
  descuentoCentavos: number;
  netoCentavos: number;
  ivaIncluido: boolean;
};

export type Totales = {
  lineas: LineaCalculada[];
  subtotalCentavos: number;
  descuentoGeneralCentavos: number;
  totalCentavos: number;
  iva: "exento" | "incluido" | "mixto";
};

export type Problema = { campo: string; mensaje: string };

export function crearBorradorVacio(): Borrador {
  return {
    version: 1,
    tipoDocumento: "cotizacion",
    cliente: null,
    items: [],
    descuentoGeneral: null,
    validezDias: VALIDEZ_POR_DEFECTO_DIAS,
    entrega: null,
    notas: [],
  };
}

export function crearEmisorPorDefecto(): Emisor {
  return { sucursal: "san-jacinto", vendedorNombre: "", vendedorCelular: "" };
}
