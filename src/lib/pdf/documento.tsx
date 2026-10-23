import {
  Document,
  Font,
  Image,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Linea } from "@/lib/catalogo/descripcion";
import type { Producto } from "@/lib/catalogo/normalizar";
import { aWinAnsi } from "@/lib/catalogo/winansi";
import { celularDelVendedor, TEXTO_FORMA_DE_PAGO } from "@/lib/config/negocio";
import { calcularPlanDePago, type PlanDePago } from "@/lib/cotizacion/calculo";
import type {
  Borrador,
  Cliente,
  Emisor,
  Entrega,
  LineaCalculada,
  Totales,
} from "@/lib/cotizacion/tipos";
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

// En columnas angostas react-pdf parte palabras ("com- bustible"): se desactiva.
Font.registerHyphenationCallback((palabra) => [palabra]);

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
  // Ficha larga: foto y precio en una columna a la izquierda, ficha técnica al lado.
  columnas: { flexDirection: "row", gap: "5mm" },
  columnaIzquierda: { width: "76mm" },
  columnaDerecha: { flex: 1 },
  marcoFoto: {
    backgroundColor: FONDO,
    borderWidth: 0.5,
    borderColor: BORDE,
    padding: "2mm",
    marginBottom: "3mm",
  },
  fotoColumna: { width: "100%", height: "70mm", objectFit: "contain" },
  precioDestacado: { backgroundColor: MARINO, padding: "3mm" },
  precioEtiqueta: { fontSize: 7.5, color: "#c9d3de", letterSpacing: 0.6 },
  precioGrande: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    lineHeight: 1.25,
    color: "#ffffff",
    marginTop: "0.5mm",
  },
  precioLinea: { fontSize: 8.5, color: "#dbe3ec" },
  precioIva: { fontSize: 7.5, color: DORADO, marginTop: "0.5mm" },
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
    fontSize: 9.5,
    color: MARINO,
    letterSpacing: 0.8,
    marginTop: "3mm",
    marginBottom: "1.5mm",
    paddingBottom: "1mm",
    borderBottomWidth: 1,
    borderBottomColor: DORADO,
  },
  fila: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: BORDE,
    paddingVertical: "0.7mm",
  },
  filaEtiqueta: { width: "38%", fontFamily: "Helvetica-Bold", fontSize: 9, paddingRight: "3mm" },
  filaGris: { backgroundColor: FONDO },
  filaRelleno: { paddingHorizontal: "1.5mm" },
  filaValor: { flex: 1, fontSize: 9 },
  parrafo: { fontSize: 9, marginBottom: "1.5mm" },
  filaApretada: { paddingVertical: "0.3mm" },
  textoApretado: { fontSize: 8.5 },
  parrafoApretado: { fontSize: 8.5, marginBottom: "1mm" },
  seccionApretada: { marginTop: "2mm", marginBottom: "0.5mm" },
  precios: {
    width: "72mm",
    marginLeft: "auto",
    padding: "3mm",
    borderWidth: 0.7,
    borderColor: BORDE,
    textAlign: "right",
  },
  importe: { fontFamily: "Helvetica-Bold", fontSize: 11, color: MARINO },
  iva: { fontSize: 8, color: SUAVE },
  cierre: { flexDirection: "row", gap: "6mm", marginTop: "7mm" },
  cierreIzquierda: { flex: 1 },
  cierreDerecha: { width: "74mm" },
  cierreTitulo: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: MARINO,
    letterSpacing: 0.8,
    marginBottom: "1.5mm",
    paddingBottom: "1mm",
    borderBottomWidth: 1,
    borderBottomColor: DORADO,
  },
  resumen: {
    marginTop: "0mm",
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
  toma: { fontSize: 9, marginTop: "1mm" },
  saldoLinea: { height: 0.7, backgroundColor: DORADO, marginTop: "1.5mm" },
  letras: { fontFamily: "Helvetica-Oblique", fontSize: 9 },
  condiciones: { marginTop: "4mm" },
  formaDePagoTitulo: { fontFamily: "Helvetica-Bold", color: MARINO, marginTop: "1.5mm" },
  logoPago: { width: "33mm", height: "9mm", marginTop: "1.5mm" },
  notas: { marginTop: "3mm" },
  atendido: { marginTop: "3mm", color: SUAVE },
});

const ETIQUETA_VALOR = /^([^:]{2,40}):\s+(.+)$/;

