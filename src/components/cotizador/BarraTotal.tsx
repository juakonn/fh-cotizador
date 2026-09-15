"use client";

import { useEffect, useMemo, useState } from "react";
import type { Producto } from "@/lib/catalogo/normalizar";
import { calcularTotales } from "@/lib/cotizacion/calculo";
import type { Accion } from "@/lib/cotizacion/reducer";
import type { Borrador, Emisor } from "@/lib/cotizacion/tipos";
import { advertencias, validarParaPdf } from "@/lib/cotizacion/validacion";
import { formatearUSD } from "@/lib/dinero/formato";
import { BOTON, BOTON_PRINCIPAL } from "./campos";

type CambioPrecio = { productoId: number; ahoraCentavos: number };

type Estado =
  | { tipo: "quieto" }
  | { tipo: "generando" }
  | { tipo: "listo"; archivo: File; url: string }
  | { tipo: "precio"; mensaje: string; cambios: CambioPrecio[] }
  | { tipo: "sinAcceso" }
  | { tipo: "error"; mensaje: string };

function nombreDesdeEncabezado(encabezado: string | null): string {
  const utf8 = encabezado?.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1]);
    } catch {
      // cae al nombre simple
    }
  }
  return encabezado?.match(/filename="([^"]+)"/i)?.[1] ?? "Cotizacion.pdf";
}

export function BarraTotal({
  borrador,
  emisor,
  catalogo,
  despachar,
}: {
  borrador: Borrador;
  emisor: Emisor;
  catalogo: Producto[];
  despachar: (acciones: Accion[]) => void;
}) {
  const [estado, setEstado] = useState<Estado>({ tipo: "quieto" });
  const calculo = useMemo(() => calcularTotales(borrador, catalogo), [borrador, catalogo]);
  const problemas = useMemo(() => validarParaPdf(borrador), [borrador]);
  const avisos = useMemo(() => advertencias(borrador, catalogo), [borrador, catalogo]);

  // Si la cotización cambia, el PDF generado ya no corresponde.
  // biome-ignore lint/correctness/useExhaustiveDependencies: se reinicia justamente cuando cambia el borrador
  useEffect(() => {
    setEstado((e) => (e.tipo === "generando" ? e : { tipo: "quieto" }));
  }, [borrador, emisor]);

  useEffect(() => {
    if (estado.tipo !== "listo") return;
    const url = estado.url;
    return () => URL.revokeObjectURL(url);
  }, [estado]);

  const generar = async () => {
    setEstado({ tipo: "generando" });
    try {
      const r = await fetch("/api/pdf", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ borrador, emisor }),
      });
      if (r.ok) {
        const blob = await r.blob();
        const nombre = nombreDesdeEncabezado(r.headers.get("content-disposition"));
        const archivo = new File([blob], nombre, { type: "application/pdf" });
        setEstado({ tipo: "listo", archivo, url: URL.createObjectURL(archivo) });
        return;
      }
      if (r.status === 401) {
        setEstado({ tipo: "sinAcceso" });
        return;
      }
      const cuerpo = (await r.json().catch(() => null)) as {
        error?: { codigo?: string; mensaje?: string; detalle?: unknown };
      } | null;
      if (cuerpo?.error?.codigo === "PRECIO_CAMBIO" && Array.isArray(cuerpo.error.detalle)) {
        setEstado({
          tipo: "precio",
          mensaje: cuerpo.error.mensaje ?? "Cambió el precio en la web",
          cambios: cuerpo.error.detalle as CambioPrecio[],
        });
        return;
      }
      setEstado({ tipo: "error", mensaje: cuerpo?.error?.mensaje ?? "No se pudo generar el PDF" });
    } catch {
      setEstado({ tipo: "error", mensaje: "No hay conexión. Probá de nuevo." });
    }
  };

  const descargar = (archivo: File, url: string) => {
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = archivo.name;
    document.body.append(enlace);
    enlace.click();
    enlace.remove();
  };

  const puedeCompartir =
    estado.tipo === "listo" &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.canShare?.({ files: [estado.archivo] }));

  return (
    <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 border-t border-borde bg-superficie px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
      {problemas.length > 0 || avisos.length > 0 ? (
        <ul className="flex flex-col gap-1 text-sm">
          {problemas.map((p) => (
            <li key={`p-${p.mensaje}`}>{p.mensaje}</li>
          ))}
          {avisos.map((a) => (
            <li key={`a-${a.mensaje}`} className="text-error">
              {a.mensaje}
            </li>
          ))}
        </ul>
      ) : null}

      {estado.tipo === "precio" ? (
        <div className="flex flex-col gap-2">
          <p className="text-error">{estado.mensaje}</p>
          <button
            type="button"
            className={BOTON}
            onClick={() =>
              despachar(
                estado.cambios.map((c) => ({
                  tipo: "actualizarPrecio" as const,
                  productoId: c.productoId,
                  precioCentavos: c.ahoraCentavos,
                })),
              )
            }
          >
            Usar precios nuevos
          </button>
        </div>
      ) : null}
      {estado.tipo === "sinAcceso" ? (
        <p className="text-error">
          Tu acceso venció.{" "}
          <a href="/acceso" className="underline">
            Volver a entrar
          </a>
        </p>
      ) : null}
      {estado.tipo === "error" ? <p className="text-error">{estado.mensaje}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-lg font-semibold text-marino">
          {calculo.ok ? `Total ${formatearUSD(calculo.totales.totalCentavos)}` : calculo.mensaje}
        </p>
        <div className="flex flex-wrap gap-2">
          {estado.tipo === "listo" ? (
            <>
              <button
                type="button"
                className={BOTON}
                onClick={() => descargar(estado.archivo, estado.url)}
              >
                Descargar
              </button>
              {puedeCompartir ? (
                <button
                  type="button"
                  className={BOTON}
                  onClick={() =>
                    navigator
                      .share({ files: [estado.archivo], title: estado.archivo.name })
                      .catch(() => undefined)
                  }
                >
                  Compartir
                </button>
              ) : null}
            </>
          ) : null}
          <button
            type="button"
            className={BOTON_PRINCIPAL}
            disabled={problemas.length > 0 || !calculo.ok || estado.tipo === "generando"}
            onClick={generar}
          >
            {estado.tipo === "generando" ? "Generando…" : "Generar PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
