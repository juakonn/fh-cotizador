import { z } from "zod";

const esquemaDescuento = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("porcentaje"), valor: z.number().gt(0).max(100) }),
  z.object({ tipo: z.literal("monto"), centavos: z.number().int().positive() }),
]);

const esquemaCliente = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("empresa"),
    razonSocial: z.string().max(120),
    rut: z.string().max(20),
  }),
  z.object({ tipo: z.literal("persona"), nombre: z.string().max(120), cedula: z.string().max(15) }),
]);

const esquemaEntrega = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("inmediata") }),
  z.object({ tipo: z.literal("dias"), dias: z.number().int().min(1).max(365) }),
  z.object({ tipo: z.literal("texto"), texto: z.string().trim().min(1).max(80) }),
]);

export const esquemaItem = z.object({
  productoId: z.number().int().positive(),
  cantidad: z.number().int().min(1).max(99),
  descuento: esquemaDescuento.nullable(),
  lineasOcultas: z.array(z.string().max(10)).max(200),
  mostrarFoto: z.boolean(),
  precioVistoCentavos: z.number().int().nonnegative(),
});

export const esquemaBorrador = z.object({
  version: z.literal(1),
  tipoDocumento: z.enum(["cotizacion", "proforma"]),
  cliente: esquemaCliente.nullable(),
  items: z.array(esquemaItem).max(20),
  descuentoGeneral: esquemaDescuento.nullable(),
  validezDias: z.number().int().min(1).max(365),
  entrega: esquemaEntrega.nullable(),
  notas: z.array(z.string().trim().min(1).max(200)).max(10),
});

export const esquemaEmisor = z.object({
  sucursal: z.enum(["san-jacinto", "montevideo"]),
  vendedorNombre: z.string().trim().max(60),
  vendedorCelular: z.string().trim().max(30),
});

export const esquemaSolicitudPdf = z.object({
  borrador: esquemaBorrador,
  emisor: esquemaEmisor,
});

export type SolicitudPdf = z.infer<typeof esquemaSolicitudPdf>;
