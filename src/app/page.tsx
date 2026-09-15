import { Cotizador } from "@/components/cotizador/Cotizador";
import type { Producto } from "@/lib/catalogo/normalizar";
import { obtenerCatalogo } from "@/lib/catalogo/shopify";

export const dynamic = "force-dynamic";

export default async function Inicio() {
  let catalogo: Producto[];
  try {
    catalogo = await obtenerCatalogo();
  } catch {
    return (
      <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
        <h1 className="text-2xl font-bold text-marino">FH Cotizador</h1>
        <p>No se pudo cargar el catálogo de la web.</p>
        <a
          href="/"
          className="flex min-h-11 w-fit items-center rounded-lg bg-marino px-4 font-semibold text-white"
        >
          Reintentar
        </a>
      </main>
    );
  }
  return <Cotizador catalogo={catalogo} />;
}
