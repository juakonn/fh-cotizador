import { describe, expect, it } from "vitest";
import { formatearUSD } from "@/lib/dinero/formato";
import { montoEnLetras, numeroEnLetras } from "@/lib/dinero/letras";
import { formatearCedula, validarCedula, validarRut } from "@/lib/documentos/identificacion";

describe("formatearUSD", () => {
  it.each([
    [1790000, "U$S 17.900"],
    [247050, "U$S 2.470,50"],
    [99, "U$S 0,99"],
    [0, "U$S 0"],
    [123456789, "U$S 1.234.567,89"],
  ])("%i centavos → %s", (centavos, esperado) => {
    expect(formatearUSD(centavos)).toBe(esperado);
  });

  it("rechaza montos negativos o con fracción de centavo", () => {
    expect(() => formatearUSD(-1)).toThrow(RangeError);
    expect(() => formatearUSD(1.5)).toThrow(RangeError);
  });
});

describe("numeroEnLetras", () => {
  it.each([
    [0, "cero"],
    [1, "uno"],
    [15, "quince"],
    [16, "dieciséis"],
    [21, "veintiuno"],
    [22, "veintidós"],
    [30, "treinta"],
    [31, "treinta y uno"],
    [100, "cien"],
    [101, "ciento uno"],
    [500, "quinientos"],
    [999, "novecientos noventa y nueve"],
    [1000, "mil"],
    [1001, "mil uno"],
    [2470, "dos mil cuatrocientos setenta"],
    [17900, "diecisiete mil novecientos"],
    [21000, "veintiún mil"],
    [31000, "treinta y un mil"],
    [100000, "cien mil"],
    [101000, "ciento un mil"],
    [1000000, "un millón"],
    [1001000, "un millón mil"],
    [2500000, "dos millones quinientos mil"],
    [21000000, "veintiún millones"],
  ])("%i → %s", (n, esperado) => {
    expect(numeroEnLetras(n)).toBe(esperado);
  });
});

describe("montoEnLetras", () => {
  it("monto sin centavos", () => {
    expect(montoEnLetras(1790000)).toBe("Dólares americanos diecisiete mil novecientos");
  });
  it("monto con centavos", () => {
    expect(montoEnLetras(247050)).toBe(
      "Dólares americanos dos mil cuatrocientos setenta con 50/100",
    );
  });
  it("coincide siempre con el número formateado", () => {
    expect(formatearUSD(2483500)).toBe("U$S 24.835");
    expect(montoEnLetras(2483500)).toBe(
      "Dólares americanos veinticuatro mil ochocientos treinta y cinco",
    );
  });
});

describe("RUT", () => {
  it("acepta el RUT de Riaden S.A. y uno sintético válido", () => {
    expect(validarRut("212983680015").valido).toBe(true);
    expect(validarRut("21 123456 0019")).toEqual({ valido: true, normalizado: "211234560019" });
  });
  it("rechaza dígito verificador, largo y prefijo inválidos con un motivo", () => {
    expect(validarRut("211234560018").valido).toBe(false);
    expect(validarRut("21123456001").motivo).toBe("El RUT tiene que tener 12 dígitos");
    expect(validarRut("991234560019").valido).toBe(false);
  });
});

describe("cédula", () => {
  it("acepta cédulas de 8 y 7 dígitos", () => {
    expect(validarCedula("1.234.567-2")).toEqual({ valido: true, normalizado: "12345672" });
    expect(validarCedula("567.890-3")).toEqual({ valido: true, normalizado: "05678903" });
  });
  it("rechaza un verificador incorrecto", () => {
    expect(validarCedula("1.234.567-3").valido).toBe(false);
  });
  it("formatea con puntos y guion", () => {
    expect(formatearCedula("12345672")).toBe("1.234.567-2");
    expect(formatearCedula("05678903")).toBe("567.890-3");
  });
});
