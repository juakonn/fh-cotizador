# Epic 02: PDF e interfaz

> Después de este epic existe el cotizador completo: el PDF con el membrete de fondo, la ruta que lo
> genera, la pantalla para armar la cotización desde el celular, el intérprete de frases en pantalla,
> compartir y descargar, el ícono en la pantalla de inicio y el README para publicarlo gratis en Vercel.

| | |
|---|---|
| **Epic id** | `02-pdf-e-interfaz` |
| **Tasks** | `E2-T1` … `E2-T7` |
| **Depends on** | `01-motor` |
| **Unlocks** | nada: es el último |
| **Parallel with** | ninguno |

No necesitás ningún otro archivo para completar este epic. Todo lo que sigue está repetido acá a
propósito.

---

## Stack

Next.js 16 (App Router) · TypeScript 6 · Tailwind CSS 4 · @react-pdf/renderer · zod 4 · Vitest ·
Playwright · Biome · npm · Node 24 (`.nvmrc`) · Vercel plan gratis. Sin base de datos, sin IA.
Las versiones exactas están en `package.json` y en el lockfile: leelas, nunca adivines una.

| Tarea | Comando |
|---|---|
| Desarrollo | `npm run dev` |
| Tipos · lint · formato | `npm run typecheck` · `npm run lint` · `npm run format` |
| Test (un archivo) | `npx vitest run tests/unit/<archivo>` |
| Todos los tests | `npm test` |
| E2E | `npm run test:e2e` (arma y levanta la app sola en el puerto 3000) |
| Build | `npm run build` |
| Probar el servidor armado | `node scripts/probar-servidor.mjs "<METODO> <RUTA> <ESTADO> [opciones]" ...` |
| Revisar etiquetas de IVA | `npm run iva:revisar` |

**Gate:** `npm run typecheck && npm run lint && npm test` pasa antes de marcar cualquier tarea como
hecha. Los e2e necesitan el navegador que instala el Bootstrap (`npx playwright install chromium`) y
leen `ACCESS_KEY` de `.env.local` por `playwright.config.ts`. Los e2e y los chequeos de `/` usan el
catálogo real de la web: necesitan internet.

## Directory subtree

```
src/
  app/
    page.tsx                     # EDITA (E2-T3) — reemplaza el marcador del epic 01
    layout.tsx                   # EDITA (E2-T6) — metadata appleWebApp
    manifest.ts                  # NUEVO (E2-T6)
    api/pdf/route.ts             # NUEVO (E2-T2)
  components/cotizador/
    Cotizador.tsx                # NUEVO (E2-T3), EDITA (E2-T4, E2-T5)
    DatosCliente.tsx             # NUEVO (E2-T3)
    BuscadorProductos.tsx        # NUEVO (E2-T3)
    ItemCotizacion.tsx           # NUEVO (E2-T3)
    Condiciones.tsx              # NUEVO (E2-T4)
    Interprete.tsx               # NUEVO (E2-T4)
    AjustesDispositivo.tsx       # NUEVO (E2-T4)
    BarraTotal.tsx               # NUEVO (E2-T5)
  lib/pdf/
    fecha.ts                     # NUEVO (E2-T1)
    archivo.ts                   # NUEVO (E2-T1)
    imagenes.ts                  # NUEVO (E2-T1)
    documento.tsx                # NUEVO (E2-T1)
    generar.ts                   # NUEVO (E2-T2)
    assets/membrete-fh-a4.jpg    # ya existe (workspace) — solo lectura
    assets/mi-maquinaria.png     # ya existe (workspace) — solo lectura
  lib/**                         # del epic 01 — solo lectura
public/icons/icon-192.png, icon-512.png   # ya existen (workspace)
scripts/revisar-iva.mts          # NUEVO (E2-T6)
tests/
  unit/pdf.test.tsx              # NUEVO (E2-T1)
  unit/api-pdf.test.ts           # NUEVO (E2-T2)
  e2e/cotizacion.spec.ts         # NUEVO (E2-T5)
  fixtures/                      # ya existen (workspace) — solo lectura
README.md                        # NUEVO (E2-T7)
```

Todo lo que esté fuera de este árbol queda fuera del alcance. Si una tarea parece pedir editar otro
archivo (en particular algo de `src/lib/**` del epic 01), pará y reportalo.

## Data model touched here

Sin base de datos. Este epic lee los tipos del epic 01 (`Borrador`, `Item`, `Emisor`, `Totales`,
`Producto`, `Accion`) y agrega:

| Tipo | Dónde | Qué es |
|---|---|---|
| `ImagenPdf` | `src/lib/pdf/imagenes.ts` | `{ data: Buffer; format: "jpg" \| "png" }` |
| `DatosPdf` | `src/lib/pdf/documento.tsx` | todo lo que necesita el documento (literal abajo) |
| `Dependencias`, `ResultadoGenerar`, `CodigoErrorPdf` | `src/lib/pdf/generar.ts` | inyección para testear sin red |

## Contracts

**Consumed** — ya existe, no se reconstruye:

| From | Interfaz | Garantía |
|---|---|---|
| `01-motor` | `obtenerCatalogo(): Promise<Producto[]>`, `ErrorCatalogo` | lee Shopify con paginación y caché de 5 min; falla con código |
| `01-motor` | `calcularTotales(borrador, catalogo)` | `{ ok: true, totales }` o `PRODUCTO_NO_DISPONIBLE` |
| `01-motor` | `validarParaPdf(borrador)`, `advertencias(borrador, catalogo)` | `Problema[]` con textos fijos |
| `01-motor` | `esquemaSolicitudPdf` | zod de `{ borrador, emisor }` |
| `01-motor` | `aplicar`, `conHistorial`, `deshacer`, `crearHistorial`, `Accion` | reducer puro; un pedido = un paso de Deshacer |
| `01-motor` | `leerBorrador`, `guardarBorrador`, `leerEmisor`, `guardarEmisor` | localStorage con validación; nunca lanzan |
| `01-motor` | `interpretar(texto, { borrador, catalogo })` | `ok` / `elegir` / `no-entendi` |
| `01-motor` | `buscarProductos(consulta, catalogo, { enBorrador })` | candidatos ordenados |
| `01-motor` | `formatearUSD`, `montoEnLetras`, `aWinAnsi`, `formatearCedula`, `validarCedula`, `validarRut` | formato y validación |
| `01-motor` | `src/proxy.ts` | todo menos salud, acceso, íconos y manifest exige la cookie `fh_acceso` |

**Produced**:

| Export | Firma | Usado por |
|---|---|---|
| `src/lib/pdf/documento.tsx` → `renderizarPdf` | `(datos: DatosPdf) => Promise<Buffer>` | `generar.ts` |
| `src/lib/pdf/generar.ts` → `generarPdf`, `dependenciasReales` | `(cuerpo: unknown, deps: Dependencias) => Promise<ResultadoGenerar>` | la ruta |
| `POST /api/pdf` | cuerpo `{ borrador, emisor }` → 200 `application/pdf` o `{ error: { codigo, mensaje, detalle? } }` | `BarraTotal.tsx` |
| `GET /manifest.webmanifest` | manifest de la app instalable | el celular |

## Conventions that bite in this area

- **Nada de `src/lib/pdf/**` en el navegador ni en scripts.** Los componentes llaman a `POST /api/pdf`.
- **Una sola región `role="status"` en toda la página** (la del intérprete): el e2e la busca por rol.
- **Nombres accesibles exactos** (tabla "Contrato de la interfaz" de E2-T3). Son el contrato con el e2e.
- **Leer `localStorage` solo después de montar** (`useEffect`), nunca durante el render: evita
  errores de hidratación.
