"use client";

import { useId, useRef, useState } from "react";
import { celularDelVendedor, SUCURSALES } from "@/lib/config/negocio";
import { guardarEmisor } from "@/lib/cotizacion/persistencia";
import type { Emisor } from "@/lib/cotizacion/tipos";
import { BOTON, BOTON_PRINCIPAL, CAMPO } from "./campos";

export function AjustesDispositivo({
  emisor,
  alGuardar,
}: {
  emisor: Emisor;
  alGuardar: (emisor: Emisor) => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const idNombre = useId();
  const idCelular = useId();
  const [borrador, setBorrador] = useState<Emisor>(emisor);

  const abrir = () => {
    setBorrador(emisor);
    dialogo.current?.showModal();
  };

  return (
    <>
      <button
        type="button"
        className={`${BOTON} border-white/40 bg-transparent text-white hover:bg-marino-claro`}
        onClick={abrir}
      >
        Ajustes del dispositivo
      </button>
      <dialog
        ref={dialogo}
        className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-xl border border-borde bg-superficie p-4 text-texto backdrop:bg-black/40"
      >
        <form
          method="dialog"
          className="flex flex-col gap-3"
          onSubmit={() => {
            const listo = {
              ...borrador,
              vendedorNombre: borrador.vendedorNombre.trim(),
              vendedorCelular: borrador.vendedorCelular.trim(),
            };
            guardarEmisor(window.localStorage, listo);
            alGuardar(listo);
          }}
        >
          <h2 className="text-lg font-semibold text-marino">Ajustes del dispositivo</h2>
          <p className="text-sm text-texto-suave">
            Se guardan en este celular o PC y van al pie del PDF.
          </p>
          <fieldset className="flex flex-wrap gap-2">
            <legend className="mb-1 text-sm font-medium">Sucursal</legend>
            {(Object.keys(SUCURSALES) as Emisor["sucursal"][]).map((clave) => (
              <label
                key={clave}
                className="flex min-h-11 items-center gap-2 rounded-lg border border-borde px-3"
              >
                <input
                  type="radio"
                  name="sucursal"
                  checked={borrador.sucursal === clave}
                  onChange={() => setBorrador({ ...borrador, sucursal: clave })}
                />
                {SUCURSALES[clave]}
              </label>
            ))}
          </fieldset>
          <label htmlFor={idNombre} className="text-sm font-medium">
            Tu nombre
          </label>
          <input
            id={idNombre}
            type="text"
            maxLength={60}
            value={borrador.vendedorNombre}
            onChange={(e) => {
              const vendedorNombre = e.target.value;
              const fijo = celularDelVendedor(vendedorNombre, "");
              setBorrador({
                ...borrador,
                vendedorNombre,
                vendedorCelular: fijo || borrador.vendedorCelular,
              });
            }}
            className={CAMPO}
          />
          <label htmlFor={idCelular} className="text-sm font-medium">
            Tu celular
          </label>
          <input
            id={idCelular}
            type="tel"
            maxLength={30}
            value={borrador.vendedorCelular}
            onChange={(e) => setBorrador({ ...borrador, vendedorCelular: e.target.value })}
            className={CAMPO}
          />
          <div className="flex justify-end gap-2">
            <button type="button" className={BOTON} onClick={() => dialogo.current?.close()}>
              Cancelar
            </button>
            <button type="submit" className={BOTON_PRINCIPAL}>
              Guardar
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
