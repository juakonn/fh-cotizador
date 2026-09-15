"use client";

import { useEffect, useId, useState } from "react";
import type { Descuento } from "@/lib/cotizacion/tipos";

export const TARJETA = "rounded-xl border border-borde bg-superficie p-4";
export const CAMPO =
  "min-h-11 w-full rounded-lg border border-borde bg-superficie px-3 text-base focus:border-marino focus:outline-none";
export const BOTON =
  "min-h-11 rounded-lg border border-borde bg-superficie px-4 font-medium transition-colors hover:bg-fondo disabled:opacity-50";
export const BOTON_PRINCIPAL =
  "min-h-11 rounded-lg bg-marino px-4 font-semibold text-white transition-colors hover:bg-marino-claro disabled:opacity-50";

// Campo de texto que se confirma al salir (o con Enter): cada tecla no es un paso de Deshacer.
export function CampoTexto({
  etiqueta,
  valor,
  alConfirmar,
  maximo = 120,
}: {
  etiqueta: string;
  valor: string;
  alConfirmar: (valor: string) => void;
  maximo?: number;
}) {
  const id = useId();
  const [texto, setTexto] = useState(valor);
  useEffect(() => setTexto(valor), [valor]);
  const confirmar = () => {
    if (texto !== valor) alConfirmar(texto);
  };
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {etiqueta}
      </label>
      <input
        id={id}
        type="text"
        value={texto}
        maxLength={maximo}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === "Enter") confirmar();
        }}
        className={CAMPO}
      />
    </div>
  );
}

export function CampoNumero({
  etiqueta,
  valor,
  alConfirmar,
  minimo,
  maximo,
  paso = 1,
  oculto = false,
}: {
  etiqueta: string;
  valor: number;
  alConfirmar: (valor: number) => void;
  minimo: number;
  maximo: number;
  paso?: number;
  oculto?: boolean;
}) {
  const id = useId();
  const [texto, setTexto] = useState(String(valor));
  useEffect(() => setTexto(String(valor)), [valor]);
  const confirmar = () => {
    const n = Number(texto.replace(",", "."));
    if (Number.isFinite(n) && n >= minimo && n <= maximo && n !== valor) alConfirmar(n);
    else setTexto(String(valor));
  };
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={oculto ? "sr-only" : "text-sm font-medium"}>
        {etiqueta}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={minimo}
        max={maximo}
        step={paso}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === "Enter") confirmar();
        }}
        className={CAMPO}
      />
    </div>
  );
}

type ModoDescuento = "sin" | "porcentaje" | "monto";

export function SelectorDescuento({
  nombre,
  descuento,
  alCambiar,
}: {
  nombre: string;
  descuento: Descuento | null;
  alCambiar: (descuento: Descuento | null) => void;
}) {
  const id = useId();
  const [modo, setModo] = useState<ModoDescuento>(descuento?.tipo ?? "sin");
  useEffect(() => setModo(descuento?.tipo ?? "sin"), [descuento]);
  const valor =
    descuento?.tipo === "porcentaje"
      ? descuento.valor
      : descuento?.tipo === "monto"
        ? descuento.centavos / 100
        : 0;
  const nombreValor = nombre.replace(/^Descuento/, "Valor del descuento");
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {nombre}
      </label>
      <select
        id={id}
        value={modo}
        onChange={(e) => {
          const nuevo = e.target.value as ModoDescuento;
          setModo(nuevo);
          if (nuevo === "sin") alCambiar(null);
        }}
        className={CAMPO}
      >
        <option value="sin">Sin descuento</option>
        <option value="porcentaje">Porcentaje</option>
        <option value="monto">Monto en U$S</option>
      </select>
      {modo !== "sin" ? (
        <CampoNumero
          etiqueta={nombreValor}
          valor={modo === descuento?.tipo ? valor : 0}
          minimo={0}
          maximo={modo === "porcentaje" ? 100 : 10_000_000}
          paso={modo === "porcentaje" ? 0.5 : 1}
          alConfirmar={(n) =>
            alCambiar(
              n <= 0
                ? null
                : modo === "porcentaje"
                  ? { tipo: "porcentaje", valor: n }
                  : { tipo: "monto", centavos: Math.round(n * 100) },
            )
          }
        />
      ) : null}
    </div>
  );
}
