"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Producto } from "@/lib/catalogo/normalizar";
import { guardarBorrador, leerBorrador, leerEmisor } from "@/lib/cotizacion/persistencia";
import {
  type Accion,
  conHistorial,
  crearHistorial,
  deshacer,
  type Historial,
} from "@/lib/cotizacion/reducer";
import { crearEmisorPorDefecto, type Emisor, type TipoDocumento } from "@/lib/cotizacion/tipos";
import { advertencias } from "@/lib/cotizacion/validacion";
import { AjustesDispositivo } from "./AjustesDispositivo";
import { BarraTotal } from "./BarraTotal";
import { BuscadorProductos } from "./BuscadorProductos";
import { BOTON, TARJETA } from "./campos";
import { Condiciones } from "./Condiciones";
import { DatosCliente } from "./DatosCliente";
import { Interprete } from "./Interprete";
import { ItemCotizacion } from "./ItemCotizacion";

const TIPOS: { valor: TipoDocumento; etiqueta: string }[] = [
  { valor: "cotizacion", etiqueta: "Cotización" },
  { valor: "proforma", etiqueta: "Factura proforma" },
];

export function Cotizador({ catalogo }: { catalogo: Producto[] }) {
  const [historial, setHistorial] = useState<Historial>(() => crearHistorial());
  const [emisor, setEmisor] = useState<Emisor>(() => crearEmisorPorDefecto());
  const [cargado, setCargado] = useState(false);
  const borrador = historial.actual;

  useEffect(() => {
    const guardado = leerBorrador(window.localStorage);
    if (guardado) setHistorial(crearHistorial(guardado));
    setEmisor(leerEmisor(window.localStorage));
    setCargado(true);
  }, []);

  useEffect(() => {
    if (cargado) guardarBorrador(window.localStorage, borrador);
  }, [cargado, borrador]);

  const despachar = useCallback((acciones: Accion[]) => {
    setHistorial((h) => conHistorial(h, acciones));
  }, []);

  const porId = useMemo(() => new Map(catalogo.map((p) => [p.id, p])), [catalogo]);
  const enBorrador = useMemo(
    () => borrador.items.flatMap((i) => porId.get(i.productoId) ?? []),
    [borrador.items, porId],
  );
  const avisos = useMemo(() => advertencias(borrador, catalogo), [borrador, catalogo]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4 pb-40">
      <header className="-mx-4 -mt-4 flex flex-wrap items-center justify-between gap-2 bg-marino px-4 py-3 text-white">
        <h1 className="text-xl font-semibold">FH Cotizador</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`${BOTON} border-white/40 bg-transparent text-white hover:bg-marino-claro`}
            disabled={historial.pasado.length === 0}
            onClick={() => setHistorial(deshacer)}
          >
            Deshacer
          </button>
          <button
            type="button"
            className={`${BOTON} border-white/40 bg-transparent text-white hover:bg-marino-claro`}
            onClick={() => {
              if (window.confirm("¿Empezar una cotización nueva? Se borra la actual.")) {
                despachar([{ tipo: "nuevo" }]);
              }
            }}
          >
            Nueva cotización
          </button>
          <AjustesDispositivo emisor={emisor} alGuardar={setEmisor} />
        </div>
      </header>

      <section className={TARJETA}>
        <fieldset>
          <legend className="mb-2 text-lg font-semibold text-marino">Tipo de documento</legend>
          <div className="flex flex-wrap gap-2">
            {TIPOS.map((t) => (
              <label
                key={t.valor}
                className="flex min-h-11 items-center gap-2 rounded-lg border border-borde px-3"
              >
                <input
                  type="radio"
                  name="tipo-documento"
                  checked={borrador.tipoDocumento === t.valor}
                  onChange={() => despachar([{ tipo: "tipoDocumento", valor: t.valor }])}
                />
                {t.etiqueta}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <DatosCliente
        cliente={borrador.cliente}
        avisos={avisos.filter((a) => a.campo === "cliente")}
        despachar={despachar}
      />

      <BuscadorProductos catalogo={catalogo} enBorrador={enBorrador} despachar={despachar} />

      {borrador.items.length === 0 ? (
        <p className="text-center text-texto-suave">Todavía no agregaste productos</p>
      ) : (
        borrador.items.map((item) => (
          <ItemCotizacion
            key={item.productoId}
            item={item}
            producto={porId.get(item.productoId)}
            despachar={despachar}
          />
        ))
      )}

      <Interprete borrador={borrador} catalogo={catalogo} despachar={despachar} />

      <Condiciones borrador={borrador} despachar={despachar} />

      <BarraTotal borrador={borrador} emisor={emisor} catalogo={catalogo} despachar={despachar} />
    </main>
  );
}
