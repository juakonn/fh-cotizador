import { contentDisposition } from "@/lib/pdf/archivo";
import { dependenciasReales, generarPdf } from "@/lib/pdf/generar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json(
      { error: { codigo: "SOLICITUD_INVALIDA", mensaje: "El cuerpo de la solicitud no es JSON" } },
      { status: 400 },
    );
  }
  const r = await generarPdf(cuerpo, dependenciasReales());
  if (!r.ok) {
    return Response.json(
      { error: { codigo: r.codigo, mensaje: r.mensaje, detalle: r.detalle } },
      { status: r.estado },
    );
  }
  return new Response(new Uint8Array(r.pdf), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": contentDisposition(r.nombre),
      "cache-control": "no-store",
    },
  });
}
