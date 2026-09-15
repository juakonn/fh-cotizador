import type { Producto } from "@/lib/catalogo/normalizar";
import { calcularTotales } from "@/lib/cotizacion/calculo";
import { type Accion, aplicar } from "@/lib/cotizacion/reducer";
import type { Borrador, Cliente, Descuento } from "@/lib/cotizacion/tipos";
import { formatearUSD } from "@/lib/dinero/formato";
import { formatearCedula, soloDigitos } from "@/lib/documentos/identificacion";
import { buscarProductos, elegir } from "./buscar";
import { normalizarTexto, parsearNumero } from "./texto";

export type Opcion = { etiqueta: string; acciones: Accion[]; resumen: string[] };
export type ResultadoInterprete =
  | { estado: "ok"; acciones: Accion[]; resumen: string[] }
  | { estado: "elegir"; pregunta: string; opciones: Opcion[] }
  | { estado: "no-entendi"; mensaje: string };
export type ContextoInterprete = { borrador: Borrador; catalogo: Producto[] };

const VERBOS =
  "agreg|sum|pon|anad|añad|sac|quit|elimin|borr|descuento|validez|entrega|hacel|pasal|cambi|dejal|precio|total|cantidad|\\d";
const SEPARADOR = new RegExp(`\\s*;\\s*|,\\s+|\\s+y\\s+(?=(?:${VERBOS}))`, "i");

function ok(acciones: Accion[], resumen: string[]): ResultadoInterprete {
  return { estado: "ok", acciones, resumen };
}

function noEntendi(mensaje: string): ResultadoInterprete {
  return { estado: "no-entendi", mensaje };
}

function textoDescuento(d: Descuento): string {
  return d.tipo === "porcentaje"
    ? `${String(d.valor).replace(".", ",")}%`
    : formatearUSD(d.centavos);
}

function resumenAgregar(p: Producto, cantidad: number): string {
  const prefijo = cantidad > 1 ? `${cantidad} × ` : "";
  return `Agregué ${prefijo}${p.titulo} (${formatearUSD(p.precioCentavos)})`;
}

function productosDelBorrador(ctx: ContextoInterprete): Producto[] {
  const porId = new Map(ctx.catalogo.map((p) => [p.id, p]));
  return ctx.borrador.items.flatMap((i) => {
    const p = porId.get(i.productoId);
    return p ? [p] : [];
  });
}

function buscarEnBorrador(consulta: string, ctx: ContextoInterprete) {
  const enBorrador = productosDelBorrador(ctx);
  return elegir(buscarProductos(consulta, enBorrador, { enBorrador }));
}

function extraerCliente(
  texto: string,
): { cliente: Cliente; resumen: string; resto: string } | null {
  const rut = texto.match(/\bcliente\s*:?\s+(.+?)\s*,?\s+rut\s*:?\s*([\d.\s-]*\d)/i);
  if (rut) {
    const razonSocial = rut[1].trim();
    const numero = soloDigitos(rut[2]);
    return {
      cliente: { tipo: "empresa", razonSocial, rut: numero },
      resumen: `Cliente: ${razonSocial} (RUT ${numero})`,
      resto: texto.replace(rut[0], " ").trim(),
    };
  }
  const ci = texto.match(
    /\bcliente\s*:?\s+(.+?)\s*,?\s+(?:c[eé]dula|c\.\s?i\.|ci)\s*:?\s*([\d.\s-]*\d)/i,
  );
  if (ci) {
    const nombre = ci[1].trim();
    const numero = soloDigitos(ci[2]);
    const mostrado = numero.length >= 7 ? formatearCedula(numero.padStart(8, "0")) : numero;
    return {
      cliente: { tipo: "persona", nombre, cedula: numero },
      resumen: `Cliente: ${nombre} (C.I. ${mostrado})`,
      resto: texto.replace(ci[0], " ").trim(),
    };
  }
  return null;
}