- **Colores solo por token** (`bg-marino`, `text-texto-suave`, `border-borde`, `text-error`, `bg-dorado`…).
- Reglas por área (ya en la raíz): `.claude/rules/pdf.md`, `.claude/rules/interfaz.md`. Generales: `CLAUDE.md`.

---

## Tasks

En el mismo orden que `tasks.json`. Se trabaja de arriba hacia abajo y no se reordena por prioridad.

### `E2-T1` — Documento PDF con membrete de fondo

**Depends on:** `E1-T5` · **Priority:** p0 — metadato para recortes de alcance, no un orden

El diseño del documento se validó visualmente contra el membrete real y fotos de Shopify: `documento.tsx`
va tal cual. Una hoja por producto (`break` desde el segundo): título, foto y recuadro de precio lado a
lado, y abajo las líneas visibles de la descripción (las «Etiqueta: valor» como filas de tabla). El
cierre —resumen si hay 2 o más productos, total, condiciones, notas y «Atendido por»— es un solo bloque
`wrap={false}` después del último producto.
Los otros tres módulos se implementan con estas reglas hasta que pase el test.

`src/lib/pdf/fecha.ts`
- Meses en castellano de Uruguay, con **«setiembre»**, desde una lista propia (no uses los nombres
  de `Intl`, que varían por versión).
- Día, mes y año se sacan con `new Intl.DateTimeFormat("en-US", { timeZone: "America/Montevideo",
  year: "numeric", month: "numeric", day: "numeric" }).formatToParts(fecha)` (solo números).
- `fechaLarga(fecha)` → `"11 de setiembre de 2026"`; `fechaIso(fecha)` → `"2026-09-11"`;
  `lugarYFecha(sucursal, fecha)` → `"<SUCURSALES[sucursal]>, <fechaLarga>"`.

`src/lib/pdf/archivo.ts`
- `nombreArchivo(tipo, cliente, primerTitulo, fecha)` → `"<Proforma|Cotización> - <razón social o
  nombre, o «Sin cliente»> - <primer título> - <fechaIso>.pdf"`, sin los caracteres `\ / : * ? " < > |`,
  espacios colapsados, máximo 120 caracteres antes de `.pdf`.
- `contentDisposition(nombre)` → `attachment; filename="<ascii>"; filename*=UTF-8''<encodeURIComponent(nombre)>`,
  donde `<ascii>` es el nombre sin tildes, con `_` en lugar de cualquier otro carácter fuera de
  0x20–0x7E y sin comillas.

`src/lib/pdf/imagenes.ts`
- `export type FormatoImagen = "jpg" | "png"; export type ImagenPdf = { data: Buffer; format: FormatoImagen };`
- `formatoImagen(datos: Uint8Array)`: `FF D8 FF` → `"jpg"`; `89 50 4E 47` → `"png"`; otro → `null`.
- `prepararImagen(datos: Uint8Array): Promise<ImagenPdf | null>` con `import sharp from "sharp"`:
  `sharp(datos).flatten({ background: "#ffffff" }).resize({ width: 1000, withoutEnlargement: true })
  .jpeg({ quality: 80, mozjpeg: true }).toBuffer()` → `{ data, format: "jpg" }`; si sharp no puede leer
  los bytes → `null`. Motivo, verificado el 2026-09-11: Shopify devuelve PNG de 1,2 a 2,5 MB para 8 de
  las 13 fotos del fixture (las que tienen transparencia) aunque se pida `format=pjpg`, y Vercel corta
  las respuestas de más de 4,5 MB; recomprimida, la foto del Farmtrac pasa de 1.940 KB a 211 KB (~120 ms).
- `descargarImagen(url, fetchImpl = fetch, timeoutMs = 8000): Promise<ImagenPdf | null>`: pide con
  `AbortSignal.timeout(timeoutMs)` y pasa los bytes por `prepararImagen`; error o estado no-ok →
  `null` (nunca lanza).

