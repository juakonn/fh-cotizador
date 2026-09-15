export function formatearUSD(centavos: number): string {
  if (!Number.isInteger(centavos) || centavos < 0) {
    throw new RangeError(`Monto inválido: ${centavos}`);
  }
  const enteros = Math.floor(centavos / 100);
  const resto = centavos % 100;
  const miles = String(enteros).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return resto === 0 ? `U$S ${miles}` : `U$S ${miles},${String(resto).padStart(2, "0")}`;
}
