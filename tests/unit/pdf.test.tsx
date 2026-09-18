import { readFileSync } from "node:fs";
import sharp from "sharp";
import { extractText, getDocumentProxy } from "unpdf";
import { describe, expect, it } from "vitest";
import { normalizarCatalogo } from "@/lib/catalogo/normalizar";
import { calcularTotales } from "@/lib/cotizacion/calculo";
import { type Borrador, crearBorradorVacio, type Emisor } from "@/lib/cotizacion/tipos";
import { contentDisposition, nombreArchivo } from "@/lib/pdf/archivo";
import { type DatosPdf, renderizarPdf } from "@/lib/pdf/documento";
import { fechaIso, fechaLarga, lugarYFecha } from "@/lib/pdf/fecha";
import { formatoImagen, prepararImagen } from "@/lib/pdf/imagenes";

const catalogo = normalizarCatalogo(
  JSON.parse(readFileSync("tests/fixtures/productos-shopify.json", "utf8")),
);
const FARMTRAC = 50605744423200; // U$S 17.900, exento
const PALA_554 = 50404913873184; // U$S 7.300, IVA incluido
const deVenta = (id: number) =>
  (catalogo.find((p) => p.id === id)?.lineas ?? []).filter((l) => !l.importante).map((l) => l.id);
const foto = { data: readFileSync("tests/fixtures/foto.jpg"), format: "jpg" as const };
const membrete = {
  data: readFileSync("src/lib/pdf/assets/membrete-fh-a4.jpg"),
  format: "jpg" as const,
};
const logoPago = {
  data: readFileSync("src/lib/pdf/assets/mi-maquinaria.png"),
  format: "png" as const,
};
const MEDIODIA_11_SET = new Date("2026-09-11T15:00:00Z");
const emisor: Emisor = {
  sucursal: "san-jacinto",
  vendedorNombre: "Ana",
  vendedorCelular: "099 123 456",
};

function proforma(): Borrador {
  return {
    ...crearBorradorVacio(),
    tipoDocumento: "proforma",
    cliente: { tipo: "empresa", razonSocial: "Agro Ejemplo S.A.", rut: "211234560019" },
    items: [
      {
        productoId: FARMTRAC,
        cantidad: 1,
        descuento: null,
        lineasOcultas: ["L1", ...deVenta(FARMTRAC)],
        mostrarFoto: true,
        precioVistoCentavos: 1790000,
      },
      {
        productoId: PALA_554,
        cantidad: 1,
        descuento: { tipo: "porcentaje", valor: 5 },
        lineasOcultas: [],
        mostrarFoto: true,
        precioVistoCentavos: 730000,
      },
    ],
    entrega: { tipo: "inmediata" },
    notas: ["Incluye flete a San José"],
  };
}

function datos(borrador: Borrador): DatosPdf {
  const calculo = calcularTotales(borrador, catalogo);
  if (!calculo.ok) throw new Error(calculo.mensaje);
  return {
    borrador,
    totales: calculo.totales,
    productos: catalogo,
    emisor,
    fecha: MEDIODIA_11_SET,
    fotos: { [FARMTRAC]: foto, [PALA_554]: foto },
    membrete,
    logoPago,
  };
}

async function textoPlano(pdf: Buffer): Promise<string> {
  const doc = await getDocumentProxy(new Uint8Array(pdf));
  const { text } = await extractText(doc, { mergePages: true });
  return text.replace(/\s+/g, " ");
}

describe("fecha en hora de Uruguay", () => {
  it("usa America/Montevideo y «setiembre»", () => {
    expect(fechaLarga(MEDIODIA_11_SET)).toBe("11 de setiembre de 2026");
    expect(fechaIso(MEDIODIA_11_SET)).toBe("2026-09-11");
    expect(fechaLarga(new Date("2026-09-11T02:30:00Z"))).toBe("10 de setiembre de 2026");
    expect(lugarYFecha("montevideo", MEDIODIA_11_SET)).toBe("Montevideo, 11 de setiembre de 2026");
  });
});

