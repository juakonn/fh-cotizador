const UNIDADES = [
  "cero",
  "uno",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
  "once",
  "doce",
  "trece",
  "catorce",
  "quince",
  "dieciséis",
  "diecisiete",
  "dieciocho",
  "diecinueve",
  "veinte",
  "veintiuno",
  "veintidós",
  "veintitrés",
  "veinticuatro",
  "veinticinco",
  "veintiséis",
  "veintisiete",
  "veintiocho",
  "veintinueve",
];
const DECENAS = [
  "",
  "",
  "",
  "treinta",
  "cuarenta",
  "cincuenta",
  "sesenta",
  "setenta",
  "ochenta",
  "noventa",
];
const CENTENAS = [
  "",
  "ciento",
  "doscientos",
  "trescientos",
  "cuatrocientos",
  "quinientos",
  "seiscientos",
  "setecientos",
  "ochocientos",
  "novecientos",
];

function hasta999(n: number): string {
  if (n < 30) return UNIDADES[n];
  if (n < 100) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    return u === 0 ? DECENAS[d] : `${DECENAS[d]} y ${UNIDADES[u]}`;
  }
  if (n === 100) return "cien";
  const c = Math.floor(n / 100);
  const r = n % 100;
  return r === 0 ? CENTENAS[c] : `${CENTENAS[c]} ${hasta999(r)}`;
}

function apocope(texto: string): string {
  return texto.replace(/veintiuno$/, "veintiún").replace(/uno$/, "un");
}

export function numeroEnLetras(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 999_999_999) {
    throw new RangeError(`Número fuera de rango: ${n}`);
  }
  if (n === 0) return "cero";
  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const partes: string[] = [];
  if (millones > 0)
    partes.push(millones === 1 ? "un millón" : `${apocope(hasta999(millones))} millones`);
  if (miles > 0) partes.push(miles === 1 ? "mil" : `${apocope(hasta999(miles))} mil`);
  if (resto > 0) partes.push(hasta999(resto));
  return partes.join(" ");
}

export function montoEnLetras(centavos: number): string {
  if (!Number.isInteger(centavos) || centavos < 0) {
    throw new RangeError(`Monto inválido: ${centavos}`);
  }
  const enteros = Math.floor(centavos / 100);
  const resto = centavos % 100;
  const base = `Dólares americanos ${numeroEnLetras(enteros)}`;
  return resto === 0 ? base : `${base} con ${String(resto).padStart(2, "0")}/100`;
}
