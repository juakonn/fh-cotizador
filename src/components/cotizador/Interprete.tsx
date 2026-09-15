"use client";

import { useId, useState } from "react";
import type { Producto } from "@/lib/catalogo/normalizar";
import type { Accion } from "@/lib/cotizacion/reducer";
import type { Borrador } from "@/lib/cotizacion/tipos";
import { interpretar, type Opcion } from "@/lib/interprete/interpretar";
import { BOTON, BOTON_PRINCIPAL, CAMPO, TARJETA } from "./campos";

type Mensaje =
  | { tipo: "resumen"; lineas: string[] }
  | { tipo: "error"; texto: string }
  | { tipo: "elegir"; pregunta: string; opciones: Opcion[] }
  | null;

const EJEMPLOS = [
  "agregale la pala",
  "5% de descuento",
  "validez 15 días",
  "entrega inmediata",
  "hacela proforma",
];

export function Interprete({
  borrador,
  catalogo,
  despachar,
}: {
  borrador: Borrador;
  catalogo: Producto[];
  despachar: (acciones: Accion[]) => void;
}) {
  const id = useId();
  const [texto, setTexto] = useState("");
  const [mensaje, setMensaje] = useState<Mensaje>(null);

  const aplicar = () => {
    if (!texto.trim()) return;
    const r = interpretar(texto, { borrador, catalogo });
    if (r.estado === "ok") {
      despachar(r.acciones);
      setMensaje({ tipo: "resumen", lineas: r.resumen });
      setTexto("");
    } else if (r.estado === "elegir") {
      setMensaje({ tipo: "elegir", pregunta: r.pregunta, opciones: r.opciones });
    } else {
      setMensaje({ tipo: "error", texto: r.mensaje });
    }
  };

  return (
    <section className={`${TARJETA} flex flex-col gap-2`}>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          aplicar();
        }}
      >
        <label htmlFor={id} className="text-lg font-semibold text-marino">
          Pedile algo
        </label>
        <div className="flex gap-2">
          <input
            id={id}
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ej.: agregale la pala y 5% de descuento"
            className={CAMPO}
          />
          <button type="submit" className={`${BOTON_PRINCIPAL} shrink-0`}>
            Aplicar
          </button>
        </div>
      </form>

      <div role="status" aria-live="polite" className="flex flex-col gap-2">
        {mensaje?.tipo === "resumen"
          ? mensaje.lineas.map((l) => (
              <p key={l} className="text-ok">
                {l}
              </p>
            ))
          : null}
        {mensaje?.tipo === "error" ? <p className="text-error">{mensaje.texto}</p> : null}
        {mensaje?.tipo === "elegir" ? <p className="font-medium">{mensaje.pregunta}</p> : null}
      </div>
      {mensaje?.tipo === "elegir" ? (
        <div className="flex flex-col gap-1">
          {mensaje.opciones.map((o) => (
            <button
              key={o.etiqueta}
              type="button"
              className={`${BOTON} text-left`}
              onClick={() => {
                despachar(o.acciones);
                setMensaje({ tipo: "resumen", lineas: o.resumen });
                setTexto("");
              }}
            >
              {o.etiqueta}
            </button>
          ))}
        </div>
      ) : null}

      <p className="text-sm text-texto-suave">{`Ejemplos: ${EJEMPLOS.map((e) => `«${e}»`).join(", ")}`}</p>
    </section>
  );
}