// Sin RUT ni cédula (organismos, instituciones) no se escribe la línea del documento.
function documentoCliente(cliente: Cliente): string {
  if (cliente.tipo === "empresa") return cliente.rut.trim() ? `RUT: ${cliente.rut.trim()}` : "";
  const cedula = cliente.cedula.trim();
  if (!cedula) return "";
  const r = validarCedula(cedula);
  return `C.I.: ${r.valido ? formatearCedula(r.normalizado) : cedula}`;
}

function textoPlanDePago(plan: PlanDePago, porcentaje: number): string[] {
  const cuotasIguales = plan.cuotaCentavos === plan.ultimaCuotaCentavos;
  const lineas = [
    `Entrega: ${porcentaje}% — ${formatearUSD(plan.entregaCentavos)}.`,
    cuotasIguales
      ? `Saldo: ${plan.cuotas} ${plan.cuotas === 1 ? "cuota" : "cuotas"} de ${formatearUSD(plan.cuotaCentavos)}.`
      : `Saldo: ${plan.cuotas - 1} de ${formatearUSD(plan.cuotaCentavos)} y una última de ${formatearUSD(plan.ultimaCuotaCentavos)}.`,
  ];
  return lineas;
}

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

function LineaDescripcion({
  linea,
  apretado,
  gris,
}: {
  linea: Linea;
  apretado: boolean;
  gris: boolean;
}) {
  const fila = [
    s.fila,
    s.filaRelleno,
    ...(apretado ? [s.filaApretada] : []),
    ...(gris ? [s.filaGris] : []),
  ];
  const etiqueta = apretado ? [s.filaEtiqueta, s.textoApretado] : [s.filaEtiqueta];
  const valor = apretado ? [s.filaValor, s.textoApretado] : [s.filaValor];
  if (linea.tipo === "titulo") {
    return (
      <Text style={apretado ? [s.seccion, s.seccionApretada] : [s.seccion]}>{linea.texto}</Text>
    );
  }
  const par = linea.texto.match(ETIQUETA_VALOR);
  if (par) {
    return (
      <View style={fila} wrap={false}>
        <Text style={etiqueta}>{par[1]}</Text>
        <Text style={valor}>{par[2]}</Text>
      </View>
    );
  }
  if (linea.tipo === "item") {
    return (
      <View style={fila} wrap={false}>
        <Text style={valor}>{linea.texto}</Text>
      </View>
    );
  }
  return <Text style={apretado ? [s.parrafo, s.parrafoApretado] : [s.parrafo]}>{linea.texto}</Text>;
}

// Con muchas líneas de ficha, el producto se arma en dos columnas para que el cierre (total y
// condiciones) entre en la misma hoja.
// Con foto y al menos tres líneas el producto va en dos columnas: la foto se ve grande y el cierre
// (total, condiciones y notas) entra en la misma hoja en vez de irse a la siguiente.
const LINEAS_PARA_DOS_COLUMNAS = 3;

function altoFoto(filas: number): string {
  return filas <= 8 ? "60mm" : "58mm";
}

function altoFotoColumna(filas: number): string {
  if (filas <= 8) return "80mm";
  if (filas <= 13) return "74mm";
  return "68mm";
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
  const propias = (item?.agregados ?? []).map((texto, n) => ({
    id: `A${n + 1}`,
    tipo: "item" as const,
    texto: aWinAnsi(texto),
    importante: true,
  }));
  const visibles = [
    ...(producto?.lineas ?? []).filter((l) => !item?.lineasOcultas.includes(l.id)),
    ...propias,
  ];
  const d = item?.descuento ?? null;
  const dosColumnas = Boolean(foto) && visibles.length >= LINEAS_PARA_DOS_COLUMNAS;
  const precioDestacado = (
    <View style={s.precioDestacado} wrap={false}>
      <Text style={s.precioEtiqueta}>PRECIO</Text>
      <Text style={s.precioGrande}>{`Importe: ${formatearUSD(linea.netoCentavos)}`}</Text>
      {linea.cantidad > 1 || linea.descuentoCentavos > 0 ? (
        <Text style={s.precioLinea}>
          {`Precio unitario: ${formatearUSD(linea.precioUnitarioCentavos)}`}
        </Text>
      ) : null}
      {linea.cantidad > 1 ? (
        <Text style={s.precioLinea}>{`Cantidad: ${linea.cantidad}`}</Text>
      ) : null}
      {linea.descuentoCentavos > 0 ? (
        <Text style={s.precioLinea}>
          {`Descuento${d?.tipo === "porcentaje" ? ` (${porcentaje(d.valor)}%)` : ""}: - ${formatearUSD(linea.descuentoCentavos)}`}
        </Text>
      ) : null}
      <Text style={s.precioIva}>{linea.ivaIncluido ? "IVA incluido" : "Exento de IVA"}</Text>
    </View>
  );
  const precios = (
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
  );
  let franja = 0;
  const descripcion = visibles.map((l) => {
    if (l.tipo !== "titulo") franja += 1;
    return (
      <LineaDescripcion
        key={l.id}
        linea={l}
        apretado={dosColumnas}
        gris={l.tipo !== "titulo" && franja % 2 === 0}
      />
    );
  });
  return (
    <View style={s.producto} break={!primera}>
      <Text style={s.productoTitulo}>{linea.titulo}</Text>
      <View style={s.barraChica} />
      {dosColumnas ? (
        <View style={s.columnas}>
          <View style={s.columnaIzquierda} wrap={false}>
            {foto ? (
              <View style={s.marcoFoto}>
                <Image
                  src={foto}
                  style={[s.fotoColumna, { height: altoFotoColumna(visibles.length) }]}
                />
              </View>
            ) : null}
            {precioDestacado}
          </View>
          <View style={s.columnaDerecha}>{descripcion}</View>
        </View>
      ) : (
        <>
          <View style={s.vista} wrap={false}>
            {foto ? (
              <Image src={foto} style={[s.foto, { height: altoFoto(visibles.length) }]} />
            ) : null}
            {precios}
          </View>
          {descripcion}
        </>
      )}
    </View>
  );
}