`src/lib/pdf/documento.tsx`
```tsx
import { Document, Image, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Linea } from "@/lib/catalogo/descripcion";
import type { Producto } from "@/lib/catalogo/normalizar";
import { aWinAnsi } from "@/lib/catalogo/winansi";
import { celularDelVendedor, TEXTO_FORMA_DE_PAGO } from "@/lib/config/negocio";
import type { Borrador, Emisor, Entrega, LineaCalculada, Totales } from "@/lib/cotizacion/tipos";
import { formatearUSD } from "@/lib/dinero/formato";
import { montoEnLetras } from "@/lib/dinero/letras";
import { formatearCedula, validarCedula } from "@/lib/documentos/identificacion";
import { lugarYFecha } from "./fecha";
import type { ImagenPdf } from "./imagenes";

export type DatosPdf = {
  borrador: Borrador;
  totales: Totales;
  productos: Producto[];
  emisor: Emisor;
  fecha: Date;
  fotos: Record<number, ImagenPdf | null>;
  membrete: ImagenPdf;
  logoPago: ImagenPdf;
};

const MARINO = "#0c2641";
const DORADO = "#c9a34b";
const TEXTO = "#14202e";
const SUAVE = "#5b6878";
const BORDE = "#d9dee7";
const FONDO = "#f5f6f8";

const s = StyleSheet.create({
  pagina: {
    paddingTop: "52mm",
    paddingBottom: "32mm",
    paddingHorizontal: "18mm",
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: TEXTO,
    lineHeight: 1.35,
  },
  fondo: { position: "absolute", top: 0, left: 0, width: "210mm", height: "297mm" },
  lugarFecha: { textAlign: "right", color: SUAVE },
  titulo: {
    marginTop: "3mm",
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    color: MARINO,
    letterSpacing: 1,
  },
  barra: { width: "30mm", height: "1.2mm", backgroundColor: DORADO, marginTop: "1.5mm" },
  cliente: { marginTop: "4mm" },
  clienteNombre: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  producto: { marginTop: "6mm" },
  vista: { flexDirection: "row", alignItems: "flex-end", marginBottom: "3mm" },
  foto: { flex: 1, height: "58mm", objectFit: "contain", marginRight: "5mm" },
  productoTitulo: { fontFamily: "Helvetica-Bold", fontSize: 15, color: MARINO },
  barraChica: {
    width: "16mm",
    height: "0.8mm",
    backgroundColor: DORADO,
    marginTop: "1.5mm",
    marginBottom: "2mm",
  },
  seccion: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: MARINO,
    marginTop: "3mm",
    marginBottom: "1mm",
  },
  fila: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: BORDE,
    paddingVertical: "0.7mm",
  },
  filaEtiqueta: { width: "42%", fontFamily: "Helvetica-Bold", fontSize: 9, paddingRight: "3mm" },
  filaValor: { flex: 1, fontSize: 9 },
  parrafo: { fontSize: 9, marginBottom: "1.5mm" },
  precios: {
    width: "62mm",
    marginLeft: "auto",
    padding: "3mm",
    borderWidth: 0.7,
    borderColor: BORDE,
    textAlign: "right",
  },
  importe: { fontFamily: "Helvetica-Bold", fontSize: 11, color: MARINO },
  iva: { fontSize: 8, color: SUAVE },
  resumen: {
    marginTop: "6mm",
    padding: "3.5mm",
    backgroundColor: FONDO,
    borderLeftWidth: 3,
    borderLeftColor: DORADO,
  },
  resumenTitulo: { fontFamily: "Helvetica-Bold", fontSize: 11, color: MARINO, marginBottom: "2mm" },
  resumenFila: { flexDirection: "row", marginBottom: "1mm" },
  resumenProducto: { flex: 1, paddingRight: "3mm" },
  resumenImporte: { width: "35mm", textAlign: "right" },
  total: { fontFamily: "Helvetica-Bold", fontSize: 13, color: MARINO, marginTop: "2mm" },
  letras: { fontFamily: "Helvetica-Oblique", fontSize: 9 },
  condiciones: { marginTop: "4mm" },
  logoPago: { width: "33mm", height: "9mm", marginTop: "1.5mm" },
  notas: { marginTop: "3mm" },
  atendido: { marginTop: "3mm", color: SUAVE },
});

const ETIQUETA_VALOR = /^([^:]{2,40}):\s+(.+)$/;

function textoEntrega(entrega: Entrega | null): string {
  if (!entrega) return "A confirmar";
  if (entrega.tipo === "inmediata") return "Entrega inmediata";
  if (entrega.tipo === "dias") return `${entrega.dias} días`;
  return aWinAnsi(entrega.texto);
}

function textoIva(iva: Totales["iva"]): string {
  if (iva === "exento") return "Exento de IVA.";
  if (iva === "incluido") return "IVA incluido.";
  return "Precios con IVA incluido o exentos de IVA, según se indica en cada producto.";
}

function porcentaje(valor: number): string {
  return String(valor).replace(".", ",");
}

function LineaDescripcion({ linea }: { linea: Linea }) {
  if (linea.tipo === "titulo") return <Text style={s.seccion}>{linea.texto}</Text>;
  const par = linea.texto.match(ETIQUETA_VALOR);
  if (par) {
    return (
      <View style={s.fila} wrap={false}>
        <Text style={s.filaEtiqueta}>{par[1]}</Text>
        <Text style={s.filaValor}>{par[2]}</Text>
      </View>
    );
  }
  if (linea.tipo === "item") {
    return (
      <View style={s.fila} wrap={false}>
        <Text style={s.filaValor}>{linea.texto}</Text>
      </View>
    );
  }
  return <Text style={s.parrafo}>{linea.texto}</Text>;
}

function HojaProducto({
  datos,
  linea,
  primera,
}: {
  datos: DatosPdf;
  linea: LineaCalculada;
  primera: boolean;
}) {
  const item = datos.borrador.items.find((i) => i.productoId === linea.productoId);
  const producto = datos.productos.find((p) => p.id === linea.productoId);
  const foto = item?.mostrarFoto ? (datos.fotos[linea.productoId] ?? null) : null;
  const visibles = (producto?.lineas ?? []).filter((l) => !item?.lineasOcultas.includes(l.id));
  const d = item?.descuento ?? null;
  return (
    <View style={s.producto} break={!primera}>
      <Text style={s.productoTitulo}>{linea.titulo}</Text>
      <View style={s.barraChica} />
      <View style={s.vista} wrap={false}>
        {foto ? <Image src={foto} style={s.foto} /> : null}
        <View style={s.precios} wrap={false}>
          <Text>{`Precio unitario: ${formatearUSD(linea.precioUnitarioCentavos)}`}</Text>
          {linea.cantidad > 1 ? <Text>{`Cantidad: ${linea.cantidad}`}</Text> : null}
          {linea.descuentoCentavos > 0 ? (
            <Text>
              {`Descuento${d?.tipo === "porcentaje" ? ` (${porcentaje(d.valor)}%)` : ""}: - ${formatearUSD(linea.descuentoCentavos)}`}
            </Text>
          ) : null}
          <Text style={s.importe}>{`Importe: ${formatearUSD(linea.netoCentavos)}`}</Text>
          <Text style={s.iva}>{linea.ivaIncluido ? "IVA incluido" : "Exento de IVA"}</Text>
        </View>
      </View>
      {visibles.map((l) => (
        <LineaDescripcion key={l.id} linea={l} />
      ))}
    </View>
  );
}

export function DocumentoCotizacion(datos: DatosPdf) {
  const { borrador, totales, emisor } = datos;
  const cliente = borrador.cliente;
  const general = borrador.descuentoGeneral;
  const celular = celularDelVendedor(emisor.vendedorNombre, emisor.vendedorCelular);
  return (
    <Document title={borrador.tipoDocumento === "proforma" ? "Factura proforma" : "Cotización"}>
      <Page size="A4" style={s.pagina}>
        <Image fixed src={datos.membrete} style={s.fondo} />
        <Text style={s.lugarFecha}>{lugarYFecha(emisor.sucursal, datos.fecha)}</Text>
        <Text style={s.titulo}>
          {borrador.tipoDocumento === "proforma" ? "FACTURA PROFORMA" : "COTIZACIÓN"}
        </Text>
        <View style={s.barra} />
        {cliente ? (
          <View style={s.cliente}>
            <Text style={s.clienteNombre}>
              {`Cliente: ${aWinAnsi(cliente.tipo === "empresa" ? cliente.razonSocial : cliente.nombre)}`}
            </Text>
            <Text>
              {cliente.tipo === "empresa"
                ? `RUT: ${cliente.rut}`
                : `C.I.: ${
                    validarCedula(cliente.cedula).valido
                      ? formatearCedula(validarCedula(cliente.cedula).normalizado)
                      : cliente.cedula
                  }`}
            </Text>
          </View>
        ) : null}
        {totales.lineas.map((linea, indice) => (
          <HojaProducto key={linea.productoId} datos={datos} linea={linea} primera={indice === 0} />
        ))}
        <View wrap={false}>
          <View style={s.resumen}>
            {totales.lineas.length > 1 ? (
              <>
                <Text style={s.resumenTitulo}>Resumen</Text>
                {totales.lineas.map((linea) => (
                  <View key={linea.productoId} style={s.resumenFila}>
                    <Text style={s.resumenProducto}>
                      {`${linea.cantidad > 1 ? `${linea.cantidad} × ` : ""}${linea.titulo}`}
                    </Text>
                    <Text style={s.resumenImporte}>{formatearUSD(linea.netoCentavos)}</Text>
                  </View>
                ))}
              </>
            ) : null}
            {totales.descuentoGeneralCentavos > 0 ? (
              <>
                <Text>{`Subtotal: ${formatearUSD(totales.subtotalCentavos)}`}</Text>
                <Text>
                  {`Descuento general${general?.tipo === "porcentaje" ? ` (${porcentaje(general.valor)}%)` : ""}: - ${formatearUSD(totales.descuentoGeneralCentavos)}`}
                </Text>
              </>
            ) : null}
            <Text style={s.total}>{`TOTAL: ${formatearUSD(totales.totalCentavos)}`}</Text>
            <Text style={s.letras}>{`(${montoEnLetras(totales.totalCentavos)})`}</Text>
            <Text style={s.iva}>{textoIva(totales.iva)}</Text>
          </View>
          <View style={s.condiciones}>
            <Text>{`Validez de la oferta: ${borrador.validezDias} días.`}</Text>
            <Text>{`Plazo de entrega: ${textoEntrega(borrador.entrega)}.`}</Text>
            <Text>{TEXTO_FORMA_DE_PAGO}</Text>
            <Image src={datos.logoPago} style={s.logoPago} />
          </View>
          {borrador.notas.length > 0 ? (
            <View style={s.notas}>
              {borrador.notas.map((nota) => (
                <Text key={nota}>{`• ${aWinAnsi(nota)}`}</Text>
              ))}
            </View>
          ) : null}
          {emisor.vendedorNombre.trim() ? (
            <Text style={s.atendido}>
              {`Atendido por: ${aWinAnsi(emisor.vendedorNombre)}${
                celular ? ` · Cel. ${aWinAnsi(celular)}` : ""
              }`}
            </Text>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}

export async function renderizarPdf(datos: DatosPdf): Promise<Buffer> {
  return renderToBuffer(<DocumentoCotizacion {...datos} />);
}
```

