import { type NextRequest, NextResponse } from "next/server";
import {
  COOKIE_ACCESO,
  claveCorrecta,
  DURACION_ACCESO_SEGUNDOS,
  tokenDeAcceso,
} from "@/lib/acceso";

async function responder(request: NextRequest, intento: string) {
  let correcta: boolean;
  try {
    correcta = claveCorrecta(intento);
  } catch {
    return NextResponse.json(
      { error: { codigo: "CONFIGURACION", mensaje: "Falta configurar ACCESS_KEY en el servidor" } },
      { status: 500 },
    );
  }
  if (!correcta) return NextResponse.redirect(new URL("/acceso?error=1", request.url), 303);
  const respuesta = NextResponse.redirect(new URL("/", request.url), 303);
  respuesta.cookies.set(COOKIE_ACCESO, await tokenDeAcceso(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_ACCESO_SEGUNDOS,
  });
  return respuesta;
}

export async function GET(request: NextRequest) {
  return responder(request, request.nextUrl.searchParams.get("k") ?? "");
}

export async function POST(request: NextRequest) {
  const formulario = await request.formData().catch(() => null);
  return responder(request, String(formulario?.get("clave") ?? ""));
}