describe("nombre del archivo", () => {
  it("arma el nombre con tipo, cliente, primer producto y fecha", () => {
    expect(
      nombreArchivo(
        "proforma",
        { tipo: "empresa", razonSocial: "Agro Ejemplo S.A.", rut: "211234560019" },
        "Farmtrac FT 6050 - 50HP - 4x4",
        MEDIODIA_11_SET,
      ),
    ).toBe("Proforma - Agro Ejemplo S.A. - Farmtrac FT 6050 - 50HP - 4x4 - 2026-09-11.pdf");
    expect(nombreArchivo("cotizacion", null, "Retroexcavadora LW-6", MEDIODIA_11_SET)).toBe(
      "Cotización - Sin cliente - Retroexcavadora LW-6 - 2026-09-11.pdf",
    );
  });
  it("el header de descarga lleva versión ASCII y UTF-8", () => {
    expect(contentDisposition("Cotización - X.pdf")).toBe(
      "attachment; filename=\"Cotizacion - X.pdf\"; filename*=UTF-8''Cotizaci%C3%B3n%20-%20X.pdf",
    );
  });
});

describe("formatoImagen", () => {
  it("reconoce JPG y PNG por sus primeros bytes", () => {
    expect(formatoImagen(foto.data)).toBe("jpg");
    expect(formatoImagen(logoPago.data)).toBe("png");
    expect(formatoImagen(new Uint8Array([0x52, 0x49, 0x46, 0x46]))).toBeNull();
  });
});

describe("PDF de la factura proforma", () => {
  it("tiene todos los datos, el total en número y en letras, y pesa poco", async () => {
    const pdf = await renderizarPdf(datos(proforma()));
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeLessThan(2_500_000);
    const texto = await textoPlano(pdf);
    for (const esperado of [
      "San Jacinto, 11 de setiembre de 2026",
      "FACTURA PROFORMA",
      "Cliente: Agro Ejemplo S.A.",
      "RUT: 211234560019",
      "Farmtrac FT 6050 - 50HP - 4x4",
      "Precio unitario: U$S 7.300",
      "Exento de IVA",
      "Palas frontales para DF 554",
      "Descuento (5%): - U$S 365",
      "Importe: U$S 6.935",
      "IVA incluido",
      "TOTAL: U$S 24.835",
      "(Dólares americanos veinticuatro mil ochocientos treinta y cinco)",
      "Precios con IVA incluido o exentos de IVA, según se indica en cada producto.",
      "Validez de la oferta: 30 días.",
      "Plazo de entrega: Entrega inmediata.",
      "Forma de pago: contado o financiado con Mi Maquinaria by Santander.",
      "• Incluye flete a San José",
      "Atendido por: Ana · Cel. 099 123 456",
    ]) {
      expect(texto).toContain(esperado);
    }
    expect(texto).not.toContain("El tractor que resuelve");
    expect(texto).toContain("Ficha técnica");
    expect(texto).toContain("Tanque de combustible 60 litros");
    expect(texto).not.toContain("Por qué elegirlo");
    expect(texto).not.toMatch(/whatsapp|precalific/i);
  });
  it("pone un producto por hoja y el resumen con el total después del último", async () => {
    const pdf = await renderizarPdf(datos(proforma()));
    const doc = await getDocumentProxy(new Uint8Array(pdf));
    const { text } = await extractText(doc, { mergePages: false });
    const hojas = text.map((h) => h.replace(/\s+/g, " "));
    expect(hojas.length).toBe(2);
    expect(hojas[0]).toContain("Farmtrac FT 6050 - 50HP - 4x4");
    expect(hojas[0]).not.toContain("Palas frontales para DF 554");
    expect(hojas[0]).toContain("Importe: U$S 17.900");
    expect(hojas[0]).toContain("Barra antivuelco plegable");
    expect(hojas[0]).not.toContain("TOTAL:");
    const hojaPala = hojas.findIndex((h) => h.includes("Palas frontales para DF 554"));
    expect(hojaPala).toBe(1);
    expect(hojas[1]).toContain("TOTAL: U$S 24.835");
    expect(hojas.at(-1)).toContain(
      "Forma de pago: contado o financiado con Mi Maquinaria by Santander.",
    );
  });
  it("con Joaquín como vendedor pone siempre el celular 092 469 449", async () => {
    const pdf = await renderizarPdf({
      ...datos(proforma()),
      emisor: {
        sucursal: "san-jacinto",
        vendedorNombre: "Joaquín",
        vendedorCelular: "099 000 000",
      },
    });
    const texto = await textoPlano(pdf);
    expect(texto).toContain("Atendido por: Joaquín · Cel. 092 469 449");
    expect(texto).not.toContain("099 000 000");
  });
  it("un solo producto con toda su ficha técnica entra en una sola hoja", async () => {
    const borrador: Borrador = {
      ...proforma(),
      tipoDocumento: "cotizacion",
      cliente: null,
      notas: [],
      items: [
        {
          productoId: FARMTRAC,
          cantidad: 1,
          descuento: null,
          lineasOcultas: deVenta(FARMTRAC),
          mostrarFoto: true,
          precioVistoCentavos: 1790000,
        },
      ],
    };
    const doc = await getDocumentProxy(new Uint8Array(await renderizarPdf(datos(borrador))));
    const { text } = await extractText(doc, { mergePages: false });
    expect(text.length).toBe(1);
    const hoja = text[0].replace(/s+/g, " ");
    expect(hoja).toContain("Barra antivuelco plegable");
    expect(hoja).toContain("TOTAL: U$S 17.900");
    expect(hoja).toContain("Forma de pago: contado o financiado con Mi Maquinaria by Santander.");
  });
  it("una cotización sin cliente dice COTIZACIÓN y no muestra datos de cliente", async () => {
    const borrador: Borrador = { ...proforma(), tipoDocumento: "cotizacion", cliente: null };
    const texto = await textoPlano(await renderizarPdf(datos(borrador)));
    expect(texto).toContain("COTIZACIÓN");
    expect(texto).not.toContain("FACTURA PROFORMA");
    expect(texto).not.toContain("Cliente:");
  });
});