**Files**
- `src/lib/pdf/fecha.ts` — nuevo
- `src/lib/pdf/archivo.ts` — nuevo
- `src/lib/pdf/imagenes.ts` — nuevo
- `src/lib/pdf/documento.tsx` — nuevo
- `tests/unit/pdf.test.tsx` — nuevo

`tests/unit/pdf.test.tsx`
```tsx
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
      "Precio unitario: U$S 17.900",
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
    expect(hojas[0]).toContain("Precio unitario: U$S 17.900");
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
```

**Acceptance**

Copiado textual del array `acceptance` de esta tarea en `tasks.json`.

1. **WHEN** se genera la proforma de prueba (Farmtrac FT 6050 más Palas frontales para DF 554 con 5%) **THE SYSTEM SHALL** producir un PDF de menos de 2,5 MB cuyo texto contiene «FACTURA PROFORMA», «TOTAL: U$S 24.835» y «(Dólares americanos veinticuatro mil ochocientos treinta y cinco)».
2. **WHEN** la proforma de prueba tiene 2 productos **THE SYSTEM SHALL** producir 2 hojas: la primera con el Farmtrac FT 6050, su precio y su ficha técnica hasta «Barra antivuelco plegable», sin las Palas frontales para DF 554 ni «TOTAL:»; la segunda con las Palas frontales para DF 554, «TOTAL: U$S 24.835» y la forma de pago.
3. **WHEN** un ítem tiene líneas de descripción ocultas (L1 y las secciones de venta del Farmtrac) **THE SYSTEM SHALL** dejar ese texto fuera del PDF («Por qué elegirlo» no aparece) y mostrar la ficha técnica («Tanque de combustible 60 litros»).
4. **WHEN** el documento es una cotización sin cliente **THE SYSTEM SHALL** titularlo «COTIZACIÓN» y no escribir «Cliente:», y **WHEN** el vendedor es Joaquín con otro celular guardado **THE SYSTEM SHALL** escribir «Atendido por: Joaquín · Cel. 092 469 449».
5. **WHEN** la fecha es 2026-09-11T02:30:00Z **THE SYSTEM SHALL** escribir «10 de setiembre de 2026» (hora de Montevideo), y **WHEN** se arma el nombre del archivo de la proforma de prueba **THE SYSTEM SHALL** devolver «Proforma - Agro Ejemplo S.A. - Farmtrac FT 6050 - 50HP - 4x4 - 2026-09-11.pdf».
6. **WHEN** una foto llega como PNG pesado con transparencia **THE SYSTEM SHALL** convertirla en un JPG de menos de 400 KB, y un PDF con 3 fotos así **THE SYSTEM SHALL** dejarlo por debajo de 4 MB (Vercel corta respuestas de más de 4,5 MB).

**Verify**: cada comando, en orden, desde la raíz del proyecto.

```bash
npm run typecheck
npm run lint
npx vitest run tests/unit/pdf.test.tsx
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T1: documento PDF con membrete de fondo"
git tag step-08-pdf
```

### `E2-T2` — Ruta POST /api/pdf

**Depends on:** `E2-T1`, `E1-T2` · **Priority:** p0 — metadato para recortes de alcance, no un orden

`generar.ts` orquesta todo con dependencias inyectables (catálogo, fetch de imágenes, reloj, lectura
de archivos) para poder testear sin red. La ruta es delgada. Implementalos con estas reglas hasta
que pase el test, que va tal cual.

`src/lib/pdf/generar.ts`
- Tipos exportados:
  ```ts
  export type CodigoErrorPdf =
    | "SOLICITUD_INVALIDA"
    | "BORRADOR_INCOMPLETO"
    | "SHOPIFY_NO_DISPONIBLE"
    | "PRODUCTO_NO_DISPONIBLE"
    | "PRECIO_CAMBIO";
  export type ResultadoGenerar =
    | { ok: true; pdf: Buffer; nombre: string }
    | { ok: false; estado: number; codigo: CodigoErrorPdf; mensaje: string; detalle?: unknown };
  export type Dependencias = {
    obtenerCatalogo: () => Promise<Producto[]>;
    fetchImagen: typeof fetch;
    ahora: () => Date;
    leerAsset: (nombre: string) => Promise<Buffer>;
  };
  ```
- `dependenciasReales()`: `obtenerCatalogo()` de Shopify, `fetch`, `new Date()` y
  `readFile(path.join(process.cwd(), "src/lib/pdf/assets", nombre))`.
- `generarPdf(cuerpo, deps)`, **en este orden**:
  1. `esquemaSolicitudPdf.safeParse` falla → 400 `SOLICITUD_INVALIDA`, mensaje
     `"Los datos de la cotización no tienen el formato esperado"`, `detalle` = `[{ ruta, mensaje }]`.
  2. `validarParaPdf` con problemas → 422 `BORRADOR_INCOMPLETO`, mensaje = los mensajes unidos con
     `". "`, `detalle` = los problemas. **No se lee el catálogo.**
  3. `deps.obtenerCatalogo()` lanza → 502 `SHOPIFY_NO_DISPONIBLE`,
     `"No se pudo leer el catálogo de la web. Probá de nuevo en un rato."`.
  4. `calcularTotales` da `ok: false` → 409 `PRODUCTO_NO_DISPONIBLE`, `detalle: { productoIds }`.
  5. Algún `precioVistoCentavos` distinto del precio actual → 409 `PRECIO_CAMBIO`, mensaje
     `"Cambió el precio en la web de: <títulos separados por coma>"`, `detalle` =
     `[{ productoId, titulo, antesCentavos, ahoraCentavos }]`.
  6. Fotos en paralelo con `descargarImagen(imagenUrl, deps.fetchImagen)` solo para ítems con
     `mostrarFoto`; membrete (`membrete-fh-a4.jpg`, jpg) y logo (`mi-maquinaria.png`, png) con `leerAsset`.
  7. `renderizarPdf(...)` y `nombreArchivo(tipoDocumento, cliente, título de la primera línea, fecha)`.

`src/app/api/pdf/route.ts`
- `export const runtime = "nodejs"; export const dynamic = "force-dynamic";`
- `POST`: si `request.json()` falla → 400 `{ error: { codigo: "SOLICITUD_INVALIDA", mensaje: "El cuerpo de la solicitud no es JSON" } }`.
  Si no, `generarPdf(cuerpo, dependenciasReales())`: error → `{ error: { codigo, mensaje, detalle } }`
  con su estado; éxito → 200 con el PDF, `content-type: application/pdf`,
  `content-disposition: contentDisposition(nombre)` y `cache-control: no-store`.
- `next.config.ts` (ya copiado de `workspace/`) incluye `src/lib/pdf/assets/**` en el trazado de
  `/api/pdf` y deja `@react-pdf/renderer` como paquete externo del servidor. No lo cambies.

**Files**
- `src/lib/pdf/generar.ts` — nuevo
- `src/app/api/pdf/route.ts` — nuevo
- `tests/unit/api-pdf.test.ts` — nuevo

