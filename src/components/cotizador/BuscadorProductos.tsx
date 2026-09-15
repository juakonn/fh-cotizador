"use client";

import { useId, useMemo, useState } from "react";
import type { Producto } from "@/lib/catalogo/normalizar";
import type { Accion } from "@/lib/cotizacion/reducer";
import { formatearUSD } from "@/lib/dinero/formato";
import { buscarProductos } from "@/lib/interprete/buscar";
import { CAMPO, TARJETA } from "./campos";

export function BuscadorProductos({
  catalogo,
  enBorrador,
  despachar,
}: {
  catalogo: Producto[];
  enBorrador: Producto[];
  despachar: (acciones: Accion[]) => void;
}) {
  const id = useId();
  const [consulta, setConsulta] = useState("");
  const resultados = useMemo(
    () =>
      consulta.trim().length >= 2
        ? buscarProductos(consulta, catalogo, { enBorrador }).slice(0, 8)
        : [],
    [consulta, catalogo, enBorrador],
  );

  return (
    <section className={TARJETA}>
      <label htmlFor={id} className="mb-2 block text-lg font-semibold text-marino">
        Productos
      </label>
      <input
        id={id}
        type="search"
        aria-label="Buscar producto"
        placeholder="Buscar producto (ej. farmtrac 6050, pala, rotativa)"
        value={consulta}
        onChange={(e) => setConsulta(e.target.value)}
        className={CAMPO}
      />
      {consulta.trim().length >= 2 ? (
        resultados.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-1">
            {resultados.map(({ producto }) => (
              <li key={producto.id}>
                <button
                  type="button"
                  onClick={() => {
                    despachar([{ tipo: "agregar", producto, cantidad: 1 }]);
                    setConsulta("");
                  }}
                  className="min-h-11 w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-fondo"
                >
                  {`${producto.titulo} · ${formatearUSD(producto.precioCentavos)}`}
                  {producto.sospechaIva ? <span className="text-error"> · Revisar IVA</span> : null}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-texto-suave">No hay productos con esa búsqueda</p>
        )
      ) : null}
    </section>
  );
}