function precioFinal(texto: string, ctx: ContextoInterprete): ResultadoInterprete {
  const valor = parsearNumero(texto);
  if (valor === null || valor <= 0) return noEntendi("No entendí el precio final");
  const objetivo = Math.round(valor * 100);
  const r = calcularTotales({ ...ctx.borrador, descuentoGeneral: null }, ctx.catalogo);
  if (!r.ok) return noEntendi(r.mensaje);
  const subtotal = r.totales.subtotalCentavos;
  if (subtotal === 0) return noEntendi("Primero agregá productos");
  if (objetivo >= subtotal) {
    return noEntendi(
      `El precio final tiene que ser menor que el subtotal (${formatearUSD(subtotal)})`,
    );
  }
  return ok(
    [{ tipo: "descuentoGeneral", descuento: { tipo: "monto", centavos: subtotal - objetivo } }],
    [`Precio final ${formatearUSD(objetivo)}`],
  );
}

function descuento(d: Descuento, resto: string, ctx: ContextoInterprete): ResultadoInterprete {
  const texto = textoDescuento(d);
  const consulta = (resto.match(/\b(?:en|al|a|para)\s+(.+)$/)?.[1] ?? "").trim();
  if (!consulta) {
    return ok([{ tipo: "descuentoGeneral", descuento: d }], [`Descuento general ${texto}`]);
  }
  const eleccion = buscarEnBorrador(consulta, ctx);
  if (eleccion.tipo === "ninguno") return noEntendi(`No encontré «${consulta}» en la cotización`);
  if (eleccion.tipo === "varios") {
    return {
      estado: "elegir",
      pregunta: "¿A cuál le aplico el descuento?",
      opciones: eleccion.opciones.map((p) => ({
        etiqueta: p.titulo,
        acciones: [{ tipo: "descuentoItem", productoId: p.id, descuento: d }],
        resumen: [`Descuento de ${texto} en ${p.titulo}`],
      })),
    };
  }
  const p = eleccion.producto;
  return ok(
    [{ tipo: "descuentoItem", productoId: p.id, descuento: d }],
    [`Descuento de ${texto} en ${p.titulo}`],
  );
}

function cantidad(n: number, consulta: string, ctx: ContextoInterprete): ResultadoInterprete {
  if (n < 1 || n > 99) return noEntendi("La cantidad tiene que ser de 1 a 99");
  const enBorrador = productosDelBorrador(ctx);
  if (enBorrador.length === 0) return noEntendi("Todavía no hay productos en la cotización");
  const accion = (p: Producto): Accion => ({ tipo: "cantidad", productoId: p.id, cantidad: n });
  const resumen = (p: Producto) => `Cantidad de ${p.titulo}: ${n}`;
  const preguntar = (opciones: Producto[]): ResultadoInterprete => ({
    estado: "elegir",
    pregunta: "¿De cuál producto cambio la cantidad?",
    opciones: opciones.map((p) => ({
      etiqueta: p.titulo,
      acciones: [accion(p)],
      resumen: [resumen(p)],
    })),
  });
  const texto = consulta.trim();
  if (!texto) {
    if (enBorrador.length === 1) return ok([accion(enBorrador[0])], [resumen(enBorrador[0])]);
    return preguntar(enBorrador);
  }
  const eleccion = buscarEnBorrador(texto, ctx);
  if (eleccion.tipo === "ninguno") return noEntendi(`No encontré «${texto}» en la cotización`);
  if (eleccion.tipo === "varios") return preguntar(eleccion.opciones);
  return ok([accion(eleccion.producto)], [resumen(eleccion.producto)]);
}

function quitar(consulta: string, ctx: ContextoInterprete): ResultadoInterprete {
  const texto = consulta.trim();
  if (!texto) return noEntendi("Decime qué producto querés sacar");
  const eleccion = buscarEnBorrador(texto, ctx);
  if (eleccion.tipo === "ninguno") return noEntendi(`No encontré «${texto}» en la cotización`);
  if (eleccion.tipo === "varios") {
    return {
      estado: "elegir",
      pregunta: "¿Cuál saco?",
      opciones: eleccion.opciones.map((p) => ({
        etiqueta: p.titulo,
        acciones: [{ tipo: "quitar", productoId: p.id }],
        resumen: [`Quité ${p.titulo}`],
      })),
    };
  }
  const p = eleccion.producto;
  return ok([{ tipo: "quitar", productoId: p.id }], [`Quité ${p.titulo}`]);
}