`tests/unit/api-pdf.test.ts`
```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/pdf/route";
import { normalizarCatalogo } from "@/lib/catalogo/normalizar";
import { ErrorCatalogo } from "@/lib/catalogo/shopify";
import { type Borrador, crearBorradorVacio, crearEmisorPorDefecto } from "@/lib/cotizacion/tipos";
import { type Dependencias, generarPdf } from "@/lib/pdf/generar";

const catalogo = normalizarCatalogo(
  JSON.parse(readFileSync("tests/fixtures/productos-shopify.json", "utf8")),
);
const FARMTRAC = 50605744423200;
const foto = readFileSync("tests/fixtures/foto.jpg");

function deps(extra: Partial<Dependencias> = {}): Dependencias {
  return {
    obtenerCatalogo: async () => catalogo,
    fetchImagen: async () => new Response(foto, { headers: { "content-type": "image/jpeg" } }),
    ahora: () => new Date("2026-09-11T15:00:00Z"),
    leerAsset: async (nombre) => readFileSync(`src/lib/pdf/assets/${nombre}`),
    ...extra,
  };
}

function cotizacion(precioVistoCentavos = 1790000): Borrador {
  return {
    ...crearBorradorVacio(),
    items: [
      {
        productoId: FARMTRAC,
        cantidad: 1,
        descuento: null,
        lineasOcultas: [],
        mostrarFoto: true,
        precioVistoCentavos,
      },
    ],
    entrega: { tipo: "dias", dias: 30 },
  };
}

const emisor = crearEmisorPorDefecto();

describe("generarPdf", () => {
  it("genera el PDF y su nombre de archivo", async () => {
    const r = await generarPdf({ borrador: cotizacion(), emisor }, deps());
    if (!r.ok) throw new Error(r.mensaje);
    expect(r.pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(r.nombre).toBe(
      "Cotización - Sin cliente - Farmtrac FT 6050 - 50HP - 4x4 - 2026-09-11.pdf",
    );
  });
  it("400 si la solicitud no tiene el formato esperado", async () => {
    expect(await generarPdf({ hola: 1 }, deps())).toMatchObject({
      ok: false,
      estado: 400,
      codigo: "SOLICITUD_INVALIDA",
    });
  });
  it("422 si falta el plazo de entrega, sin leer el catálogo", async () => {
    let leido = false;
    const borrador = { ...cotizacion(), entrega: null };
    const r = await generarPdf(
      { borrador, emisor },
      deps({
        obtenerCatalogo: async () => {
          leido = true;
          return catalogo;
        },
      }),
    );
    expect(r).toMatchObject({ ok: false, estado: 422, codigo: "BORRADOR_INCOMPLETO" });
    expect(leido).toBe(false);
  });
  it("409 PRECIO_CAMBIO si el precio de la web cambió desde que se armó", async () => {
    const r = await generarPdf({ borrador: cotizacion(1700000), emisor }, deps());
    expect(r).toMatchObject({
      ok: false,
      estado: 409,
      codigo: "PRECIO_CAMBIO",
      detalle: [{ productoId: FARMTRAC, antesCentavos: 1700000, ahoraCentavos: 1790000 }],
    });
  });
  it("409 PRODUCTO_NO_DISPONIBLE si el producto ya no está en la web", async () => {
    const r = await generarPdf(
      { borrador: cotizacion(), emisor },
      deps({ obtenerCatalogo: async () => [] }),
    );
    expect(r).toMatchObject({ ok: false, estado: 409, codigo: "PRODUCTO_NO_DISPONIBLE" });
  });
  it("502 si la web de Shopify no responde", async () => {
    const r = await generarPdf(
      { borrador: cotizacion(), emisor },
      deps({
        obtenerCatalogo: async () => {
          throw new ErrorCatalogo("SHOPIFY_NO_DISPONIBLE", "sin conexión");
        },
      }),
    );
    expect(r).toMatchObject({ ok: false, estado: 502, codigo: "SHOPIFY_NO_DISPONIBLE" });
  });
  it("si una foto no se puede bajar, igual genera el PDF", async () => {
    const r = await generarPdf(
      { borrador: cotizacion(), emisor },
      deps({ fetchImagen: async () => new Response("no", { status: 404 }) }),
    );
    expect(r.ok).toBe(true);
  });
});

describe("POST /api/pdf", () => {
  it("400 con un cuerpo que no es JSON", async () => {
    const r = await POST(new Request("http://localhost/api/pdf", { method: "POST", body: "{x" }));
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({
      error: { codigo: "SOLICITUD_INVALIDA", mensaje: "El cuerpo de la solicitud no es JSON" },
    });
  });
  it("422 con el sobre de error cuando falta información", async () => {
    const cuerpo = JSON.stringify({ borrador: crearBorradorVacio(), emisor });
    const r = await POST(new Request("http://localhost/api/pdf", { method: "POST", body: cuerpo }));
    expect(r.status).toBe(422);
    const json = await r.json();
    expect(json.error.codigo).toBe("BORRADOR_INCOMPLETO");
    expect(json.error.mensaje).toBe("Agregá al menos un producto. Elegí el plazo de entrega");
  });
});
```

**Acceptance**

1. **WHEN** `generarPdf` recibe una solicitud válida **THE SYSTEM SHALL** devolver el PDF y el nombre «Cotización - Sin cliente - Farmtrac FT 6050 - 50HP - 4x4 - 2026-09-11.pdf».
2. **WHEN** el cuerpo no es JSON o no cumple el esquema **THE SYSTEM SHALL** responder 400 con `{ error: { codigo: "SOLICITUD_INVALIDA" } }`.
3. **WHEN** falta el plazo de entrega **THE SYSTEM SHALL** responder 422 `BORRADOR_INCOMPLETO` sin leer el catálogo.
4. **WHEN** el precio de la web cambió desde que se armó la cotización **THE SYSTEM SHALL** responder 409 `PRECIO_CAMBIO` con el precio anterior y el nuevo en centavos.
5. **WHEN** Shopify no responde **THE SYSTEM SHALL** responder 502 `SHOPIFY_NO_DISPONIBLE`.
6. **WHEN** corre `npm run build` **THE SYSTEM SHALL** incluir `membrete-fh-a4.jpg` en el trazado de archivos de la función /api/pdf.

**Verify**

```bash
npm run typecheck
npm run lint
npx vitest run tests/unit/api-pdf.test.ts
npm run build
grep -q membrete-fh-a4.jpg .next/server/app/api/pdf/route.js.nft.json
node scripts/probar-servidor.mjs "POST /api/pdf 401 contiene=SIN_ACCESO" "POST /api/pdf 400 acceso cuerpo=tests/fixtures/solicitud-invalida.txt contiene=SOLICITUD_INVALIDA" "POST /api/pdf 422 acceso cuerpo=tests/fixtures/solicitud-incompleta.json contiene=BORRADOR_INCOMPLETO"
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T2: ruta POST /api/pdf"
git tag step-09-api-pdf
```

### `E2-T3` — Pantalla de armado: cliente, buscador e ítems

**Depends on:** `E1-T2`, `E1-T6` · **Priority:** p0 — metadato para recortes de alcance, no un orden

Primera mitad de la pantalla, mobile-first, en una sola columna (`max-w-2xl`, fondo `bg-fondo`,
tarjetas `bg-superficie rounded-xl border border-borde p-4`, controles de 44px o más).

**Contrato de la interfaz** (nombres accesibles exactos; los usa `tests/e2e/cotizacion.spec.ts`):