function pngPesado(r: number, g: number, b: number): Promise<Buffer> {
  return sharp({
    create: {
      width: 1600,
      height: 1200,
      channels: 4,
      background: { r, g, b, alpha: 0.6 },
      noise: { type: "gaussian", mean: 128, sigma: 40 },
    },
  })
    .png()
    .toBuffer();
}

describe("prepararImagen", () => {
  it("convierte un PNG pesado con transparencia en un JPG liviano", async () => {
    const png = await pngPesado(30, 90, 160);
    expect(png.length).toBeGreaterThan(2_000_000);
    const imagen = await prepararImagen(png);
    expect(imagen?.format).toBe("jpg");
    expect(formatoImagen(imagen?.data ?? new Uint8Array())).toBe("jpg");
    expect(imagen?.data.length ?? Number.POSITIVE_INFINITY).toBeLessThan(400_000);
  });
  it("devuelve null si los bytes no son una imagen", async () => {
    expect(await prepararImagen(new Uint8Array([1, 2, 3]))).toBeNull();
  });
});

describe("peso del PDF", () => {
  it("con 3 fotos PNG pesadas queda por debajo de 4 MB (Vercel corta a los 4,5 MB)", async () => {
    const RETRO = 49362879217952; // U$S 5.900
    const [a, b, c] = await Promise.all([
      pngPesado(30, 90, 160).then(prepararImagen),
      pngPesado(160, 90, 30).then(prepararImagen),
      pngPesado(30, 160, 90).then(prepararImagen),
    ]);
    if (!a || !b || !c) throw new Error("no se pudieron preparar las imágenes");
    const base = proforma();
    const borrador: Borrador = {
      ...base,
      items: [
        ...base.items,
        {
          productoId: RETRO,
          cantidad: 1,
          descuento: null,
          lineasOcultas: [],
          mostrarFoto: true,
          precioVistoCentavos: 590000,
        },
      ],
    };
    const pdf = await renderizarPdf({
      ...datos(borrador),
      fotos: { [FARMTRAC]: a, [PALA_554]: b, [RETRO]: c },
    });
    expect(pdf.length).toBeLessThan(4_000_000);
  });
});
