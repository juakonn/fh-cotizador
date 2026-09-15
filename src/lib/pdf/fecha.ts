import { SUCURSALES } from "@/lib/config/negocio";
import type { Emisor } from "@/lib/cotizacion/tipos";

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "setiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function partesMontevideo(fecha: Date): { anio: number; mes: number; dia: number } {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Montevideo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(fecha);
  const valor = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value);
  return { anio: valor("year"), mes: valor("month"), dia: valor("day") };
}

export function fechaLarga(fecha: Date): string {
  const { anio, mes, dia } = partesMontevideo(fecha);
  return `${dia} de ${MESES[mes - 1]} de ${anio}`;
}

export function fechaIso(fecha: Date): string {
  const { anio, mes, dia } = partesMontevideo(fecha);
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function lugarYFecha(sucursal: Emisor["sucursal"], fecha: Date): string {
  return `${SUCURSALES[sucursal]}, ${fechaLarga(fecha)}`;
}