| Componente | Elemento | Rol | Nombre accesible |
|---|---|---|---|
| Cotizador | título | heading nivel 1 | `FH Cotizador` |
| Cotizador | tipo de documento | radios dentro de un grupo «Tipo de documento» | `Cotización`, `Factura proforma` |
| Cotizador | deshacer | button | `Deshacer` (deshabilitado si no hay pasos) |
| Cotizador | empezar de cero | button | `Nueva cotización` (pide confirmación con `window.confirm("¿Empezar una cotización nueva? Se borra la actual.")`) |
| DatosCliente | tipo de cliente | radios | `Sin cliente`, `Empresa`, `Persona` |
| DatosCliente | campos | textbox | `Razón social`, `RUT` (empresa) · `Nombre`, `Cédula` (persona) |
| BuscadorProductos | búsqueda | searchbox (`input type="search"`) | `Buscar producto` |
| BuscadorProductos | cada resultado | button | `<título> · <U$S precio>` (más «Revisar IVA» si `sospechaIva`) |
| ItemCotizacion | cantidad | buttons | `Menos uno <título>`, `Más uno <título>` |
| ItemCotizacion | quitar | button | `Quitar <título>` |
| ItemCotizacion | foto | checkbox | `Mostrar foto de <título>` |
| ItemCotizacion | descripción | button (abre y cierra la lista) | `Descripción de <título>` |
| ItemCotizacion | cada línea | checkbox (marcado = se ve en el PDF) | el texto de la línea |
| ItemCotizacion | ocultar todo | button | `Ocultar toda la descripción de <título>` |
| ItemCotizacion | descuento | combobox + spinbutton | `Descuento de <título>` (opciones `Sin descuento`, `Porcentaje`, `Monto en U$S`) · `Valor del descuento de <título>` |
| Condiciones (E2-T4) | validez | spinbutton | `Validez (días)` |
| Condiciones (E2-T4) | entrega | radios · spinbutton · textbox | `Entrega inmediata`, `En días`, `Otro` · `Días de entrega` · `Texto de entrega` |
| Condiciones (E2-T4) | descuento general | combobox + spinbutton | `Descuento general` · `Valor del descuento general` |
| Condiciones (E2-T4) | notas | textbox + button · button | `Nota para el PDF` + `Agregar nota` · `Quitar nota <n>` |
| Interprete (E2-T4) | pedido | textbox + button | `Pedile algo` + `Aplicar` |
| Interprete (E2-T4) | resultado | **única** región `role="status"` | muestra el resumen o el mensaje |
| Interprete (E2-T4) | opciones de «elegir» | buttons | la `etiqueta` de cada opción |
| AjustesDispositivo (E2-T4) | abrir | button | `Ajustes del dispositivo` |
| AjustesDispositivo (E2-T4) | campos | radios · textbox · button | `San Jacinto`, `Montevideo` · `Tu nombre`, `Tu celular` · `Guardar` |
| BarraTotal (E2-T5) | total | texto | `Total U$S …` |
| BarraTotal (E2-T5) | generar | button | `Generar PDF` (deshabilitado con problemas o mientras genera: texto `Generando…`) |
| BarraTotal (E2-T5) | resultado | buttons | `Descargar`, `Compartir` (solo si `navigator.canShare({ files })`) |
| BarraTotal (E2-T5) | precio cambiado | button | `Usar precios nuevos` |

Qué hace cada archivo en esta tarea:
- `src/app/page.tsx` (servidor, `export const dynamic = "force-dynamic"`): `await obtenerCatalogo()` y
  renderiza `<Cotizador catalogo={catalogo} />`. Si lanza, muestra `<main>` con el título, el texto
  «No se pudo cargar el catálogo de la web.» y un enlace «Reintentar» a `/`.
- `Cotizador.tsx` (`"use client"`): estado `Historial` con `crearHistorial`; al montar (`useEffect`)
  carga `leerBorrador(window.localStorage)` y `leerEmisor(window.localStorage)`; guarda el borrador en
  cada cambio. Expone `despachar(acciones: Accion[])` = `conHistorial`. Renderiza la cabecera
  (título, `Deshacer`, `Nueva cotización`), el tipo de documento, `DatosCliente`, `BuscadorProductos`
  y un `ItemCotizacion` por ítem; sin ítems muestra «Todavía no agregaste productos».
- `DatosCliente.tsx`: radios de tipo de cliente y campos; cada cambio despacha `{ tipo: "cliente" }`.
  Muestra debajo, en `text-error`, las advertencias de RUT o cédula (`advertencias`).
- `BuscadorProductos.tsx`: con 2 caracteres o más muestra hasta 8 resultados de
  `buscarProductos(consulta, catalogo, { enBorrador })`; tocar uno despacha `agregar` (cantidad 1) y
  limpia la búsqueda; sin resultados muestra «No hay productos con esa búsqueda».
- `ItemCotizacion.tsx`: título, precio, cantidad, descuento del ítem, foto, descripción desplegable con
  una casilla por línea (despacha `ocultarLinea`) y «Ocultar toda la descripción» (despacha un
  `ocultarLinea` por cada línea en un solo `despachar`: un solo paso de Deshacer). Las casillas de las
  secciones de venta arrancan destildadas porque el reducer las agrega ocultas. Si el producto
  tiene `sospechaIva`, muestra «Revisar IVA en Shopify» en `text-error`.

**Files**
- `src/app/page.tsx` — edita (reemplaza el marcador)
- `src/components/cotizador/Cotizador.tsx` — nuevo
- `src/components/cotizador/DatosCliente.tsx` — nuevo
- `src/components/cotizador/BuscadorProductos.tsx` — nuevo
- `src/components/cotizador/ItemCotizacion.tsx` — nuevo

**Acceptance**

1. **WHEN** el servidor armado recibe GET / con la cookie de acceso **THE SYSTEM SHALL** responder 200 con el campo «Buscar producto» y títulos del catálogo de la web en el HTML (por ejemplo «Farmtrac»).
2. **WHEN** corren `npm run typecheck` y `npm run lint` con los componentes nuevos **THE SYSTEM SHALL** terminar con código 0.
3. **WHEN** corre `npm test` **THE SYSTEM SHALL** pasar todos los tests unitarios con 0 fallas.

**Verify**

```bash
npm run typecheck
npm run lint
npm test
npm run build
node scripts/probar-servidor.mjs "GET / 200 acceso contiene='Buscar producto'" "GET / 200 acceso contiene=Farmtrac"
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T3: pantalla de armado: cliente, buscador e ítems"
git tag step-10-armado
```

### `E2-T4` — Condiciones, intérprete y ajustes del dispositivo

**Depends on:** `E2-T3`, `E1-T7` · **Priority:** p0 — metadato para recortes de alcance, no un orden

Segunda mitad de la pantalla. Usá los nombres del contrato de E2-T3.

- `Condiciones.tsx`: `Validez (días)` (1–365, despacha `validez`); entrega **sin opción marcada al
  empezar** (`Entrega inmediata` → `{ tipo: "inmediata" }`; `En días` muestra `Días de entrega`;
  `Otro` muestra `Texto de entrega`); descuento general; notas (`Agregar nota`, `Quitar nota <n>`).
  Abajo, fijo: «Forma de pago: contado o financiado con Mi Maquinaria by Santander.» (`TEXTO_FORMA_DE_PAGO`).
- `Interprete.tsx`: formulario con `Pedile algo` y `Aplicar` (Enter también aplica). Llama a
  `interpretar(texto, { borrador, catalogo })`: `ok` → `despachar(acciones)`, muestra el resumen
  (líneas separadas) en la región `role="status"` y limpia el texto; `elegir` → muestra la pregunta y
  un botón por opción (tocar uno despacha sus acciones y muestra su resumen); `no-entendi` → muestra
  el mensaje y deja el texto para corregirlo. Debajo, ejemplos en `text-texto-suave`: «agregale la
  pala», «5% de descuento», «validez 15 días», «entrega inmediata», «hacela proforma».
- `AjustesDispositivo.tsx`: botón `Ajustes del dispositivo` que abre un `<dialog>` con sucursal
  (`San Jacinto` / `Montevideo`), `Tu nombre`, `Tu celular` y `Guardar` (`guardarEmisor`). Estos datos
  van al pie del PDF («Atendido por») y al lugar de la fecha. Al escribir un nombre que está en
  `CELULARES_VENDEDORES` (hoy «Joaquín» → «092 469 449»), «Tu celular» se completa con
  `celularDelVendedor`; el PDF usa ese número fijo aunque el aparato tenga otro guardado.
- `Cotizador.tsx`: monta los tres componentes y guarda el `Emisor` en su estado.

