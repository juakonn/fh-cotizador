import type { Producto } from "@/lib/catalogo/normalizar";
import { validarCedula, validarRut } from "@/lib/documentos/identificacion";
import type { Borrador, Problema } from "./tipos";

export function validarParaPdf(borrador: Borrador): Problema[] {
  const problemas: Problema[] = [];
  if (borrador.items.length === 0) {
    problemas.push({ campo: "items", mensaje: "Agregá al menos un producto" });
  }
  if (!borrador.entrega) {
    problemas.push({ campo: "entrega", mensaje: "Elegí el plazo de entrega" });
  }
  const cliente = borrador.cliente;
  if (borrador.tipoDocumento === "proforma" && !cliente) {
    problemas.push({
      campo: "cliente",
      mensaje: "La factura proforma necesita los datos del cliente",
    });
  }
  if (cliente?.tipo === "empresa") {
    if (!cliente.razonSocial.trim())
      problemas.push({ campo: "cliente", mensaje: "Falta la razón social" });
    if (!cliente.rut.trim()) problemas.push({ campo: "cliente", mensaje: "Falta el RUT" });
  }
  if (cliente?.tipo === "persona") {
    if (!cliente.nombre.trim()) problemas.push({ campo: "cliente", mensaje: "Falta el nombre" });
    if (!cliente.cedula.trim()) problemas.push({ campo: "cliente", mensaje: "Falta la cédula" });
  }
  return problemas;
}

export function advertencias(borrador: Borrador, catalogo: Producto[]): Problema[] {
  const lista: Problema[] = [];
  const cliente = borrador.cliente;
  if (cliente?.tipo === "empresa" && cliente.rut.trim()) {
    const r = validarRut(cliente.rut);
    if (!r.valido) lista.push({ campo: "cliente", mensaje: `Revisá el RUT: ${r.motivo}` });
  }
  if (cliente?.tipo === "persona" && cliente.cedula.trim()) {
    const r = validarCedula(cliente.cedula);
    if (!r.valido) lista.push({ campo: "cliente", mensaje: `Revisá la cédula: ${r.motivo}` });
  }
  const porId = new Map(catalogo.map((p) => [p.id, p]));
  for (const item of borrador.items) {
    const producto = porId.get(item.productoId);
    if (producto?.sospechaIva) {
      lista.push({
        campo: "items",
        mensaje: `«${producto.titulo}» parece llevar IVA pero no tiene la etiqueta iva-incluido en Shopify`,
      });
    }
  }
  return lista;
}
