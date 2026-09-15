"use client";

import { useState } from "react";
import type { Producto } from "@/lib/catalogo/normalizar";
import type { Accion } from "@/lib/cotizacion/reducer";
import type { Item } from "@/lib/cotizacion/tipos";
import { formatearUSD } from "@/lib/dinero/formato";
import { BOTON, SelectorDescuento, TARJETA } from "./campos";

export function ItemCotizacion({
  item,
  producto,
  despachar,
}: {
  item: Item;
  producto: Producto | undefined;
  despachar: (acciones: Accion[]) => void;
}) {
  const [abierta, setAbierta] = useState(false);
  const id = item.productoId;

  if (!producto) {
    return (
      <article className={TARJETA}>
        <p className="text-error">Este producto ya no está en la web.</p>
        <button
          type="button"
          className={`${BOTON} mt-2`}
          onClick={() => despachar([{ tipo: "quitar", productoId: id }])}
        >
          Quitar producto
        </button>
      </article>
    );
  }

  const titulo = producto.titulo;
  const lineas = producto.lineas;
  const visibles = lineas.filter((l) => !item.lineasOcultas.includes(l.id)).length;

  return (
    <article className={`${TARJETA} flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-marino">{titulo}</h2>
          <p className="text-texto-suave">
            {`${formatearUSD(producto.precioCentavos)} · ${producto.ivaIncluido ? "IVA incluido" : "Exento de IVA"}`}
          </p>
          {producto.sospechaIva ? <p className="text-error">Revisar IVA en Shopify</p> : null}
        </div>
        <button
          type="button"
          aria-label={`Quitar ${titulo}`}
          className={`${BOTON} shrink-0 text-error`}
          onClick={() => despachar([{ tipo: "quitar", productoId: id }])}
        >
          Quitar
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Cantidad</span>
        <button
          type="button"
          aria-label={`Menos uno ${titulo}`}
          className={`${BOTON} w-11 px-0`}
          disabled={item.cantidad <= 1}
          onClick={() =>
            despachar([{ tipo: "cantidad", productoId: id, cantidad: item.cantidad - 1 }])
          }
        >
          −
        </button>
        <span className="min-w-8 text-center text-lg font-semibold">{item.cantidad}</span>
        <button
          type="button"
          aria-label={`Más uno ${titulo}`}
          className={`${BOTON} w-11 px-0`}
          disabled={item.cantidad >= 99}
          onClick={() =>
            despachar([{ tipo: "cantidad", productoId: id, cantidad: item.cantidad + 1 }])
          }
        >
          +
        </button>
      </div>

      <SelectorDescuento
        nombre={`Descuento de ${titulo}`}
        descuento={item.descuento}
        alCambiar={(descuento) => despachar([{ tipo: "descuentoItem", productoId: id, descuento }])}
      />

      <label className="flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          aria-label={`Mostrar foto de ${titulo}`}
          checked={item.mostrarFoto}
          disabled={!producto.imagenUrl}
          onChange={(e) =>
            despachar([{ tipo: "mostrarFoto", productoId: id, mostrar: e.target.checked }])
          }
        />
        {producto.imagenUrl ? "Foto en el PDF" : "Sin foto en la web"}
      </label>

      {lineas.length > 0 ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-label={`Descripción de ${titulo}`}
            aria-expanded={abierta}
            className={`${BOTON} text-left`}
            onClick={() => setAbierta(!abierta)}
          >
            {`${abierta ? "▾" : "▸"} Descripción (${visibles} de ${lineas.length} líneas en el PDF)`}
          </button>
          {abierta ? (
            <>
              <button
                type="button"
                aria-label={`Ocultar toda la descripción de ${titulo}`}
                className={BOTON}
                onClick={() =>
                  despachar(
                    lineas.map((l) => ({
                      tipo: "ocultarLinea" as const,
                      productoId: id,
                      lineaId: l.id,
                      oculta: true,
                    })),
                  )
                }
              >
                Ocultar toda la descripción
              </button>
              <ul className="flex flex-col gap-1">
                {lineas.map((l) => (
                  <li key={l.id}>
                    <label className="flex min-h-11 items-start gap-2 py-1">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={!item.lineasOcultas.includes(l.id)}
                        onChange={(e) =>
                          despachar([
                            {
                              tipo: "ocultarLinea",
                              productoId: id,
                              lineaId: l.id,
                              oculta: !e.target.checked,
                            },
                          ])
                        }
                      />
                      <span className={l.tipo === "titulo" ? "font-semibold" : ""}>{l.texto}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