**Files**
- `src/components/cotizador/Condiciones.tsx` — nuevo
- `src/components/cotizador/Interprete.tsx` — nuevo
- `src/components/cotizador/AjustesDispositivo.tsx` — nuevo
- `src/components/cotizador/Cotizador.tsx` — edita

**Acceptance**

1. **WHEN** el servidor armado recibe GET / con la cookie de acceso **THE SYSTEM SHALL** incluir en el HTML el cuadro «Pedile algo», la opción «Entrega inmediata» y el botón «Ajustes del dispositivo».
2. **WHEN** corren `npm run typecheck`, `npm run lint` y `npm test` **THE SYSTEM SHALL** terminar con código 0.

**Verify**

```bash
npm run typecheck
npm run lint
npm test
npm run build
node scripts/probar-servidor.mjs "GET / 200 acceso contiene='Pedile algo'" "GET / 200 acceso contiene='Entrega inmediata'" "GET / 200 acceso contiene='Ajustes del dispositivo'"
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T4: condiciones, intérprete y ajustes del dispositivo"
git tag step-11-condiciones
```

### `E2-T5` — Generar, compartir y descargar el PDF, con e2e

**Depends on:** `E2-T4`, `E2-T2` · **Priority:** p0 — metadato para recortes de alcance, no un orden

`BarraTotal.tsx`, fija abajo en el celular (`sticky bottom-0`):
- «Total U$S …» con `calcularTotales` (sobre el catálogo que ya tiene la página).
- Lista de problemas de `validarParaPdf` (texto normal) y de advertencias (`text-error`).
- `Generar PDF`: deshabilitado si hay problemas o si está generando («Generando…»). Hace
  `fetch("/api/pdf", { method: "POST", headers: { "content-type": "application/json" }, body:
  JSON.stringify({ borrador, emisor }) })`.
  - 200: arma un `File` con el blob y el nombre del header `content-disposition` (`filename*=UTF-8''…`,
    decodificado). Muestra `Descargar` (enlace temporal con `URL.createObjectURL` y `download`) y
    `Compartir` solo si `navigator.canShare?.({ files: [archivo] })` es verdadero (`navigator.share`
    abre WhatsApp, mail, etc. en el celular).
  - 409 `PRECIO_CAMBIO`: muestra el mensaje y `Usar precios nuevos`, que despacha un
    `actualizarPrecio` por cada ítem de `detalle` en un solo paso.
  - 401: muestra «Tu acceso venció» con un enlace a `/acceso`.
  - otro error: muestra `error.mensaje`.
- `Cotizador.tsx`: monta `BarraTotal` al final.

`tests/e2e/cotizacion.spec.ts` (tal cual):

```ts
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const clave = process.env.ACCESS_KEY ?? "";
  await page.goto(`/api/acceso?k=${encodeURIComponent(clave)}`);
  await expect(page.getByRole("heading", { name: "FH Cotizador" })).toBeVisible();
});

test("arma una cotización con descuento y genera el PDF", async ({ page }) => {
  await page.getByRole("searchbox", { name: "Buscar producto" }).fill("farmtrac 6050");
  await page.getByRole("button", { name: /Farmtrac FT 6050/ }).click();
  await page.getByRole("radio", { name: "Entrega inmediata" }).check();
  await page.getByRole("textbox", { name: "Pedile algo" }).fill("5% de descuento");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.getByRole("status")).toContainText("Descuento general 5%");
  const respuesta = page.waitForResponse((r) => r.url().endsWith("/api/pdf"));
  await page.getByRole("button", { name: "Generar PDF" }).click();
  const r = await respuesta;
  expect(r.status()).toBe(200);
  expect(r.headers()["content-type"]).toBe("application/pdf");
  await expect(page.getByRole("button", { name: "Descargar" })).toBeVisible();
});

test("la factura proforma sin cliente no se puede generar", async ({ page }) => {
  await page.getByRole("radio", { name: "Factura proforma" }).check();
  await page.getByRole("searchbox", { name: "Buscar producto" }).fill("retro");
  await page.getByRole("button", { name: /Retroexcavadora LW-6/ }).click();
  await page.getByRole("radio", { name: "Entrega inmediata" }).check();
  await expect(page.getByText("La factura proforma necesita los datos del cliente")).toBeVisible();
  await expect(page.getByRole("button", { name: "Generar PDF" })).toBeDisabled();
});

test("deshacer vuelve atrás el último pedido", async ({ page }) => {
  await page.getByRole("textbox", { name: "Pedile algo" }).fill("validez 15 días");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.getByRole("spinbutton", { name: "Validez (días)" })).toHaveValue("15");
  await page.getByRole("button", { name: "Deshacer" }).click();
  await expect(page.getByRole("spinbutton", { name: "Validez (días)" })).toHaveValue("30");
});
```

**Files**
- `src/components/cotizador/BarraTotal.tsx` — nuevo
- `src/components/cotizador/Cotizador.tsx` — edita
- `tests/e2e/cotizacion.spec.ts` — nuevo

**Acceptance**

1. **WHEN** se busca «farmtrac 6050», se agrega, se elige «Entrega inmediata», se escribe «5% de descuento» en «Pedile algo» y se toca «Aplicar» **THE SYSTEM SHALL** mostrar «Descuento general 5%» en la zona de estado.
2. **WHEN** después se toca «Generar PDF» **THE SYSTEM SHALL** recibir de /api/pdf un 200 `application/pdf` y mostrar el botón «Descargar».
3. **WHEN** es factura proforma sin cliente **THE SYSTEM SHALL** mostrar «La factura proforma necesita los datos del cliente» y dejar deshabilitado «Generar PDF».
4. **WHEN** se escribe «validez 15 días», se aplica y después se toca «Deshacer» **THE SYSTEM SHALL** volver a mostrar 30 en «Validez (días)».

**Verify**

```bash
npm run typecheck
npm run lint
npm run test:e2e
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T5: generar, compartir y descargar el PDF, con e2e"
git tag step-12-generar
```

### `E2-T6` — Ícono en el celular y revisión de etiquetas de IVA

**Depends on:** `E1-T2`, `E1-T4` · **Priority:** p1 — metadato para recortes de alcance, no un orden

La app se instala en la pantalla de inicio (Android: menú ⋮ → «Agregar a la pantalla principal»;
iPhone: Compartir → «Agregar a inicio»). Los íconos ya están en `public/icons/` y en `src/app/`
(`icon.png`, `apple-icon.png`). El script lista qué productos tienen la etiqueta de IVA y cuáles
parecen necesitarla, para que Joaquín la cargue en Shopify.

`src/app/manifest.ts` (tal cual):
```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FH Cotizador",
    short_name: "Cotizador",
    description: "Cotizaciones y facturas proforma de Florencio Hernández",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f6f8",
    theme_color: "#0c2641",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
```

`src/app/layout.tsx`: agregá a `metadata` exactamente esta propiedad (el resto no cambia):
```ts
  appleWebApp: { capable: true, title: "FH Cotizador", statusBarStyle: "default" },
```

