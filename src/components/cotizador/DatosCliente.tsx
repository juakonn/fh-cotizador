"use client";

import type { Accion } from "@/lib/cotizacion/reducer";
import type { Cliente, Problema } from "@/lib/cotizacion/tipos";
import { CampoTexto, TARJETA } from "./campos";

type TipoCliente = "sin" | "empresa" | "persona";

const OPCIONES: { valor: TipoCliente; etiqueta: string }[] = [
  { valor: "sin", etiqueta: "Sin cliente" },
  { valor: "empresa", etiqueta: "Empresa" },
  { valor: "persona", etiqueta: "Persona" },
];

export function DatosCliente({
  cliente,
  avisos,
  despachar,
}: {
  cliente: Cliente | null;
  avisos: Problema[];
  despachar: (acciones: Accion[]) => void;
}) {
  const tipo: TipoCliente = cliente?.tipo ?? "sin";
  const cambiar = (nuevo: Cliente | null) => despachar([{ tipo: "cliente", cliente: nuevo }]);

  return (
    <section className={TARJETA}>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-lg font-semibold text-marino">Cliente</legend>
        <div className="flex flex-wrap gap-2">
          {OPCIONES.map((o) => (
            <label
              key={o.valor}
              className="flex min-h-11 items-center gap-2 rounded-lg border border-borde px-3"
            >
              <input
                type="radio"
                name="tipo-cliente"
                checked={tipo === o.valor}
                onChange={() =>
                  cambiar(
                    o.valor === "empresa"
                      ? { tipo: "empresa", razonSocial: "", rut: "" }
                      : o.valor === "persona"
                        ? { tipo: "persona", nombre: "", cedula: "" }
                        : null,
                  )
                }
              />
              {o.etiqueta}
            </label>
          ))}
        </div>
        {cliente?.tipo === "empresa" ? (
          <>
            <CampoTexto
              etiqueta="Razón social"
              valor={cliente.razonSocial}
              alConfirmar={(razonSocial) => cambiar({ ...cliente, razonSocial })}
            />
            <CampoTexto
              etiqueta="RUT"
              valor={cliente.rut}
              maximo={20}
              alConfirmar={(rut) => cambiar({ ...cliente, rut })}
            />
          </>
        ) : null}
        {cliente?.tipo === "persona" ? (
          <>
            <CampoTexto
              etiqueta="Nombre"
              valor={cliente.nombre}
              alConfirmar={(nombre) => cambiar({ ...cliente, nombre })}
            />
            <CampoTexto
              etiqueta="Cédula"
              valor={cliente.cedula}
              maximo={20}
              alConfirmar={(cedula) => cambiar({ ...cliente, cedula })}
            />
          </>
        ) : null}
        {avisos.map((a) => (
          <p key={a.mensaje} className="text-error">
            {a.mensaje}
          </p>
        ))}
      </fieldset>
    </section>
  );
}
