const REEMPLAZOS: Record<string, string> = {
  "→": "-",
  "←": "-",
  "↔": "-",
  "−": "-",
  "≈": "~",
  "≤": "<=",
  "≥": ">=",
  "′": "'",
  "″": '"',
  " ": " ",
  "\t": " ",
  "\n": " ",
};

const EXTRA_CP1252 = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";

export function aWinAnsi(texto: string): string {
  let salida = "";
  for (const ch of texto.normalize("NFC")) {
    const reemplazo = REEMPLAZOS[ch];
    if (reemplazo !== undefined) {
      salida += reemplazo;
      continue;
    }
    const cp = ch.codePointAt(0) ?? 0;
    if ((cp >= 0x20 && cp <= 0x7e) || (cp >= 0xa0 && cp <= 0xff) || EXTRA_CP1252.includes(ch)) {
      salida += ch;
    }
  }
  return salida.replace(/ {2,}/g, " ").trim();
}