`scripts/revisar-iva.mts` (tal cual):
```ts
// Lista qué productos tienen la etiqueta iva-incluido y cuáles parecen necesitarla.
// Uso: npm run iva:revisar            (lee la web)
//      npm run iva:revisar -- --fixture tests/fixtures/productos-shopify.json
import { readFileSync } from "node:fs";
import { normalizarCatalogo, type Producto } from "@/lib/catalogo/normalizar";
import { obtenerCatalogo } from "@/lib/catalogo/shopify";

function argumento(nombre: string): string | undefined {
  const i = process.argv.indexOf(nombre);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function cargar(): Promise<Producto[]> {
  const fixture = argumento("--fixture");
  if (fixture) return normalizarCatalogo(JSON.parse(readFileSync(fixture, "utf8")));
  return obtenerCatalogo();
}

const productos = await cargar();
const conIva = productos.filter((p) => p.ivaIncluido);
const sospechosos = productos.filter((p) => p.sospechaIva);
console.log(`Con la etiqueta iva-incluido (${conIva.length}):`);
for (const p of conIva) console.log(`  + ${p.titulo}`);
console.log(`Parecen llevar IVA pero no tienen la etiqueta (${sospechosos.length}):`);
for (const p of sospechosos) console.log(`  ! ${p.titulo}`);
console.log(
  sospechosos.length === 0
    ? "Todo en orden."
    : "Revisalos en Shopify y agregá la etiqueta iva-incluido a los que correspondan.",
);
```

**Files**
- `src/app/manifest.ts` — nuevo
- `src/app/layout.tsx` — edita
- `scripts/revisar-iva.mts` — nuevo

**Acceptance**

1. **WHEN** se pide /manifest.webmanifest sin cookie **THE SYSTEM SHALL** responder 200 con el nombre «FH Cotizador», `display: standalone` e íconos de 192 y 512 px.
2. **WHEN** se piden /icons/icon-192.png y /icon.png sin cookie **THE SYSTEM SHALL** responder 200 con `image/png`.
3. **WHEN** corre `npm run iva:revisar -- --fixture tests/fixtures/productos-shopify.json` **THE SYSTEM SHALL** listar «Retroexcavadora LW-6» entre los productos que parecen llevar IVA sin la etiqueta.

**Verify**

```bash
npm run typecheck
npm run lint
npm run build
node scripts/probar-servidor.mjs "GET /manifest.webmanifest 200 contiene='FH Cotizador'" "GET /manifest.webmanifest 200 contiene=standalone" "GET /icons/icon-192.png 200 tipo=image/png" "GET /icon.png 200 tipo=image/png"
npm run iva:revisar -- --fixture tests/fixtures/productos-shopify.json | grep -q "Retroexcavadora LW-6"
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T6: ícono en el celular y revisión de etiquetas de IVA"
git tag step-13-app-celular
```

### `E2-T7` — README de uso y deploy, y gate final

**Depends on:** `E2-T5`, `E2-T6` · **Priority:** p1 — metadato para recortes de alcance, no un orden

`README.md` en castellano, para Joaquín (no para desarrolladores), con estas secciones:
1. **Qué es** — una línea.
2. **Cómo se entra** — el link `https://<tu-app>.vercel.app/api/acceso?k=<ACCESS_KEY>` se manda por
   WhatsApp una vez; cómo agregarla a la pantalla de inicio (Android y iPhone); si se cambia la
   `ACCESS_KEY`, todos tienen que volver a abrir el link nuevo.
3. **Cómo se publica en Vercel (gratis)** — crear el repositorio en GitHub, "Add New → Project" en
   Vercel con el plan Hobby, Framework Next.js sin cambios, variable `ACCESS_KEY` (clave larga, 12
   caracteres o más) en Settings → Environment Variables, Deploy, y cómo volver a una versión anterior
   (Deployments → «Promote to Production» sobre la anterior).
4. **Precios, fotos y descripciones** — salen de la web; se corrigen en Shopify.
5. **IVA** — los productos que llevan IVA incluido se marcan en Shopify con la etiqueta `iva-incluido`
   (Productos → producto → Etiquetas); `npm run iva:revisar` lista los que parecen faltar.
6. **Membrete** — cómo reemplazar `src/lib/pdf/assets/membrete-fh-a4.jpg` (JPG A4 1240×1754, centro libre).
7. **Para desarrollar** — la tabla de comandos de `CLAUDE.md`.

**Files**
- `README.md` — nuevo

**Acceptance**

1. **WHEN** corre `npm run verificar` **THE SYSTEM SHALL** terminar con código 0 (tipos, lint, tests unitarios y build).
2. **WHEN** corre `npm run test:e2e` **THE SYSTEM SHALL** pasar todos los recorridos con 0 fallas.
3. **WHEN** se lee README.md **THE SYSTEM SHALL** encontrar las secciones de deploy en Vercel, la variable `ACCESS_KEY`, el link de acceso y la etiqueta `iva-incluido`.

**Verify**

```bash
npm run verificar
npm run test:e2e
grep -q "ACCESS_KEY" README.md
grep -q "iva-incluido" README.md
grep -q "/api/acceso?k=" README.md
grep -q "Vercel" README.md
node scripts/probar-servidor.mjs "GET /api/salud 200 contiene=fh-cotizador" "GET / 307 destino=/acceso" "GET / 200 acceso contiene='Buscar producto'" "POST /api/pdf 422 acceso cuerpo=tests/fixtures/solicitud-incompleta.json contiene=BORRADOR_INCOMPLETO" "GET /manifest.webmanifest 200 contiene='FH Cotizador'"
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T7: README de uso y deploy, y gate final"
git tag step-14-entrega
```

---

## Epic acceptance

El epic está hecho cuando todas las tareas están `done` **y**:

1. **WHEN** corre el gate completo **THE SYSTEM SHALL** pasar tipos, lint, los 9 archivos de tests unitarios, el build y los recorridos e2e.
2. **WHEN** el servidor armado recibe / y /api/pdf con la cookie de acceso **THE SYSTEM SHALL** responder 200 en / con «Buscar producto» y 422 `BORRADOR_INCOMPLETO` en /api/pdf para una solicitud incompleta.

```bash
npm run verificar
npm run test:e2e
node scripts/probar-servidor.mjs "GET / 200 acceso contiene='Buscar producto'" "POST /api/pdf 422 acceso cuerpo=tests/fixtures/solicitud-incompleta.json contiene=BORRADOR_INCOMPLETO"
```

## Pitfalls

- **`tsx` no puede cargar `@react-pdf/renderer`** (su dependencia `@react-pdf/hyphenate` solo exporta
  ESM y el cargador de `tsx` la resuelve como CommonJS): ningún script importa `src/lib/pdf/**`.
  Verificado en la preparación de este plan.
- **Fotos pesadas:** Shopify devuelve PNG de hasta 2,5 MB cuando la foto tiene transparencia, y react-pdf
  solo acepta JPG o PNG. Toda foto pasa por `prepararImagen` (sharp): sin eso, 3 productos pasan el
  límite de 4,5 MB de Vercel y el PDF falla en producción.
- **Una frase partida en `<Text>` anidados** hace que el test no la encuentre en el texto extraído.
- **Hidratación:** leer `localStorage` durante el render rompe la hidratación; hacelo en `useEffect`.
- **Más de un `role="status"`** rompe el e2e en modo estricto.
- **El e2e usa el catálogo real:** si Shopify saca el Farmtrac FT 6050 o la Retroexcavadora LW-6, hay
  que cambiar las búsquedas del spec por productos que existan.

## Before moving on

- [ ] Todas las tareas de este epic están `done` en `tasks.json`; ninguna quedó `in_progress`.
- [ ] Pasaron todos los comandos `verify` de todas las tareas, no solo el primero.
- [ ] No se editó ni se salteó ningún comando `verify`.
- [ ] Cada tarea tiene su tag (`git tag -l 'step-*'` lista 14, de `step-01-base` a `step-14-entrega`).
- [ ] El gate pasa limpio desde la raíz del proyecto.
- [ ] Existen todas las firmas de "Produced".
- [ ] No se tocó ningún archivo fuera del árbol de este epic.
- [ ] `.env.example` sigue con `ACCESS_KEY` como única variable.
- [ ] Un commit por tarea, con el id adelante, seguido de su tag.