function agregar(
  consulta: string,
  original: string,
  ctx: ContextoInterprete,
  conVerbo: boolean,
): ResultadoInterprete {
  const partes = consulta
    .split(/\s+y\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (partes.length === 0) return noEntendi("Decime qué producto querés agregar");
  const enBorrador = productosDelBorrador(ctx);
  const acciones: Accion[] = [];
  const resumen: string[] = [];
  for (const parte of partes) {
    const mc = parte.match(/^(\d{1,2})\s+(.*)$/);
    const cant = mc ? Number(mc[1]) : 1;
    const texto = mc ? mc[2] : parte;
    const eleccion = elegir(buscarProductos(texto, ctx.catalogo, { enBorrador }));
    if (eleccion.tipo === "ninguno" || (!conVerbo && eleccion.tipo === "varios")) {
      return noEntendi(
        conVerbo ? `No encontré «${texto}» en el catálogo` : `No entendí: «${original}»`,
      );
    }
    if (eleccion.tipo === "varios") {
      return {
        estado: "elegir",
        pregunta: "¿Cuál querés agregar?",
        opciones: eleccion.opciones.map((p) => ({
          etiqueta: `${p.titulo} (${formatearUSD(p.precioCentavos)})`,
          acciones: [...acciones, { tipo: "agregar", producto: p, cantidad: cant }],
          resumen: [...resumen, resumenAgregar(p, cant)],
        })),
      };
    }
    acciones.push({ tipo: "agregar", producto: eleccion.producto, cantidad: cant });
    resumen.push(resumenAgregar(eleccion.producto, cant));
  }
  return ok(acciones, resumen);
}

const VERBOS_QUITAR =
  /^(?:saca|sacale|sacar|quita|quitale|quitar|elimina|eliminar|borra|borrar)\b\s*(.*)$/;
const VERBOS_AGREGAR =
  /^(?:agrega|agregale|agregame|agregar|suma|sumale|sumar|pone|ponele|poner|anade|anadi|anadile|anadir|mete|metele|quiero)\b\s*(.*)$/;

function interpretarClausula(clausula: string, ctx: ContextoInterprete): ResultadoInterprete {
  const n = normalizarTexto(clausula);
  if (!n) return ok([], []);
  if (/\bproforma\b/.test(n)) {
    return ok([{ tipo: "tipoDocumento", valor: "proforma" }], ["Ahora es factura proforma"]);
  }
  if (/\bcotizacion\b/.test(n)) {
    return ok([{ tipo: "tipoDocumento", valor: "cotizacion" }], ["Ahora es cotización"]);
  }
  let m = n.match(/\bvalidez\b\D*(\d{1,3})\b/);
  if (m) {
    const dias = Number(m[1]);
    if (dias < 1 || dias > 365) return noEntendi("La validez tiene que ser de 1 a 365 días");
    return ok([{ tipo: "validez", dias }], [`Validez: ${dias} días`]);
  }
  if (/\binmediata\b/.test(n)) {
    return ok([{ tipo: "entrega", entrega: { tipo: "inmediata" } }], ["Entrega inmediata"]);
  }
  m = n.match(/\bentrega\b\D*(\d{1,3})\s*dias?\b/);
  if (m) {
    const dias = Number(m[1]);
    if (dias < 1 || dias > 365) {
      return noEntendi("El plazo de entrega tiene que ser de 1 a 365 días");
    }
    return ok([{ tipo: "entrega", entrega: { tipo: "dias", dias } }], [`Entrega en ${dias} días`]);
  }
  if (/\bentrega\b.*\ba (convenir|confirmar)\b/.test(n)) {
    return ok(
      [{ tipo: "entrega", entrega: { tipo: "texto", texto: "A confirmar" } }],
      ["Entrega a confirmar"],
    );
  }
  if (
    /\bsin descuentos?\b/.test(n) ||
    /^(saca|sacale|quita|quitale|elimina|borra)\b.*\bdescuentos?\b/.test(n)
  ) {
    return ok([{ tipo: "descuentoGeneral", descuento: null }], ["Sin descuento general"]);
  }
  m = n.match(/\b(dejalo|dejala|dejarlo|dejarla|precio final|total)\b\D*?(\d[\d.,]*(?:\s*mil)?)/);
  if (m) return precioFinal(m[2], ctx);
  m = n.match(/(\d+(?:[.,]\d+)?)\s*(?:%|por ?ciento)/);
  if (m) {
    const valor = parsearNumero(m[1]);
    if (valor === null || valor <= 0 || valor > 100) {
      return noEntendi("El descuento tiene que ser de más de 0% y hasta 100%");
    }
    return descuento({ tipo: "porcentaje", valor }, n.slice((m.index ?? 0) + m[0].length), ctx);
  }
  m = n.match(/\bdescuento\b\s*(?:de\s*)?(?:u\$s|usd|us\$|\$)?\s*(\d[\d.,]*(?:\s*mil)?)/);
  if (m) {
    const valor = parsearNumero(m[1]);
    if (valor === null || valor <= 0) return noEntendi("No entendí el monto del descuento");
    const d: Descuento = { tipo: "monto", centavos: Math.round(valor * 100) };
    return descuento(d, n.slice((m.index ?? 0) + m[0].length), ctx);
  }
  m =
    n.match(/^(?:cantidad\s*)?(\d{1,2})\s*(?:unidades|unidad|u)\b\s*(?:de\s+)?(.*)$/) ??
    n.match(/^cantidad\s*(\d{1,2})\s*(?:de\s+)?(.*)$/);
  if (m) return cantidad(Number(m[1]), m[2], ctx);
  m = n.match(VERBOS_QUITAR);
  if (m) return quitar(m[1], ctx);
  m = n.match(VERBOS_AGREGAR);
  if (m) return agregar(m[1], clausula.trim(), ctx, true);
  return agregar(n, clausula.trim(), ctx, false);
}

export function interpretar(texto: string, contexto: ContextoInterprete): ResultadoInterprete {
  const original = texto.trim();
  if (!original) return noEntendi("Escribí qué querés cambiar");
  const acciones: Accion[] = [];
  const resumen: string[] = [];
  let borrador = contexto.borrador;
  let resto = original;
  const cliente = extraerCliente(resto);
  if (cliente) {
    const accion: Accion = { tipo: "cliente", cliente: cliente.cliente };
    acciones.push(accion);
    resumen.push(cliente.resumen);
    borrador = aplicar(borrador, accion);
    resto = cliente.resto;
  }
  const clausulas = resto
    .split(SEPARADOR)
    .map((c) => c.trim())
    .filter(Boolean);
  for (let i = 0; i < clausulas.length; i++) {
    const r = interpretarClausula(clausulas[i], { borrador, catalogo: contexto.catalogo });
    if (r.estado === "no-entendi") return r;
    if (r.estado === "elegir") {
      const pendientes = clausulas.slice(i + 1);
      return {
        estado: "elegir",
        pregunta: pendientes.length
          ? `${r.pregunta} (después volvé a escribir: «${pendientes.join(", ")}»)`
          : r.pregunta,
        opciones: r.opciones.map((o) => ({
          etiqueta: o.etiqueta,
          acciones: [...acciones, ...o.acciones],
          resumen: [...resumen, ...o.resumen],
        })),
      };
    }
    acciones.push(...r.acciones);
    resumen.push(...r.resumen);
    borrador = r.acciones.reduce(aplicar, borrador);
  }
  if (acciones.length === 0) return noEntendi(`No entendí: «${original}»`);
  return ok(acciones, resumen);
}
