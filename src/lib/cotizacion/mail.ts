import { TEXTO_FORMA_DE_PAGO } from "@/lib/config/negocio";
import { formatearUSD } from "@/lib/dinero/formato";
import { calcularPlanDePago } from "./calculo";
import type { Borrador, Emisor, Totales } from "./tipos";

/**
 * Arma el mail para mandarle la cotización al cliente. No manda nada: devuelve el texto y el enlace
 * `mailto:` para que se abra el correo del vendedor con todo escrito. El PDF se adjunta a mano,
 * porque un enlace `mailto:` no puede llevar archivos.
 */

export type MailCotizacion = { para: string; asunto: string; cuerpo: string; enlace: string };

const MAX_PRODUCTOS = 6;

function nombreCliente(borrador: Borrador): string {
  const c = borrador.cliente;
  if (!c) return "";
  return (c.tipo === "empresa" ? c.razonSocial : c.nombre).trim();
}

function textoEntrega(borrador: Borrador): string | null {
  const e = borrador.entrega;
  if (!e) return null;
  if (e.tipo === "inmediata") return "Entrega inmediata";
  if (e.tipo === "dias") return `Plazo de entrega: ${e.dias} días`;
  return `Plazo de entrega: ${e.texto}`;
}

function formaDePago(borrador: Borrador, totales: Totales): string {
  const plan = calcularPlanDePago(totales.saldoCentavos, borrador.financiacion);
  if (!plan || !borrador.financiacion) return TEXTO_FORMA_DE_PAGO;
  const cuotas =
    plan.cuotaCentavos === plan.ultimaCuotaCentavos
      ? `${plan.cuotas} cuotas de ${formatearUSD(plan.cuotaCentavos)}`
      : `${plan.cuotas - 1} cuotas de ${formatearUSD(plan.cuotaCentavos)} y una de ${formatearUSD(plan.ultimaCuotaCentavos)}`;
  return `Forma de pago: entrega de ${borrador.financiacion.entregaPorcentaje}% (${formatearUSD(plan.entregaCentavos)}) y ${cuotas}.`;
}

export function armarMail(
  borrador: Borrador,
  totales: Totales,
  emisor: Emisor,
  celular: string,
): MailCotizacion {
  const cliente = nombreCliente(borrador);
  const documento = borrador.tipoDocumento === "proforma" ? "factura proforma" : "cotización";
  const primero = totales.lineas[0]?.titulo ?? "";
  const asunto = `${documento === "cotización" ? "Cotización" : "Factura proforma"} Florencio Hernández${primero ? ` - ${primero}` : ""}`;

  const productos = totales.lineas
    .slice(0, MAX_PRODUCTOS)
    .map(
      (l) =>
        `- ${l.cantidad > 1 ? `${l.cantidad} x ` : ""}${l.titulo}: ${formatearUSD(l.netoCentavos)}`,
    );
  if (totales.lineas.length > MAX_PRODUCTOS) {
    productos.push(`- y ${totales.lineas.length - MAX_PRODUCTOS} producto(s) más, en el PDF.`);
  }

  const entrega = textoEntrega(borrador);
  const tomas = borrador.tomas.map((t) => `Toma de ${t.detalle}: ${formatearUSD(t.centavos)}`);

  const partes = [
    cliente ? `Hola, ${cliente}:` : "Hola:",
    "",
    `Te mando la ${documento} de:`,
    ...productos,
    "",
    `Total: ${formatearUSD(totales.totalCentavos)}`,
    ...tomas,
    ...(totales.tomaCentavos > 0 ? [`Saldo a pagar: ${formatearUSD(totales.saldoCentavos)}`] : []),
    "",
    `Validez de la oferta: ${borrador.validezDias} días.`,
    ...(entrega ? [`${entrega}.`] : []),
    formaDePago(borrador, totales),
    "",
    "Va adjunta en PDF con el detalle de cada equipo. Cualquier consulta quedo a las órdenes.",
    "",
    "Saludos,",
    emisor.vendedorNombre.trim() || "Florencio Hernández",
    ...(celular.trim() ? [`Cel. ${celular.trim()}`] : []),
    "Florencio Hernández - Maquinaria agrícola",
    "riadensa@hotmail.com · florenciohernandez.com.uy",
  ];

  const cuerpo = partes.join("\n");
  const para = borrador.cliente?.email.trim() ?? "";
  const enlace = `mailto:${encodeURIComponent(para)}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  return { para, asunto, cuerpo, enlace };
}