export function DocumentoCotizacion(datos: DatosPdf) {
  const { borrador, totales, emisor } = datos;
  const cliente = borrador.cliente;
  const general = borrador.descuentoGeneral;
  const celular = celularDelVendedor(emisor.vendedorNombre, emisor.vendedorCelular);
  const plan = calcularPlanDePago(totales.saldoCentavos, borrador.financiacion);
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
            {documentoCliente(cliente) ? <Text>{documentoCliente(cliente)}</Text> : null}
            {cliente.contacto.trim() ? (
              <Text>{`Atención: ${aWinAnsi(cliente.contacto)}`}</Text>
            ) : null}
          </View>
        ) : null}
        {totales.lineas.map((linea, indice) => (
          <HojaProducto key={linea.productoId} datos={datos} linea={linea} primera={indice === 0} />
        ))}
        <View style={s.cierre} wrap={false}>
          <View style={s.cierreIzquierda}>
            <Text style={s.cierreTitulo}>Condiciones</Text>
            <Text>{`Validez de la oferta: ${borrador.validezDias} días.`}</Text>
            <Text>{`Plazo de entrega: ${textoEntrega(borrador.entrega)}.`}</Text>
            {plan && borrador.financiacion ? (
              <>
                <Text style={s.formaDePagoTitulo}>Forma de pago</Text>
                {textoPlanDePago(plan, borrador.financiacion.entregaPorcentaje).map((l) => (
                  <Text key={l}>{l}</Text>
                ))}
              </>
            ) : (
              <>
                <Text style={s.formaDePagoTitulo}>Forma de pago</Text>
                <Text>{TEXTO_FORMA_DE_PAGO}</Text>
                <Image src={datos.logoPago} style={s.logoPago} />
              </>
            )}
            {borrador.notas.length > 0 ? (
              <View style={s.notas}>
                {borrador.notas.map((nota) => (
                  <Text key={nota}>{`• ${aWinAnsi(nota)}`}</Text>
                ))}
              </View>
            ) : null}
          </View>
          <View style={s.cierreDerecha}>
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
              {totales.tomaCentavos > 0 ? (
                <>
                  {borrador.tomas.map((toma) => (
                    <Text key={`${toma.detalle}-${toma.centavos}`} style={s.toma}>
                      {`Toma ${aWinAnsi(toma.detalle)}: - ${formatearUSD(toma.centavos)}`}
                    </Text>
                  ))}
                  <View style={s.saldoLinea} />
                  <Text
                    style={s.total}
                  >{`SALDO A PAGAR: ${formatearUSD(totales.saldoCentavos)}`}</Text>
                  <Text style={s.letras}>{`(${montoEnLetras(totales.saldoCentavos)})`}</Text>
                </>
              ) : (
                <Text style={s.letras}>{`(${montoEnLetras(totales.totalCentavos)})`}</Text>
              )}
              <Text style={s.iva}>{textoIva(totales.iva)}</Text>
            </View>
            {emisor.vendedorNombre.trim() ? (
              <Text style={s.atendido}>
                {`Atendido por: ${aWinAnsi(emisor.vendedorNombre)}${
                  celular ? ` · Cel. ${aWinAnsi(celular)}` : ""
                }`}
              </Text>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function renderizarPdf(datos: DatosPdf): Promise<Buffer> {
  return renderToBuffer(<DocumentoCotizacion {...datos} />);
}
