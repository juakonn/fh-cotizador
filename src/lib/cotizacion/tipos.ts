import { VALIDEZ_POR_DEFECTO_DIAS } from "@/lib/config/negocio";

export type TipoDocumento = "cotizacion" | "proforma";

// `rut`, `cedula` y `contacto` pueden ir vacíos: hay clientes (organismos, instituciones) que no dan
// el documento, y el PDF simplemente no escribe esa línea.
export type Cliente =
  | { tipo: "empresa"; razonSocial: string; rut: string; contacto: string }
  | { tipo: "persona"; nombre: string; cedula: string; contacto: string };

// Entrega inicial más cuotas, acordada con el cliente para esta cotización.
export type Financiacion = { entregaPorcentaje: number; cuotas: number };

// Un combo (tractor con pala) tiene una parte exenta y otra con IVA incluido: se detalla en el PDF.
export type DesgloseIva = {
  etiquetaExento: string;
  exentoCentavos: number;
  etiquetaConIva: string;
  conIvaCentavos: number;
};

// Máquina usada que el cliente entrega en parte de pago.
export type Toma = { detalle: string; centavos: number };

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
  // Líneas escritas a mano que se suman a la descripción de la web (ej. "Plato con cadenas").
  agregados: string[];
  // Precio puesto a mano para esta cotización; null = vale el de la web.
  precioManualCentavos: number | null;
  // Reparto del precio unitario entre la parte exenta y la que lleva IVA (combos).
  desgloseIva: DesgloseIva | null;
};

export type Borrador = {
  version: 1;
  tipoDocumento: TipoDocumento;
  cliente: Cliente | null;
  items: Item[];
  descuentoGeneral: Descuento | null;
  validezDias: number;
  entrega: Entrega | null;
  financiacion: Financiacion | null;
  tomas: Toma[];
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
  desgloseIva: DesgloseIva | null;
};

export type Totales = {
  lineas: LineaCalculada[];
  subtotalCentavos: number;
  descuentoGeneralCentavos: number;
  totalCentavos: number;
  // Máquinas que entrega el cliente en parte de pago.
  tomaCentavos: number;
  // Lo que queda por pagar: total menos la toma (negativo = queda a favor del cliente).
  saldoCentavos: number;
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
    financiacion: null,
    tomas: [],
    notas: [],
  };
}

export function crearEmisorPorDefecto(): Emisor {
  return { sucursal: "san-jacinto", vendedorNombre: "", vendedorCelular: "" };
}
