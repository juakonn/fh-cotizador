"use client";

import { useEffect, useId, useState } from "react";
import { TEXTO_FORMA_DE_PAGO } from "@/lib/config/negocio";
import type { Accion } from "@/lib/cotizacion/reducer";
import type { Borrador, Entrega } from "@/lib/cotizacion/tipos";
import { BOTON, CAMPO, CampoNumero, CampoTexto, SelectorDescuento, TARJETA } from "./campos";

type ModoEntrega = Entrega["tipo"] | null;

const MODOS: { valor: Entrega["tipo"]; etiqueta: string }[] = [
  { valor: "inmediata", etiqueta: "Entrega inmediata" },
  { valor: "dias", etiqueta: "En días" },
  { valor: "texto", etiqueta: "Otro" },
];

// Dos notas iguales son posibles: la clave suma cuántas veces apareció ese texto antes.
function notasConClave(notas: string[]): { texto: string; clave: string }[] {
  const vistas = new Map<string, number>();
  return notas.map((texto) => {
    const n = (vistas.get(texto) ?? 0) + 1;
    vistas.set(texto, n);
    return { texto, clave: `${texto}#${n}` };
  });
}

export function Condiciones({
  borrador,
  despachar,
}: {
  borrador: Borrador;
  despachar: (acciones: Accion[]) => void;
}) {
  const idNota = useId();
  const entrega = borrador.entrega;
  const [modo, setModo] = useState<ModoEntrega>(entrega?.tipo ?? null);
  const [nota, setNota] = useState("");
  useEffect(() => setModo(entrega?.tipo ?? null), [entrega]);

  const agregarNota = () => {
    if (!nota.trim()) return;
    despachar([{ tipo: "nota", texto: nota }]);
    setNota("");
  };

  return (
    <section className={`${TARJETA} flex flex-col gap-4`}>
      <h2 className="text-lg font-semibold text-marino">Condiciones</h2>

      <CampoNumero
        etiqueta="Validez (días)"
        valor={borrador.validezDias}
        minimo={1}
        maximo={365}
        alConfirmar={(dias) => despachar([{ tipo: "validez", dias }])}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Plazo de entrega</legend>
        <div className="flex flex-wrap gap-2">
          {MODOS.map((m) => (
            <label
              key={m.valor}
              className="flex min-h-11 items-center gap-2 rounded-lg border border-borde px-3"
            >
              <input
                type="radio"
                name="modo-entrega"
                checked={modo === m.valor}
                onChange={() => {
                  setModo(m.valor);
                  if (m.valor === "inmediata") {
                    despachar([{ tipo: "entrega", entrega: { tipo: "inmediata" } }]);
                  }
                }}
              />
              {m.etiqueta}
            </label>
          ))}
        </div>
        {modo === "dias" ? (
          <CampoNumero
            etiqueta="Días de entrega"
            valor={entrega?.tipo === "dias" ? entrega.dias : 0}
            minimo={1}
            maximo={365}
            alConfirmar={(dias) =>
              despachar([{ tipo: "entrega", entrega: { tipo: "dias", dias: Math.round(dias) } }])
            }
          />
        ) : null}
        {modo === "texto" ? (
          <CampoTexto
            etiqueta="Texto de entrega"
            valor={entrega?.tipo === "texto" ? entrega.texto : ""}
            alConfirmar={(texto) =>
              despachar([
                {
                  tipo: "entrega",
                  entrega: texto.trim() ? { tipo: "texto", texto: texto.trim() } : null,
                },
              ])
            }
          />
        ) : null}
      </fieldset>

      <SelectorDescuento
        nombre="Descuento general"
        descuento={borrador.descuentoGeneral}
        alCambiar={(descuento) => despachar([{ tipo: "descuentoGeneral", descuento }])}
      />

      <div className="flex flex-col gap-2">
        <label htmlFor={idNota} className="text-sm font-medium">
          Nota para el PDF
        </label>
        <div className="flex gap-2">
          <input
            id={idNota}
            type="text"
            maxLength={200}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") agregarNota();
            }}
            className={CAMPO}
          />
          <button type="button" className={`${BOTON} shrink-0`} onClick={agregarNota}>
            Agregar nota
          </button>
        </div>
        {borrador.notas.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {notasConClave(borrador.notas).map(({ texto, clave }, i) => (
              <li key={clave} className="flex items-center justify-between gap-2">
                <span>{`• ${texto}`}</span>
                <button
                  type="button"
                  aria-label={`Quitar nota ${i + 1}`}
                  className={`${BOTON} shrink-0`}
                  onClick={() => despachar([{ tipo: "quitarNota", indice: i }])}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <p className="text-texto-suave">{TEXTO_FORMA_DE_PAGO}</p>
    </section>
  );
}
