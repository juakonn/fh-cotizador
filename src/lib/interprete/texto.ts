export function normalizarTexto(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function parsearNumero(texto: string): number | null {
  const m = texto.trim().match(/^(\d[\d.,]*)\s*(mil)?$/);
  if (!m) return null;
  const crudo = m[1];
  let valor: number;
  if (crudo.includes(",") && crudo.includes(".")) {
    valor = Number(crudo.replace(/\./g, "").replace(",", "."));
  } else if (crudo.includes(",")) {
    valor = Number(crudo.replace(",", "."));
  } else if (/^\d{1,3}(\.\d{3})+$/.test(crudo)) {
    valor = Number(crudo.replace(/\./g, ""));
  } else {
    valor = Number(crudo);
  }
  if (!Number.isFinite(valor)) return null;
  return m[2] ? valor * 1000 : valor;
}

export function tokenizar(texto: string): string[] {
  return normalizarTexto(texto)
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/(\d)([a-z])/g, "$1 $2")
    .replace(/([a-z])(\d)/g, "$1 $2")
    .split(/[^a-z0-9.]+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ""))
    .filter(Boolean);
}
