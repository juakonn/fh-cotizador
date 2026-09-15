import { type NextRequest, NextResponse } from "next/server";
import { COOKIE_ACCESO, esTokenValido } from "@/lib/acceso";

export async function proxy(request: NextRequest) {
  let valido: boolean;
  try {
    valido = await esTokenValido(request.cookies.get(COOKIE_ACCESO)?.value);
  } catch {
    return NextResponse.json(
      { error: { codigo: "CONFIGURACION", mensaje: "Falta configurar ACCESS_KEY en el servidor" } },
      { status: 500 },
    );
  }
  if (valido) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: { codigo: "SIN_ACCESO", mensaje: "Abrí el link de acceso para usar la app" } },
      { status: 401 },
    );
  }
  return NextResponse.redirect(new URL("/acceso", request.url));
}

export const config = {
  matcher: [
    "/((?!api/salud|api/acceso|acceso|_next/|icons/|icon.png|apple-icon.png|manifest.webmanifest|favicon.ico).*)",
  ],
};
