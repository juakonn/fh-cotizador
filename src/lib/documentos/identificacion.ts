export type ResultadoDocumento = { valido: boolean; normalizado: string; motivo?: string };

export function soloDigitos(texto: string): string {
  return texto.replace(/\D/g, "");
}

const PESOS_RUT = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

export function validarRut(texto: string): ResultadoDocumento {
  const d = soloDigitos(texto);
  if (d.length !== 12)
    return { valido: false, normalizado: d, motivo: "El RUT tiene que tener 12 dígitos" };
  const prefijo = Number(d.slice(0, 2));
  if (prefijo < 1 || prefijo > 21) {
    return {
      valido: false,
      normalizado: d,
      motivo: "Los dos primeros dígitos del RUT van de 01 a 21",
    };
  }
  if (d.slice(8, 10) !== "00") {
    return {
      valido: false,
      normalizado: d,
      motivo: "Los dígitos 9 y 10 del RUT tienen que ser 00",
    };
  }
  const suma = PESOS_RUT.reduce((acc, peso, i) => acc + peso * Number(d[i]), 0);
  const resto = 11 - (suma % 11);
  const verificador = resto === 11 ? 0 : resto;
  if (verificador === 10 || verificador !== Number(d[11])) {
    return { valido: false, normalizado: d, motivo: "El dígito verificador del RUT no coincide" };
  }
  return { valido: true, normalizado: d };
}

const PESOS_CI = [2, 9, 8, 7, 6, 3, 4];

export function validarCedula(texto: string): ResultadoDocumento {
  const crudo = soloDigitos(texto);
  if (crudo.length < 7 || crudo.length > 8) {
    return {
      valido: false,
      normalizado: crudo,
      motivo: "La cédula tiene 7 u 8 dígitos contando el verificador",
    };
  }
  const d = crudo.padStart(8, "0");
  const suma = PESOS_CI.reduce((acc, peso, i) => acc + peso * Number(d[i]), 0);
  const verificador = (10 - (suma % 10)) % 10;
  if (verificador !== Number(d[7])) {
    return {
      valido: false,
      normalizado: d,
      motivo: "El dígito verificador de la cédula no coincide",
    };
  }
  return { valido: true, normalizado: d };
}

export function formatearCedula(normalizado: string): string {
  const cuerpo = String(Number(normalizado.slice(0, 7)));
  return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${normalizado[7]}`;
}
