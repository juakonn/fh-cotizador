# Epic 01: Motor

> Después de este epic existe la app protegida por el link de acceso y toda la lógica que no depende
> de la pantalla: montos y letras, RUT y cédula, catálogo de Shopify, cálculo, historial con Deshacer
> e intérprete de frases. Cada pieza queda cubierta por sus tests.

| | |
|---|---|
| **Epic id** | `01-motor` |
| **Tasks** | `E1-T1` … `E1-T7` |
| **Depends on** | nada: se empieza acá |
| **Unlocks** | `02-pdf-e-interfaz` |
| **Parallel with** | ninguno (el epic 02 usa lo que produce este) |

No necesitás ningún otro archivo para completar este epic. Todo lo que sigue está repetido acá a
propósito.

---

## Stack

Next.js 16 (App Router) · TypeScript 6 · Tailwind CSS 4 · @react-pdf/renderer · zod 4 · Vitest ·
Playwright · Biome · npm · Node 24 (`.nvmrc`) · Vercel plan gratis. Sin base de datos, sin IA.
Las versiones exactas están en `package.json` (ya copiado desde `workspace/`) y en el lockfile:
leelas, nunca adivines una.

| Tarea | Comando |
|---|---|
| Desarrollo | `npm run dev` |
| Tipos | `npm run typecheck` |
| Lint | `npm run lint` (arreglar formato: `npm run format`) |
| Test (un archivo) | `npx vitest run tests/unit/<archivo>` |
| Todos los tests | `npm test` |
| Build | `npm run build` |
| Probar el servidor armado | `node scripts/probar-servidor.mjs "<METODO> <RUTA> <ESTADO> [opciones]" ...` |

**Gate:** `npm run typecheck && npm run lint && npm test` pasa antes de marcar cualquier tarea como
hecha. Este epic no usa servicios locales: no hay base de datos ni contenedores.

### Antes de E1-T1: Bootstrap (una vez, desde la raíz del proyecto)

Si `package.json` todavía no está en la raíz, corré este bloque tal cual. Es seguro correrlo dos
veces: la copia no pisa archivos existentes y cada línea sale con código 0 en la segunda corrida.

```bash
# orden: copiar workspace (trae .gitignore) → .env.local → repo git → primer commit → instalar → navegador e2e
node -e "require('node:fs').cpSync('blueprints/fh-cotizador/workspace', '.', { recursive: true, force: false, errorOnExist: false })"   # no pisa archivos que ya existen; sale 0 igual
node -e "const fs = require('node:fs'); if (!fs.existsSync('.env.local')) fs.copyFileSync('.env.example', '.env.local')"
git rev-parse --git-dir >/dev/null 2>&1 || git init -b main
git config user.email >/dev/null || git config user.email "constructor@fh-cotizador.local"
git config user.name >/dev/null || git config user.name "Constructor FH Cotizador"
git add -A && git commit -q -m "chore: scaffold" --allow-empty
npm install --no-audit --no-fund
npx playwright install chromium
```

## Directory subtree

Solo lo que toca este epic:

```
src/
  app/
    layout.tsx               # NUEVO (E1-T1) — el epic 02 le agrega metadata de app de celular
    globals.css              # NUEVO (E1-T1) — tokens @theme
    page.tsx                 # NUEVO (E1-T1) — marcador provisorio; el epic 02 lo reemplaza
    api/salud/route.ts       # NUEVO (E1-T1)
    api/acceso/route.ts      # NUEVO (E1-T2)
    acceso/page.tsx          # NUEVO (E1-T2)
    icon.png, apple-icon.png # ya existen (workspace) — no se tocan
  proxy.ts                   # NUEVO (E1-T2)
  lib/
    acceso.ts                # NUEVO (E1-T2)
    config/negocio.ts        # NUEVO (E1-T3)
    dinero/formato.ts        # NUEVO (E1-T3)
    dinero/letras.ts         # NUEVO (E1-T3)
    documentos/identificacion.ts  # NUEVO (E1-T3)
    catalogo/winansi.ts      # NUEVO (E1-T4)
    catalogo/descripcion.ts  # NUEVO (E1-T4)
    catalogo/normalizar.ts   # NUEVO (E1-T4)
    catalogo/shopify.ts      # NUEVO (E1-T4)
    cotizacion/tipos.ts      # NUEVO (E1-T5)
    cotizacion/calculo.ts    # NUEVO (E1-T5)
    cotizacion/validacion.ts # NUEVO (E1-T5)
    cotizacion/esquema.ts    # NUEVO (E1-T5)
    cotizacion/reducer.ts    # NUEVO (E1-T6)
    cotizacion/persistencia.ts   # NUEVO (E1-T6)
    interprete/texto.ts      # NUEVO (E1-T7)
    interprete/buscar.ts     # NUEVO (E1-T7)
    interprete/interpretar.ts    # NUEVO (E1-T7)
    pdf/assets/              # ya existen (workspace) — solo lectura en este epic
tests/
  unit/salud.test.ts         # NUEVO (E1-T1)
  unit/acceso.test.ts        # NUEVO (E1-T2)
  unit/dinero.test.ts        # NUEVO (E1-T3)
  unit/catalogo.test.ts      # NUEVO (E1-T4)
  unit/cotizacion.test.ts    # NUEVO (E1-T5)
  unit/reducer.test.ts       # NUEVO (E1-T6)
  unit/interprete.test.ts    # NUEVO (E1-T7)
  fixtures/productos-shopify.json  # ya existe (workspace) — solo lectura
scripts/probar-servidor.mjs  # ya existe (workspace) — no se toca
```

Todo lo que esté fuera de este árbol queda fuera del alcance. Si una tarea parece pedir editar otro
archivo, pará y reportalo: significa que el límite del epic está mal.

## Data model touched here

No hay base de datos. Los datos viven en memoria (catálogo leído de Shopify) y en el `localStorage`
del navegador (borrador de la cotización y ajustes del dispositivo).

| Entidad | Dónde se define | Notas |
|---|---|---|
| `Producto` | `src/lib/catalogo/normalizar.ts` | `id` = id de la **variante** de Shopify; `precioCentavos` entero |
| `Linea` | `src/lib/catalogo/descripcion.ts` | `{ id: "L1"…, tipo: "titulo" \| "item" \| "parrafo", texto, importante }` |
| `Borrador`, `Item`, `Cliente`, `Descuento`, `Entrega`, `Emisor`, `Totales` | `src/lib/cotizacion/tipos.ts` | literal en E1-T5 |
| `Accion`, `Historial` | `src/lib/cotizacion/reducer.ts` | literal en E1-T6 |
| Borrador guardado | `localStorage["fh-cotizador:borrador:v1"]` | validado con `esquemaBorrador` al leer |
| Ajustes del dispositivo | `localStorage["fh-cotizador:emisor:v1"]` | sucursal, nombre y celular de quien cotiza |

## Contracts

**Consumed** — ya existe, no se reconstruye:

| From | Interfaz | Garantía |
|---|---|---|
| `workspace/` | `tests/fixtures/productos-shopify.json` | 14 productos reales del 2026-09-11 (uno con precio 0, un repuesto); las dos "Palas frontales para DF 554" tienen la etiqueta `iva-incluido` agregada |
| `workspace/` | `scripts/probar-servidor.mjs` | levanta `next start` en el puerto 3100, corre chequeos, sale 0 / 1 / 2 |
| `workspace/` | `vitest.config.mts` | alias `@` → `src`, `ACCESS_KEY=clave-de-test-1234567890` en los tests |

**Produced** — el epic 02 depende de exactamente estas firmas:

| Export | Firma | Usado por |
|---|---|---|
| `src/lib/config/negocio.ts` → `URL_PRODUCTOS_SHOPIFY`, `ETIQUETA_IVA_INCLUIDO`, `VALIDEZ_POR_DEFECTO_DIAS`, `TEXTO_FORMA_DE_PAGO`, `SUCURSALES` | constantes | 02 |
| `src/lib/dinero/formato.ts` → `formatearUSD` | `(centavos: number) => string` | 02 |
| `src/lib/dinero/letras.ts` → `montoEnLetras`, `numeroEnLetras` | `(centavos: number) => string` · `(n: number) => string` | 02 |
| `src/lib/documentos/identificacion.ts` → `validarRut`, `validarCedula`, `formatearCedula`, `soloDigitos` | ver E1-T3 | 02 |
| `src/lib/catalogo/normalizar.ts` → `Producto`, `normalizarCatalogo`, `urlImagenPdf` | ver E1-T4 | 02 |
| `src/lib/catalogo/shopify.ts` → `obtenerCatalogo`, `ErrorCatalogo`, `FetchCatalogo` | `(op?: { fetchImpl?: FetchCatalogo }) => Promise<Producto[]>` | 02 |
| `src/lib/catalogo/winansi.ts` → `aWinAnsi` | `(texto: string) => string` | 02 |
| `src/lib/cotizacion/calculo.ts` → `calcularTotales`, `calcularDescuento` | ver E1-T5 | 02 |
| `src/lib/cotizacion/validacion.ts` → `validarParaPdf`, `advertencias` | `(b: Borrador) => Problema[]` · `(b, catalogo) => Problema[]` | 02 |
| `src/lib/cotizacion/esquema.ts` → `esquemaSolicitudPdf`, `esquemaBorrador`, `esquemaEmisor`, `SolicitudPdf` | zod | 02 |
| `src/lib/cotizacion/reducer.ts` → `Accion`, `aplicar`, `Historial`, `crearHistorial`, `conHistorial`, `deshacer` | ver E1-T6 | 02 |
| `src/lib/cotizacion/persistencia.ts` → `leerBorrador`, `guardarBorrador`, `leerEmisor`, `guardarEmisor`, `Almacen` | ver E1-T6 | 02 |
| `src/lib/interprete/interpretar.ts` → `interpretar`, `ResultadoInterprete`, `Opcion` | `(texto: string, ctx: { borrador: Borrador; catalogo: Producto[] }) => ResultadoInterprete` | 02 |
| `src/lib/interprete/buscar.ts` → `buscarProductos`, `elegir` | ver E1-T7 | 02 |
| `src/lib/acceso.ts` → `COOKIE_ACCESO`, `tokenDeAcceso`, `esTokenValido`, `claveCorrecta` | ver E1-T2 | 02 |

## Conventions that bite in this area

- **Plata en centavos enteros.** El único `Number(price)` del proyecto está en `normalizar.ts`.
- **Mensajes y resúmenes son contrato:** los tests comparan strings exactos (con tildes y «»).
  Copialos de las especificaciones, no los parafrasees.
- **Alias `@/` en todos lados**, incluidos los tests. Sin archivos barril.
- **Biome formatea con 2 espacios y 100 columnas.** Si `npm run lint` marca solo formato, corré
  `npm run format` y volvé a correr el gate.
- **Tests con el fixture, nunca contra la web.** Ningún test de este epic usa la red.
- Reglas por área (ya copiadas a la raíz): `.claude/rules/catalogo.md`, `.claude/rules/interprete.md`.
  Reglas generales: `CLAUDE.md`.

---

## Tasks

En el mismo orden que `tasks.json`. Ese orden es el orden de construcción: se trabaja de arriba
hacia abajo y no se reordena por prioridad ni por lo que parezca más rápido.

### `E1-T1` — Base del proyecto y endpoint de salud

**Depends on:** nada · **Priority:** p0 — metadato para recortes de alcance, no un orden

Creá la base de la app con estos cuatro archivos, tal cual, y el test. `page.tsx` es un marcador
provisorio: el paso E2-T3 lo reemplaza. No agregues nada más: el acceso llega en E1-T2.

**Files**
- `src/app/layout.tsx` — nuevo
- `src/app/globals.css` — nuevo
- `src/app/page.tsx` — nuevo
- `src/app/api/salud/route.ts` — nuevo
- `tests/unit/salud.test.ts` — nuevo

`src/app/layout.tsx`
```tsx
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "FH Cotizador",
  description: "Cotizaciones y facturas proforma de Florencio Hernández",
};

export const viewport: Viewport = {
  themeColor: "#0c2641",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-UY">
      <body>{children}</body>
    </html>
  );
}
```

`src/app/globals.css`
```css
@import "tailwindcss";
@source not "../../blueprints";

@theme {
  --color-marino: #0c2641;
  --color-marino-claro: #163a5f;
  --color-dorado: #c9a34b;
  --color-fondo: #f5f6f8;
  --color-superficie: #ffffff;
  --color-borde: #d9dee7;
  --color-texto: #14202e;
  --color-texto-suave: #5b6878;
  --color-error: #b42318;
  --color-ok: #1f7a4d;
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
}

body {
  background: var(--color-fondo);
  color: var(--color-texto);
  font-family: var(--font-sans);
}
```

`src/app/page.tsx`
```tsx
export default function Inicio() {
  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-bold text-marino">FH Cotizador</h1>
    </main>
  );
}
```

`src/app/api/salud/route.ts`
```ts
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true, app: "fh-cotizador" });
}
```

`tests/unit/salud.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/salud/route";

describe("GET /api/salud", () => {
  it("responde 200 con ok", async () => {
    const r = GET();
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, app: "fh-cotizador" });
  });
});
```

**Acceptance**

Copiado textual del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo decide un
comando de abajo, en esta máquina, durante el build.

1. **WHEN** `npm run typecheck` y `npm run lint` corren sobre el proyecto recién copiado **THE SYSTEM SHALL** terminar con código 0.
2. **WHEN** el servidor armado recibe GET /api/salud **THE SYSTEM SHALL** responder 200 con el JSON `{"ok":true,"app":"fh-cotizador"}`.
3. **WHEN** el servidor armado responde cualquier ruta **THE SYSTEM SHALL** incluir el header `X-Frame-Options: DENY`.
4. **WHEN** corre `npx vitest run tests/unit/salud.test.ts` **THE SYSTEM SHALL** pasar con 0 fallas.

**Verify**: cada comando, en orden, desde la raíz del proyecto. Cada uno sale con 0 si la tarea
está bien; la tarea está hecha cuando sale 0 el último.

```bash
npm run typecheck
npm run lint
npx vitest run tests/unit/salud.test.ts
npm run build
node scripts/probar-servidor.mjs "GET /api/salud 200 contiene=fh-cotizador tipo=application/json" "GET /api/salud 200 encabezado='x-frame-options: DENY'"
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T1: base del proyecto y endpoint de salud"
git tag step-01-base
```

Se corren después de que el último `Verify` sale 0, antes de empezar la tarea siguiente. El tag es
el punto de vuelta atrás de esta tarea: si la próxima sale mal, `git reset --hard step-01-base`.

### `E1-T2` — Acceso con link y cookie firmada

**Depends on:** `E1-T1` · **Priority:** p0 — metadato para recortes de alcance, no un orden

Un solo "código de equipo" (`ACCESS_KEY`, mínimo 12 caracteres) da acceso. El link
`/api/acceso?k=<clave>` o el formulario de `/acceso` dejan una cookie httpOnly `fh_acceso` con un
HMAC-SHA256 de la clave (nunca la clave en sí) por 400 días. `src/proxy.ts` (Next 16 usa `proxy.ts`,
no `middleware.ts`) protege todo salvo salud, acceso, los íconos y el manifest: las páginas sin
cookie van a `/acceso` (307) y la API responde 401. Cambiar `ACCESS_KEY` invalida todos los
dispositivos. Escribí estos archivos tal cual.

**Files**
- `src/lib/acceso.ts` — nuevo
- `src/proxy.ts` — nuevo
- `src/app/api/acceso/route.ts` — nuevo
- `src/app/acceso/page.tsx` — nuevo
- `tests/unit/acceso.test.ts` — nuevo

`src/lib/acceso.ts`
```ts
export const COOKIE_ACCESO = "fh_acceso";
export const DURACION_ACCESO_SEGUNDOS = 60 * 60 * 24 * 400;
const CONTEXTO = "fh-cotizador:acceso:v1";

export class ErrorConfiguracion extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorConfiguracion";
  }
}

export function claveDeAcceso(): string {
  const clave = process.env.ACCESS_KEY ?? "";
  if (clave.length < 12) {
    throw new ErrorConfiguracion("ACCESS_KEY no está definida o tiene menos de 12 caracteres");
  }
  return clave;
}

function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}

function base64url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function tokenDeAcceso(clave: string = claveDeAcceso()): Promise<string> {
  const codificador = new TextEncoder();
  const llave = await crypto.subtle.importKey(
    "raw",
    codificador.encode(clave),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64url(await crypto.subtle.sign("HMAC", llave, codificador.encode(CONTEXTO)));
}

export async function esTokenValido(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  return iguales(token, await tokenDeAcceso());
}

export function claveCorrecta(intento: string): boolean {
  return iguales(intento, claveDeAcceso());
}
```

`src/proxy.ts`
```ts
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
```

`src/app/api/acceso/route.ts`
```ts
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
```

`src/app/acceso/page.tsx`
```tsx
export default async function Acceso({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold text-marino">FH Cotizador</h1>
      <p className="text-texto-suave">
        Abrí el link de acceso que te mandaron por WhatsApp, o escribí la clave del equipo.
      </p>
      <form method="post" action="/api/acceso" className="flex flex-col gap-3">
        <label htmlFor="clave" className="font-medium">
          Clave del equipo
        </label>
        <input
          id="clave"
          name="clave"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-lg border border-borde bg-superficie px-3 py-3 text-base"
        />
        {error ? (
          <p role="alert" className="text-error">
            La clave no es correcta.
          </p>
        ) : null}
        <button type="submit" className="rounded-lg bg-marino px-4 py-3 font-semibold text-white">
          Entrar
        </button>
      </form>
    </main>
  );
}
```

`tests/unit/acceso.test.ts`
```ts
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET, POST } from "@/app/api/acceso/route";
import { COOKIE_ACCESO, claveCorrecta, esTokenValido, tokenDeAcceso } from "@/lib/acceso";
import { proxy } from "@/proxy";

// ACCESS_KEY llega desde vitest.config.mts: "clave-de-test-1234567890"
const CLAVE = "clave-de-test-1234567890";

describe("token de acceso", () => {
  it("es estable, no contiene la clave y se valida", async () => {
    const token = await tokenDeAcceso();
    expect(token).toBe(await tokenDeAcceso());
    expect(token).not.toContain("clave-de-test");
    expect(await esTokenValido(token)).toBe(true);
    expect(await esTokenValido("otro")).toBe(false);
    expect(await esTokenValido(undefined)).toBe(false);
  });
  it("compara la clave del equipo", () => {
    expect(claveCorrecta(CLAVE)).toBe(true);
    expect(claveCorrecta("clave-de-test-123456789X")).toBe(false);
    expect(claveCorrecta("")).toBe(false);
  });
});

describe("/api/acceso", () => {
  it("el link con la clave correcta deja la cookie y lleva al inicio", async () => {
    const r = await GET(new NextRequest(`http://localhost/api/acceso?k=${CLAVE}`));
    expect(r.status).toBe(303);
    expect(r.headers.get("location")).toBe("http://localhost/");
    const cookie = r.cookies.get(COOKIE_ACCESO);
    expect(cookie?.value).toBe(await tokenDeAcceso());
    expect(cookie?.httpOnly).toBe(true);
  });
  it("una clave incorrecta vuelve a /acceso con error y sin cookie", async () => {
    const r = await GET(new NextRequest("http://localhost/api/acceso?k=mala"));
    expect(r.status).toBe(303);
    expect(r.headers.get("location")).toBe("http://localhost/acceso?error=1");
    expect(r.cookies.get(COOKIE_ACCESO)).toBeUndefined();
  });
  it("el formulario con la clave también da acceso", async () => {
    const formulario = new FormData();
    formulario.set("clave", CLAVE);
    const r = await POST(
      new NextRequest("http://localhost/api/acceso", { method: "POST", body: formulario }),
    );
    expect(r.status).toBe(303);
    expect(r.cookies.get(COOKIE_ACCESO)?.value).toBe(await tokenDeAcceso());
  });
});

describe("proxy", () => {
  it("sin cookie redirige las páginas y responde 401 en la API", async () => {
    const pagina = await proxy(new NextRequest("http://localhost/"));
    expect(pagina.status).toBe(307);
    expect(pagina.headers.get("location")).toBe("http://localhost/acceso");
    const api = await proxy(new NextRequest("http://localhost/api/pdf", { method: "POST" }));
    expect(api.status).toBe(401);
    expect(await api.json()).toEqual({
      error: { codigo: "SIN_ACCESO", mensaje: "Abrí el link de acceso para usar la app" },
    });
  });
  it("con la cookie válida deja pasar", async () => {
    const token = await tokenDeAcceso();
    const r = await proxy(
      new NextRequest("http://localhost/", { headers: { cookie: `${COOKIE_ACCESO}=${token}` } }),
    );
    expect(r.headers.get("x-middleware-next")).toBe("1");
  });
});
```

**Acceptance**

1. **WHEN** una página se pide sin la cookie `fh_acceso` **THE SYSTEM SHALL** redirigir con 307 a /acceso.
2. **WHEN** una ruta /api/ que no es /api/salud ni /api/acceso se pide sin la cookie **THE SYSTEM SHALL** responder 401 con `{ error: { codigo: "SIN_ACCESO", mensaje: "Abrí el link de acceso para usar la app" } }`.
3. **WHEN** se abre /api/acceso?k=<ACCESS_KEY> **THE SYSTEM SHALL** guardar la cookie httpOnly `fh_acceso` por 400 días y redirigir con 303 a /.
4. **WHEN** la clave del link o del formulario es incorrecta **THE SYSTEM SHALL** redirigir con 303 a /acceso?error=1 sin guardar cookie.
5. **WHEN** corre `npx vitest run tests/unit/acceso.test.ts` **THE SYSTEM SHALL** pasar con 0 fallas.

**Verify**

```bash
npm run typecheck
npm run lint
npx vitest run tests/unit/acceso.test.ts
npm run build
node scripts/probar-servidor.mjs "GET / 307 destino=/acceso" "GET /acceso 200 contiene='Clave del equipo'" "GET /api/acceso?k=mala 303 destino=/acceso?error=1" "POST /api/pdf 401 contiene=SIN_ACCESO" "GET / 200 acceso" "GET /api/salud 200 contiene=fh-cotizador"
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T2: acceso con link y cookie firmada"
git tag step-02-acceso
```

### `E1-T3` — Montos, montos en letras, RUT y cédula

**Depends on:** `E1-T1` · **Priority:** p0 — metadato para recortes de alcance, no un orden

`negocio.ts` va tal cual. Los otros tres módulos se implementan con las reglas de abajo hasta que
pase el test, que va tal cual. No uses `Intl.NumberFormat` ni librerías: el formato tiene que ser
idéntico en cualquier máquina.

`src/lib/config/negocio.ts`
```ts
export const URL_PRODUCTOS_SHOPIFY = "https://florenciohernandez.com.uy/products.json";
export const ETIQUETA_IVA_INCLUIDO = "iva-incluido";
export const VALIDEZ_POR_DEFECTO_DIAS = 30;
export const TEXTO_FORMA_DE_PAGO =
  "Forma de pago: contado o financiado con Mi Maquinaria by Santander.";
export const SUCURSALES = {
  "san-jacinto": "San Jacinto",
  montevideo: "Montevideo",
} as const;

// Celular fijo por vendedor (clave: primer nombre, sin tildes y en minúsculas). Gana sobre lo que se
// haya escrito en «Tu celular» de ese aparato.
export const CELULARES_VENDEDORES: Record<string, string> = {
  joaquin: "092 469 449",
};

export function celularDelVendedor(nombre: string, celularEscrito: string): string {
  const primerNombre = nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .split(/\s+/)[0];
  return CELULARES_VENDEDORES[primerNombre] ?? celularEscrito.trim();
}
```

`src/lib/dinero/formato.ts` → `export function formatearUSD(centavos: number): string`
- Si `centavos` no es entero o es negativo: `throw new RangeError(...)`.
- Prefijo `U$S `, miles con `.`, y `,` más dos dígitos solo si hay centavos: `1790000 → "U$S 17.900"`,
  `247050 → "U$S 2.470,50"`, `99 → "U$S 0,99"`, `0 → "U$S 0"`.

`src/lib/dinero/letras.ts`
- `export function numeroEnLetras(n: number): string` para enteros de 0 a 999.999.999 (fuera de
  rango: `RangeError`).
  - 0–29 con palabra propia: cero, uno, dos … quince, **dieciséis**, diecisiete, dieciocho,
    diecinueve, veinte, veintiuno, **veintidós**, **veintitrés**, veinticuatro, veinticinco,
    **veintiséis**, veintisiete, veintiocho, veintinueve.
  - 30–99: treinta, cuarenta, cincuenta, sesenta, setenta, ochenta, noventa, más ` y ` y la unidad.
  - 100 es `cien`; 101–199 `ciento …`; centenas: doscientos, trescientos, cuatrocientos,
    **quinientos**, seiscientos, **setecientos**, ochocientos, **novecientos**.
  - Miles: 1000 es `mil` (nunca "un mil"); más de mil: `<grupo> mil`, con apócope en el grupo
    (`uno` → `un`, `veintiuno` → `veintiún`, `… y uno` → `… y un`): 21000 `veintiún mil`,
    31000 `treinta y un mil`, 101000 `ciento un mil`.
  - Millones: 1 es `un millón`; más: `<grupo> millones` con la misma apócope.
  - Las partes (millones, miles, resto) se unen con un espacio: 1001000 `un millón mil`.
- `export function montoEnLetras(centavos: number): string` →
  `"Dólares americanos " + numeroEnLetras(enteros)` y, si hay centavos, `" con NN/100"`.

`src/lib/documentos/identificacion.ts`
- `export type ResultadoDocumento = { valido: boolean; normalizado: string; motivo?: string };`
- `export function soloDigitos(texto: string): string` — borra todo lo que no sea dígito.
- `export function validarRut(texto: string): ResultadoDocumento` — `normalizado` = solo dígitos.
  Reglas, en este orden, con estos motivos textuales:
  1. 12 dígitos, si no `"El RUT tiene que tener 12 dígitos"`.
  2. Los dos primeros entre 01 y 21, si no `"Los dos primeros dígitos del RUT van de 01 a 21"`.
  3. Los dígitos 9 y 10 son `00`, si no `"Los dígitos 9 y 10 del RUT tienen que ser 00"`.
  4. Verificador: pesos `[4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]` sobre los 11 primeros; `dv = 11 − (suma mod 11)`,
     si da 11 es 0 y si da 10 es inválido; si no coincide con el dígito 12:
     `"El dígito verificador del RUT no coincide"`.
- `export function validarCedula(texto: string): ResultadoDocumento` — 7 u 8 dígitos (si no:
  `"La cédula tiene 7 u 8 dígitos contando el verificador"`); se completa a 8 con ceros a la izquierda
  (`normalizado`); pesos `[2, 9, 8, 7, 6, 3, 4]` sobre los 7 primeros; `dv = (10 − (suma mod 10)) mod 10`;
  si no coincide: `"El dígito verificador de la cédula no coincide"`.
- `export function formatearCedula(normalizado: string): string` → `"1.234.567-2"`, sin el cero de
  relleno (`"05678903"` → `"567.890-3"`).
- Los dos algoritmos se verificaron contra 4 RUT y 2 cédulas de comprobantes reales de FH.

**Files**
- `src/lib/config/negocio.ts` — nuevo
- `src/lib/dinero/formato.ts` — nuevo
- `src/lib/dinero/letras.ts` — nuevo
- `src/lib/documentos/identificacion.ts` — nuevo
- `tests/unit/dinero.test.ts` — nuevo

`tests/unit/dinero.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { formatearUSD } from "@/lib/dinero/formato";
import { montoEnLetras, numeroEnLetras } from "@/lib/dinero/letras";
import { formatearCedula, validarCedula, validarRut } from "@/lib/documentos/identificacion";

describe("formatearUSD", () => {
  it.each([
    [1790000, "U$S 17.900"],
    [247050, "U$S 2.470,50"],
    [99, "U$S 0,99"],
    [0, "U$S 0"],
    [123456789, "U$S 1.234.567,89"],
  ])("%i centavos → %s", (centavos, esperado) => {
    expect(formatearUSD(centavos)).toBe(esperado);
  });

  it("rechaza montos negativos o con fracción de centavo", () => {
    expect(() => formatearUSD(-1)).toThrow(RangeError);
    expect(() => formatearUSD(1.5)).toThrow(RangeError);
  });
});

describe("numeroEnLetras", () => {
  it.each([
    [0, "cero"],
    [1, "uno"],
    [15, "quince"],
    [16, "dieciséis"],
    [21, "veintiuno"],
    [22, "veintidós"],
    [30, "treinta"],
    [31, "treinta y uno"],
    [100, "cien"],
    [101, "ciento uno"],
    [500, "quinientos"],
    [999, "novecientos noventa y nueve"],
    [1000, "mil"],
    [1001, "mil uno"],
    [2470, "dos mil cuatrocientos setenta"],
    [17900, "diecisiete mil novecientos"],
    [21000, "veintiún mil"],
    [31000, "treinta y un mil"],
    [100000, "cien mil"],
    [101000, "ciento un mil"],
    [1000000, "un millón"],
    [1001000, "un millón mil"],
    [2500000, "dos millones quinientos mil"],
    [21000000, "veintiún millones"],
  ])("%i → %s", (n, esperado) => {
    expect(numeroEnLetras(n)).toBe(esperado);
  });
});

describe("montoEnLetras", () => {
  it("monto sin centavos", () => {
    expect(montoEnLetras(1790000)).toBe("Dólares americanos diecisiete mil novecientos");
  });
  it("monto con centavos", () => {
    expect(montoEnLetras(247050)).toBe(
      "Dólares americanos dos mil cuatrocientos setenta con 50/100",
    );
  });
  it("coincide siempre con el número formateado", () => {
    expect(formatearUSD(2483500)).toBe("U$S 24.835");
    expect(montoEnLetras(2483500)).toBe(
      "Dólares americanos veinticuatro mil ochocientos treinta y cinco",
    );
  });
});

describe("RUT", () => {
  it("acepta el RUT de Riaden S.A. y uno sintético válido", () => {
    expect(validarRut("212983680015").valido).toBe(true);
    expect(validarRut("21 123456 0019")).toEqual({ valido: true, normalizado: "211234560019" });
  });
  it("rechaza dígito verificador, largo y prefijo inválidos con un motivo", () => {
    expect(validarRut("211234560018").valido).toBe(false);
    expect(validarRut("21123456001").motivo).toBe("El RUT tiene que tener 12 dígitos");
    expect(validarRut("991234560019").valido).toBe(false);
  });
});

describe("cédula", () => {
  it("acepta cédulas de 8 y 7 dígitos", () => {
    expect(validarCedula("1.234.567-2")).toEqual({ valido: true, normalizado: "12345672" });
    expect(validarCedula("567.890-3")).toEqual({ valido: true, normalizado: "05678903" });
  });
  it("rechaza un verificador incorrecto", () => {
    expect(validarCedula("1.234.567-3").valido).toBe(false);
  });
  it("formatea con puntos y guion", () => {
    expect(formatearCedula("12345672")).toBe("1.234.567-2");
    expect(formatearCedula("05678903")).toBe("567.890-3");
  });
});
```

**Acceptance**

1. **WHEN** se formatean 1790000 centavos **THE SYSTEM SHALL** devolver `U$S 17.900`, y para 247050 centavos `U$S 2.470,50`.
2. **WHEN** se pasan a letras 2483500 centavos **THE SYSTEM SHALL** devolver `Dólares americanos veinticuatro mil ochocientos treinta y cinco`.
3. **WHEN** se pasa a letras el número 21000 **THE SYSTEM SHALL** devolver `veintiún mil`, y para 1000000 `un millón`.
4. **WHEN** se valida el RUT 212983680015 **THE SYSTEM SHALL** darlo por válido, y el 211234560018 por inválido con el motivo `El dígito verificador del RUT no coincide`.
5. **WHEN** se valida la cédula 1.234.567-2 **THE SYSTEM SHALL** darla por válida con normalizado `12345672`, y la 1.234.567-3 por inválida.
6. **WHEN** corre `npx vitest run tests/unit/dinero.test.ts` **THE SYSTEM SHALL** pasar con 0 fallas.

**Verify**

```bash
npm run typecheck
npm run lint
npx vitest run tests/unit/dinero.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T3: montos, montos en letras, RUT y cédula"
git tag step-03-dinero
```

### `E1-T4` — Lectura y limpieza del catálogo de Shopify

**Depends on:** `E1-T3` · **Priority:** p0 — metadato para recortes de alcance, no un orden

Leé el catálogo público `products.json`, normalizalo a `Producto` y limpiá las descripciones de la
web (que son texto de venta con emojis, llamados a WhatsApp y un bloque de financiación) para que
sirvan en un PDF formal. Nada de esto usa la red en los tests: `obtenerCatalogo` recibe un `fetch`
inyectable.

`src/lib/catalogo/winansi.ts` → `export function aWinAnsi(texto: string): string`
- Recorre el texto normalizado NFC. Reemplaza `→ ← ↔ −` por `-`, `≈` por `~`, `≤` por `<=`, `≥` por
  `>=`, `′` por `'`, `″` por `"`, espacio duro, tabulación y salto de línea por un espacio.
- Conserva solo ASCII imprimible (0x20–0x7E), Latin-1 (0xA0–0xFF) y los extras de CP1252
  `€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ`. Todo lo demás (emojis, selectores de variante, controles) se borra.
- Colapsa espacios repetidos y recorta los extremos.

`src/lib/catalogo/descripcion.ts`
- `export type Linea = { id: string; tipo: "titulo" | "item" | "parrafo"; texto: string; importante: boolean };`
- `export function limpiarDescripcion(html: string): Linea[]`:
  1. Vacío → `[]`.
  2. Marcá el comienzo de `<h1>`…`<h6>` como título y de `<li>` como ítem con caracteres de control
     (`String.fromCharCode(1)` y `String.fromCharCode(2)`; no uses letras ni escapes que un editor se
     pueda comer). `<br>` y la apertura o cierre de `p, div, ul, ol, li, h1–h6, tr, td, th, table,
     tbody, thead, section, blockquote` son saltos de línea; cualquier otra etiqueta se borra.
  3. Decodificá entidades: numéricas (`&#233;`, `&#xE9;`) y con nombre (`nbsp amp lt gt quot apos`,
     vocales con `acute`, `ntilde`, `uuml`, `iquest iexcl deg ordm ordf laquo raquo ndash mdash hellip
     ldquo rdquo lsquo rsquo bull times frac12 sup2 sup3`).
  4. Por cada línea: si trae la marca, ese es su tipo (si la línea queda vacía, el tipo pasa a la
     siguiente línea no vacía); texto = `aWinAnsi(línea)` sin viñetas iniciales `• · * -`.
  5. Descartá líneas de menos de 2 caracteres y las que coincidan con
     `/whatsapp|consult[aá]|escrib[ií]nos|precalific|https?:|www\.|financi|cuotas|mi maquinaria|santander|u\$s|\busd\b|\bcontado\b/i`
     (la forma de pago ya va al pie del PDF y el único precio válido es el de Shopify: «CONTADO U$S 2610»
     escrito en la descripción se descarta).
  6. `importante`: cada título que coincide con
     `/ideal para|por qu[eé]|respaldo|garant[ií]a|beneficio|ventaja|servicio/i` abre una sección de venta;
     el título y todas las líneas hasta el próximo título quedan con `importante: false`. Todo lo demás
     (texto antes del primer título, «Ficha técnica», títulos que no coinciden) queda `importante: true`.
  7. Ids correlativos `L1`, `L2`… sobre las líneas que quedan.

`src/lib/catalogo/normalizar.ts`
- Esquema zod de la respuesta (las claves de más se ignoran): `products: [{ id: number, title: string,
  handle: string, body_html?: string | null, product_type?: string | null, tags?: string[],
  variants: [{ id: number, title: string, price: string, available?: boolean }], images?: [{ src: string }] }]`.
  Exportá `esquemaRespuestaShopify` y `type ProductoShopify`.
- Exportá este tipo tal cual:
  ```ts
  export type Producto = {
    id: number; // id de la VARIANTE de Shopify
    productoId: number; // id del producto de Shopify
    handle: string;
    titulo: string; // aWinAnsi(title) (+ " - " + variante si hay más de una)
    precioCentavos: number;
    imagenUrl: string | null; // primera imagen, pasada por urlImagenPdf
    lineas: Linea[];
    ivaIncluido: boolean; // tiene la etiqueta iva-incluido (sin importar mayúsculas)
    sospechaIva: boolean; // !ivaIncluido y el título es pala frontal, pala cajón, retroexcavadora o chipeadora
    esRepuesto: boolean; // product_type empieza con "repuesto"
  };
  ```
- `sinAcentos(texto)`: NFD, sin marcas diacríticas, minúsculas. La sospecha de IVA usa
  `/\b(palas?\s+frontal(es)?|pala\s+cajon|retroexcavadora|chipeadora)/` sobre `sinAcentos(titulo)`.
- `urlImagenPdf(src)` agrega `width=1000&format=pjpg` con `?` o `&` según corresponda: Shopify
  achica y pasa a JPG las fotos WebP y las PNG sin transparencia, pero las PNG con transparencia
  siguen llegando como PNG pesado; por eso el PDF recomprime cada foto (epic 02, `prepararImagen`).
- `normalizarProductos(productos: ProductoShopify[]): Producto[]`: una entrada por variante;
  `precioCentavos = Math.round(Number(price) * 100)`; se descartan las variantes con precio ≤ 0 o no
  numérico (los "Tutorial de funcionamiento" tienen precio 0).
- `normalizarCatalogo(crudo: unknown): Producto[]` = `esquemaRespuestaShopify.parse` + `normalizarProductos`.

`src/lib/catalogo/shopify.ts`
- `export class ErrorCatalogo extends Error` con `readonly codigo: "SHOPIFY_NO_DISPONIBLE" | "RESPUESTA_INVALIDA"`
  y `name = "ErrorCatalogo"` (asigná el campo en el constructor, sin propiedades de parámetro).
- `export type FetchCatalogo = (url: string, init?: RequestInit & { next?: { revalidate?: number } }) => Promise<Response>;`
- `export async function obtenerCatalogo(opciones: { fetchImpl?: FetchCatalogo } = {}): Promise<Producto[]>`:
  pide `${URL_PRODUCTOS_SHOPIFY}?limit=250&page=N` desde N = 1, con `{ next: { revalidate: 300 } }`,
  hasta que una página traiga menos de 250 productos (tope 10 páginas). Error de red o estado no-ok:
  `SHOPIFY_NO_DISPONIBLE`. Respuesta que no cumple el esquema: `RESPUESTA_INVALIDA`.

**Files**
- `src/lib/catalogo/winansi.ts` — nuevo
- `src/lib/catalogo/descripcion.ts` — nuevo
- `src/lib/catalogo/normalizar.ts` — nuevo
- `src/lib/catalogo/shopify.ts` — nuevo
- `tests/unit/catalogo.test.ts` — nuevo

`tests/unit/catalogo.test.ts`
```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { limpiarDescripcion } from "@/lib/catalogo/descripcion";
import { normalizarCatalogo, urlImagenPdf } from "@/lib/catalogo/normalizar";
import { ErrorCatalogo, type FetchCatalogo, obtenerCatalogo } from "@/lib/catalogo/shopify";
import { aWinAnsi } from "@/lib/catalogo/winansi";

const crudo = JSON.parse(readFileSync("tests/fixtures/productos-shopify.json", "utf8"));
const catalogo = normalizarCatalogo(crudo);
const porId = (id: number) => catalogo.find((p) => p.id === id);

describe("aWinAnsi", () => {
  it("conserva acentos, ñ, ×, comillas tipográficas y viñetas", () => {
    expect(aWinAnsi("Tracción 4×4 “Ñandú” • ok")).toBe("Tracción 4×4 “Ñandú” • ok");
  });
  it("quita emojis, cambia flechas por guion y colapsa espacios", () => {
    expect(aWinAnsi("🎯  Ideal para →")).toBe("Ideal para -");
  });
});

describe("limpiarDescripcion", () => {
  it("devuelve una lista vacía para html vacío", () => {
    expect(limpiarDescripcion("")).toEqual([]);
  });
  it("decodifica entidades y distingue párrafos de ítems", () => {
    expect(limpiarDescripcion("<p>Hola&nbsp;&amp; chau</p><ul><li>Uno</li></ul>")).toEqual([
      { id: "L1", tipo: "parrafo", texto: "Hola & chau", importante: true },
      { id: "L2", tipo: "item", texto: "Uno", importante: true },
    ]);
  });
  it("marca como no importantes las secciones de venta y deja la ficha técnica", () => {
    const html =
      "<p>Intro</p><h3>Ideal para</h3><ul><li>Chacras</li></ul><h3>Ficha técnica</h3><ul><li>Peso: 550 kg</li></ul><h3>El respaldo Florencio Hernández</h3><p>65 años</p>";
    expect(limpiarDescripcion(html).map((l) => [l.texto, l.importante])).toEqual([
      ["Intro", true],
      ["Ideal para", false],
      ["Chacras", false],
      ["Ficha técnica", true],
      ["Peso: 550 kg", true],
      ["El respaldo Florencio Hernández", false],
      ["65 años", false],
    ]);
  });
  it("descarta precios escritos a mano en la descripción", () => {
    const lineas = limpiarDescripcion("<p>Tanque 800 lts</p><p>CONTADO U$S 2610</p>");
    expect(lineas.map((l) => l.texto)).toEqual(["Tanque 800 lts"]);
  });
  it("limpia la descripción real del Farmtrac 6050", () => {
    const lineas = porId(50605744423200)?.lineas ?? [];
    expect(lineas.length).toBeGreaterThan(3);
    expect(lineas.map((l) => l.id)).toEqual(lineas.map((_, i) => `L${i + 1}`));
    expect(lineas.some((l) => l.texto.includes("50 HP"))).toBe(true);
    expect(lineas.some((l) => l.tipo === "item")).toBe(true);
    for (const l of lineas) {
      expect(aWinAnsi(l.texto)).toBe(l.texto);
      expect(l.texto).not.toMatch(/whatsapp|financi|santander|cuotas|precalific/i);
    }
  });
});

describe("normalizarCatalogo", () => {
  it("excluye los productos sin precio (tutoriales)", () => {
    expect(catalogo.some((p) => p.titulo.startsWith("Tutorial"))).toBe(false);
    expect(catalogo.every((p) => p.precioCentavos > 0)).toBe(true);
  });
  it("usa la variante como id y el precio en centavos", () => {
    expect(porId(50605744423200)).toMatchObject({
      productoId: 10028189352224,
      titulo: "Farmtrac FT 6050 - 50HP - 4x4",
      precioCentavos: 1790000,
      ivaIncluido: false,
      sospechaIva: false,
      esRepuesto: false,
    });
  });
  it("lee el IVA de la etiqueta iva-incluido", () => {
    expect(porId(50404913873184)).toMatchObject({ ivaIncluido: true, sospechaIva: false });
  });
  it("marca como sospechosos de IVA a palas frontales, palas cajón y retros sin etiqueta", () => {
    expect(porId(49362879217952)).toMatchObject({ ivaIncluido: false, sospechaIva: true });
    expect(porId(48058042155296)).toMatchObject({ ivaIncluido: false, sospechaIva: true });
    expect(porId(47450481099040)).toMatchObject({ sospechaIva: false });
  });
  it("marca los repuestos", () => {
    expect(catalogo.filter((p) => p.esRepuesto).length).toBeGreaterThan(0);
  });
  it("pide la foto a Shopify en JPG de 1000 px", () => {
    expect(urlImagenPdf("https://x/a.png?v=1")).toBe("https://x/a.png?v=1&width=1000&format=pjpg");
    expect(urlImagenPdf("https://x/a.webp")).toBe("https://x/a.webp?width=1000&format=pjpg");
    expect(porId(50605744423200)?.imagenUrl).toMatch(/&width=1000&format=pjpg$/);
  });
});

function respuestaJson(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { "content-type": "application/json" },
  });
}

describe("obtenerCatalogo", () => {
  it("pide la página 1 con limit=250 y normaliza", async () => {
    const urls: string[] = [];
    const fetchImpl: FetchCatalogo = async (url) => {
      urls.push(url);
      return respuestaJson(crudo);
    };
    const productos = await obtenerCatalogo({ fetchImpl });
    expect(urls).toEqual(["https://florenciohernandez.com.uy/products.json?limit=250&page=1"]);
    expect(productos).toEqual(catalogo);
  });
  it("sigue a la página 2 cuando la primera viene llena", async () => {
    const base = crudo.products[0];
    const llena = Array.from({ length: 250 }, (_, i) => ({
      ...base,
      id: 1000 + i,
      variants: [{ ...base.variants[0], id: 5000 + i }],
    }));
    const urls: string[] = [];
    const fetchImpl: FetchCatalogo = async (url) => {
      urls.push(url);
      return respuestaJson({
        products: url.endsWith("page=1") ? llena : crudo.products.slice(0, 2),
      });
    };
    const productos = await obtenerCatalogo({ fetchImpl });
    expect(urls).toHaveLength(2);
    expect(productos.length).toBe(252);
  });
  it("falla con SHOPIFY_NO_DISPONIBLE si la web responde error", async () => {
    const fetchImpl: FetchCatalogo = async () => respuestaJson({}, 503);
    await expect(obtenerCatalogo({ fetchImpl })).rejects.toMatchObject({
      name: "ErrorCatalogo",
      codigo: "SHOPIFY_NO_DISPONIBLE",
    });
    await expect(obtenerCatalogo({ fetchImpl })).rejects.toBeInstanceOf(ErrorCatalogo);
  });
});
```

**Acceptance**

1. **WHEN** se normaliza `tests/fixtures/productos-shopify.json` **THE SYSTEM SHALL** excluir los productos con precio 0 y usar el id de variante con el precio en centavos (Farmtrac FT 6050 → id 50605744423200 y 1790000).
2. **WHEN** un producto tiene la etiqueta `iva-incluido` **THE SYSTEM SHALL** marcarlo con `ivaIncluido: true` y `sospechaIva: false`, y **WHEN** una pala frontal, pala cajón, retroexcavadora o chipeadora no la tiene **THE SYSTEM SHALL** marcarla con `sospechaIva: true`.
3. **WHEN** se limpia una descripción **THE SYSTEM SHALL** devolver líneas con ids L1…Ln, solo caracteres WinAnsi y sin menciones a WhatsApp, financiación, Santander, cuotas, precalificación ni precios escritos a mano («CONTADO U$S 2610»).
4. **WHEN** una descripción tiene las secciones «Ideal para», «Ficha técnica» y «El respaldo Florencio Hernández» **THE SYSTEM SHALL** marcar con `importante: false` los títulos y líneas de «Ideal para» y «El respaldo Florencio Hernández», y con `importante: true` los de «Ficha técnica».
5. **WHEN** la primera página de Shopify trae 250 productos **THE SYSTEM SHALL** pedir la página 2 y juntar las dos.
6. **WHEN** Shopify responde un estado de error **THE SYSTEM SHALL** fallar con `ErrorCatalogo` de código `SHOPIFY_NO_DISPONIBLE`.

**Verify**

```bash
npm run typecheck
npm run lint
npx vitest run tests/unit/catalogo.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T4: lectura y limpieza del catálogo de Shopify"
git tag step-04-catalogo
```

### `E1-T5` — Motor de cálculo, validación y esquema

**Depends on:** `E1-T4` · **Priority:** p0 — metadato para recortes de alcance, no un orden

`tipos.ts` y `esquema.ts` van tal cual: son el contrato entre la pantalla, la API y el PDF.
`calculo.ts` y `validacion.ts` se implementan con estas reglas hasta que pase el test.

`src/lib/cotizacion/tipos.ts`
```ts
import { VALIDEZ_POR_DEFECTO_DIAS } from "@/lib/config/negocio";

export type TipoDocumento = "cotizacion" | "proforma";

export type Cliente =
  | { tipo: "empresa"; razonSocial: string; rut: string }
  | { tipo: "persona"; nombre: string; cedula: string };

export type Descuento = { tipo: "porcentaje"; valor: number } | { tipo: "monto"; centavos: number };

export type Entrega =
  | { tipo: "inmediata" }
  | { tipo: "dias"; dias: number }
  | { tipo: "texto"; texto: string };

export type Item = {
  productoId: number;
  cantidad: number;
  descuento: Descuento | null;
  lineasOcultas: string[];
  mostrarFoto: boolean;
  precioVistoCentavos: number;
};

export type Borrador = {
  version: 1;
  tipoDocumento: TipoDocumento;
  cliente: Cliente | null;
  items: Item[];
  descuentoGeneral: Descuento | null;
  validezDias: number;
  entrega: Entrega | null;
  notas: string[];
};

export type Emisor = {
  sucursal: "san-jacinto" | "montevideo";
  vendedorNombre: string;
  vendedorCelular: string;
};

export type LineaCalculada = {
  productoId: number;
  titulo: string;
  cantidad: number;
  precioUnitarioCentavos: number;
  brutoCentavos: number;
  descuentoCentavos: number;
  netoCentavos: number;
  ivaIncluido: boolean;
};

export type Totales = {
  lineas: LineaCalculada[];
  subtotalCentavos: number;
  descuentoGeneralCentavos: number;
  totalCentavos: number;
  iva: "exento" | "incluido" | "mixto";
};

export type Problema = { campo: string; mensaje: string };

export function crearBorradorVacio(): Borrador {
  return {
    version: 1,
    tipoDocumento: "cotizacion",
    cliente: null,
    items: [],
    descuentoGeneral: null,
    validezDias: VALIDEZ_POR_DEFECTO_DIAS,
    entrega: null,
    notas: [],
  };
}

export function crearEmisorPorDefecto(): Emisor {
  return { sucursal: "san-jacinto", vendedorNombre: "", vendedorCelular: "" };
}
```

`src/lib/cotizacion/esquema.ts`
```ts
import { z } from "zod";

const esquemaDescuento = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("porcentaje"), valor: z.number().gt(0).max(100) }),
  z.object({ tipo: z.literal("monto"), centavos: z.number().int().positive() }),
]);

const esquemaCliente = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("empresa"),
    razonSocial: z.string().max(120),
    rut: z.string().max(20),
  }),
  z.object({ tipo: z.literal("persona"), nombre: z.string().max(120), cedula: z.string().max(15) }),
]);

const esquemaEntrega = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("inmediata") }),
  z.object({ tipo: z.literal("dias"), dias: z.number().int().min(1).max(365) }),
  z.object({ tipo: z.literal("texto"), texto: z.string().trim().min(1).max(80) }),
]);

export const esquemaItem = z.object({
  productoId: z.number().int().positive(),
  cantidad: z.number().int().min(1).max(99),
  descuento: esquemaDescuento.nullable(),
  lineasOcultas: z.array(z.string().max(10)).max(200),
  mostrarFoto: z.boolean(),
  precioVistoCentavos: z.number().int().nonnegative(),
});

export const esquemaBorrador = z.object({
  version: z.literal(1),
  tipoDocumento: z.enum(["cotizacion", "proforma"]),
  cliente: esquemaCliente.nullable(),
  items: z.array(esquemaItem).max(20),
  descuentoGeneral: esquemaDescuento.nullable(),
  validezDias: z.number().int().min(1).max(365),
  entrega: esquemaEntrega.nullable(),
  notas: z.array(z.string().trim().min(1).max(200)).max(10),
});

export const esquemaEmisor = z.object({
  sucursal: z.enum(["san-jacinto", "montevideo"]),
  vendedorNombre: z.string().trim().max(60),
  vendedorCelular: z.string().trim().max(30),
});

export const esquemaSolicitudPdf = z.object({
  borrador: esquemaBorrador,
  emisor: esquemaEmisor,
});

export type SolicitudPdf = z.infer<typeof esquemaSolicitudPdf>;
```

`src/lib/cotizacion/calculo.ts`
- `export function calcularDescuento(baseCentavos: number, descuento: Descuento | null): number`:
  `null` → 0; porcentaje → `Math.round(base * valor / 100)`; monto → `centavos`; el resultado se
  acota entre 0 y la base.
- `export type ResultadoTotales = { ok: true; totales: Totales } | { ok: false; codigo: "PRODUCTO_NO_DISPONIBLE"; mensaje: string; productoIds: number[] };`
- `export function calcularTotales(borrador: Borrador, catalogo: Producto[]): ResultadoTotales`:
  por ítem, `bruto = precioCentavos × cantidad`, `neto = bruto − descuento del ítem`; subtotal = suma
  de netos; el descuento general se aplica sobre el subtotal; `iva` es `"exento"` si ningún ítem es
  `ivaIncluido` (también sin ítems), `"incluido"` si todos lo son y `"mixto"` si hay de los dos. Si
  algún `productoId` no está en el catálogo: `ok: false` con mensaje
  `"Hay productos de la cotización que ya no están en la web"` y esos ids.

`src/lib/cotizacion/validacion.ts`
- `export function validarParaPdf(borrador: Borrador): Problema[]` (problemas que **bloquean** el
  PDF), en este orden y con estos textos: sin ítems `{ campo: "items", mensaje: "Agregá al menos un producto" }`;
  sin entrega `{ campo: "entrega", mensaje: "Elegí el plazo de entrega" }`; proforma sin cliente
  `{ campo: "cliente", mensaje: "La factura proforma necesita los datos del cliente" }`; empresa con
  razón social vacía `"Falta la razón social"` o RUT vacío `"Falta el RUT"`; persona con nombre vacío
  `"Falta el nombre"` o cédula vacía `"Falta la cédula"` (todos con `campo: "cliente"`).
- `export function advertencias(borrador: Borrador, catalogo: Producto[]): Problema[]` (avisos que
  **no** bloquean): RUT no vacío e inválido → `"Revisá el RUT: <motivo>"`; cédula no vacía e inválida →
  `"Revisá la cédula: <motivo>"` (campo `cliente`); por cada ítem con `sospechaIva` →
  `"«<titulo>» parece llevar IVA pero no tiene la etiqueta iva-incluido en Shopify"` (campo `items`).

**Files**
- `src/lib/cotizacion/tipos.ts` — nuevo
- `src/lib/cotizacion/calculo.ts` — nuevo
- `src/lib/cotizacion/validacion.ts` — nuevo
- `src/lib/cotizacion/esquema.ts` — nuevo
- `tests/unit/cotizacion.test.ts` — nuevo

`tests/unit/cotizacion.test.ts`
```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizarCatalogo } from "@/lib/catalogo/normalizar";
import { calcularDescuento, calcularTotales } from "@/lib/cotizacion/calculo";
import { esquemaSolicitudPdf } from "@/lib/cotizacion/esquema";
import {
  type Borrador,
  crearBorradorVacio,
  crearEmisorPorDefecto,
  type Item,
} from "@/lib/cotizacion/tipos";
import { advertencias, validarParaPdf } from "@/lib/cotizacion/validacion";

const catalogo = normalizarCatalogo(
  JSON.parse(readFileSync("tests/fixtures/productos-shopify.json", "utf8")),
);
const FARMTRAC = 50605744423200; // U$S 17.900, exento
const PALA_554 = 50404913873184; // U$S 7.300, etiqueta iva-incluido
const RETRO = 49362879217952; // U$S 5.900, sin etiqueta: sospecha de IVA

function item(productoId: number, extra: Partial<Item> = {}): Item {
  return {
    productoId,
    cantidad: 1,
    descuento: null,
    lineasOcultas: [],
    mostrarFoto: true,
    precioVistoCentavos: 0,
    ...extra,
  };
}

function borrador(extra: Partial<Borrador> = {}): Borrador {
  return { ...crearBorradorVacio(), ...extra };
}

function totales(b: Borrador) {
  const r = calcularTotales(b, catalogo);
  if (!r.ok) throw new Error(r.mensaje);
  return r.totales;
}

describe("calcularDescuento", () => {
  it("porcentaje redondeado al centavo", () => {
    expect(calcularDescuento(730000, { tipo: "porcentaje", valor: 5 })).toBe(36500);
    expect(calcularDescuento(999, { tipo: "porcentaje", valor: 33.3 })).toBe(333);
  });
  it("monto con tope en la base", () => {
    expect(calcularDescuento(730000, { tipo: "monto", centavos: 1000000 })).toBe(730000);
  });
  it("sin descuento", () => {
    expect(calcularDescuento(730000, null)).toBe(0);
  });
});

describe("calcularTotales", () => {
  it("tractor exento más pala con IVA incluido: mixto", () => {
    expect(totales(borrador({ items: [item(FARMTRAC), item(PALA_554)] }))).toMatchObject({
      subtotalCentavos: 2520000,
      descuentoGeneralCentavos: 0,
      totalCentavos: 2520000,
      iva: "mixto",
    });
  });
  it("aplica el descuento por ítem antes que el general", () => {
    const t = totales(
      borrador({
        items: [item(FARMTRAC), item(PALA_554, { descuento: { tipo: "porcentaje", valor: 5 } })],
        descuentoGeneral: { tipo: "monto", centavos: 50000 },
      }),
    );
    expect(t.lineas[1]).toMatchObject({
      brutoCentavos: 730000,
      descuentoCentavos: 36500,
      netoCentavos: 693500,
    });
    expect(t).toMatchObject({
      subtotalCentavos: 2483500,
      descuentoGeneralCentavos: 50000,
      totalCentavos: 2433500,
    });
  });
  it("descuento general porcentual", () => {
    const b = borrador({
      items: [item(FARMTRAC), item(PALA_554)],
      descuentoGeneral: { tipo: "porcentaje", valor: 10 },
    });
    expect(totales(b).totalCentavos).toBe(2268000);
  });
  it("multiplica por la cantidad", () => {
    expect(totales(borrador({ items: [item(PALA_554, { cantidad: 2 })] }))).toMatchObject({
      totalCentavos: 1460000,
      iva: "incluido",
    });
  });
  it("solo exentos da exento; vacío da cero", () => {
    expect(totales(borrador({ items: [item(FARMTRAC)] })).iva).toBe("exento");
    expect(totales(borrador())).toMatchObject({ totalCentavos: 0, iva: "exento", lineas: [] });
  });
  it("avisa si un producto ya no está en la web", () => {
    expect(calcularTotales(borrador({ items: [item(FARMTRAC), item(1)] }), catalogo)).toMatchObject(
      {
        ok: false,
        codigo: "PRODUCTO_NO_DISPONIBLE",
        productoIds: [1],
      },
    );
  });
});

describe("validarParaPdf", () => {
  it("un borrador vacío pide productos y plazo de entrega", () => {
    expect(validarParaPdf(borrador()).map((p) => p.campo)).toEqual(["items", "entrega"]);
  });
  it("la factura proforma exige cliente", () => {
    const b = borrador({
      tipoDocumento: "proforma",
      items: [item(FARMTRAC)],
      entrega: { tipo: "inmediata" },
    });
    expect(validarParaPdf(b)).toEqual([
      { campo: "cliente", mensaje: "La factura proforma necesita los datos del cliente" },
    ]);
  });
  it("una cotización completa sin cliente no tiene problemas", () => {
    const b = borrador({ items: [item(FARMTRAC)], entrega: { tipo: "dias", dias: 30 } });
    expect(validarParaPdf(b)).toEqual([]);
  });
  it("un cliente empresa sin RUT es un problema", () => {
    const b = borrador({
      items: [item(FARMTRAC)],
      entrega: { tipo: "inmediata" },
      cliente: { tipo: "empresa", razonSocial: "Agro Ejemplo S.A.", rut: "" },
    });
    expect(validarParaPdf(b)).toEqual([{ campo: "cliente", mensaje: "Falta el RUT" }]);
  });
});

describe("advertencias", () => {
  it("avisa un RUT inválido sin bloquear el PDF", () => {
    const b = borrador({
      items: [item(FARMTRAC)],
      entrega: { tipo: "inmediata" },
      cliente: { tipo: "empresa", razonSocial: "Agro Ejemplo S.A.", rut: "211234560018" },
    });
    expect(validarParaPdf(b)).toEqual([]);
    expect(advertencias(b, catalogo)).toEqual([
      { campo: "cliente", mensaje: "Revisá el RUT: El dígito verificador del RUT no coincide" },
    ]);
  });
  it("avisa productos que parecen llevar IVA sin la etiqueta", () => {
    expect(advertencias(borrador({ items: [item(RETRO)] }), catalogo)).toEqual([
      {
        campo: "items",
        mensaje:
          "«Retroexcavadora LW-6» parece llevar IVA pero no tiene la etiqueta iva-incluido en Shopify",
      },
    ]);
  });
});

describe("esquemaSolicitudPdf", () => {
  it("acepta una solicitud válida", () => {
    const solicitud = {
      borrador: borrador({
        items: [item(FARMTRAC, { precioVistoCentavos: 1790000 })],
        entrega: { tipo: "inmediata" },
      }),
      emisor: crearEmisorPorDefecto(),
    };
    expect(esquemaSolicitudPdf.safeParse(solicitud).success).toBe(true);
  });
  it("rechaza cantidad 0 y un porcentaje mayor a 100", () => {
    const emisor = crearEmisorPorDefecto();
    const cantidadCero = {
      borrador: borrador({ items: [item(FARMTRAC, { cantidad: 0 })] }),
      emisor,
    };
    const porcentaje = {
      borrador: borrador({ descuentoGeneral: { tipo: "porcentaje", valor: 150 } }),
      emisor,
    };
    expect(esquemaSolicitudPdf.safeParse(cantidadCero).success).toBe(false);
    expect(esquemaSolicitudPdf.safeParse(porcentaje).success).toBe(false);
  });
});
```

**Acceptance**

1. **WHEN** la cotización tiene el Farmtrac FT 6050 (U$S 17.900) y las Palas frontales para DF 554 (U$S 7.300) **THE SYSTEM SHALL** calcular subtotal y total de 2520000 centavos con IVA `mixto`.
2. **WHEN** la pala tiene 5% de descuento y hay un descuento general de U$S 500 **THE SYSTEM SHALL** calcular el neto de la pala en 693500, el subtotal en 2483500 y el total en 2433500 centavos.
3. **WHEN** un producto de la cotización ya no está en el catálogo **THE SYSTEM SHALL** devolver `PRODUCTO_NO_DISPONIBLE` con su id.
4. **WHEN** el borrador está vacío **THE SYSTEM SHALL** pedir productos y plazo de entrega, y **WHEN** es factura proforma sin cliente **THE SYSTEM SHALL** pedir los datos del cliente.
5. **WHEN** el RUT del cliente es inválido o un producto tiene `sospechaIva` **THE SYSTEM SHALL** devolver una advertencia sin sumar problemas que bloqueen el PDF.
6. **WHEN** la solicitud trae cantidad 0 o un porcentaje de descuento mayor a 100 **THE SYSTEM SHALL** rechazarla con `esquemaSolicitudPdf`.

**Verify**

```bash
npm run typecheck
npm run lint
npx vitest run tests/unit/cotizacion.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T5: motor de cálculo, validación y esquema"
git tag step-05-calculo
```

### `E1-T6` — Historial con Deshacer y borrador guardado

**Depends on:** `E1-T5` · **Priority:** p0 — metadato para recortes de alcance, no un orden

Todo cambio de la cotización (desde botones o desde el intérprete) es una `Accion` que aplica un
reducer puro. El historial agrupa varias acciones como un solo paso de Deshacer.

`src/lib/cotizacion/reducer.ts` exporta este tipo tal cual:

```ts
export type Accion =
  | { tipo: "agregar"; producto: Producto; cantidad: number }
  | { tipo: "quitar"; productoId: number }
  | { tipo: "cantidad"; productoId: number; cantidad: number }
  | { tipo: "descuentoItem"; productoId: number; descuento: Descuento | null }
  | { tipo: "descuentoGeneral"; descuento: Descuento | null }
  | { tipo: "validez"; dias: number }
  | { tipo: "entrega"; entrega: Entrega | null }
  | { tipo: "tipoDocumento"; valor: TipoDocumento }
  | { tipo: "cliente"; cliente: Cliente | null }
  | { tipo: "ocultarLinea"; productoId: number; lineaId: string; oculta: boolean }
  | { tipo: "mostrarFoto"; productoId: number; mostrar: boolean }
  | { tipo: "actualizarPrecio"; productoId: number; precioCentavos: number }
  | { tipo: "nota"; texto: string }
  | { tipo: "quitarNota"; indice: number }
  | { tipo: "nuevo" }
  | { tipo: "reemplazar"; borrador: Borrador };
```

- `export function aplicar(b: Borrador, a: Accion): Borrador` — puro, nunca muta `b`:
  - `agregar`: si el producto ya está, suma la cantidad y actualiza `precioVistoCentavos`; si no, agrega
    `{ productoId, cantidad, descuento: null, lineasOcultas: <ids de las líneas con importante=false>, mostrarFoto: true, precioVistoCentavos }`
    (las secciones de venta arrancan ocultas; el vendedor las puede volver a mostrar)
    al final. Cantidades acotadas y redondeadas a 1–99; validez a 1–365.
  - `ocultarLinea`: agrega o saca el id sin duplicarlo. `actualizarPrecio`: cambia `precioVistoCentavos`.
  - `nota`: agrega el texto recortado (máx. 200 caracteres) si no está vacío y hay menos de 10 notas.
  - `nuevo`: `crearBorradorVacio()`. `reemplazar`: devuelve el borrador recibido.
- `export type Historial = { actual: Borrador; pasado: Borrador[] };`
- `crearHistorial(borrador = crearBorradorVacio())`, `conHistorial(h, acciones: Accion[])` (aplica
  todas en orden y guarda el estado previo como **un** paso; lista vacía → mismo historial; guarda
  como máximo 30 pasos), `deshacer(h)` (sin pasos → mismo historial).

`src/lib/cotizacion/persistencia.ts`
- `export type Almacen = Pick<Storage, "getItem" | "setItem" | "removeItem">;`
- Claves: `CLAVE_BORRADOR = "fh-cotizador:borrador:v1"`, `CLAVE_EMISOR = "fh-cotizador:emisor:v1"`.
- `leerBorrador(almacen): Borrador | null` (JSON inválido, versión distinta o esquema que no cumple →
  `null`; nunca lanza), `guardarBorrador(almacen, b)` (si el navegador no deja guardar, se ignora),
  `leerEmisor(almacen): Emisor` (si no hay o es inválido → `crearEmisorPorDefecto()`),
  `guardarEmisor(almacen, e)`.

**Files**
- `src/lib/cotizacion/reducer.ts` — nuevo
- `src/lib/cotizacion/persistencia.ts` — nuevo
- `tests/unit/reducer.test.ts` — nuevo

`tests/unit/reducer.test.ts`
```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizarCatalogo, type Producto } from "@/lib/catalogo/normalizar";
import {
  type Almacen,
  CLAVE_BORRADOR,
  guardarBorrador,
  guardarEmisor,
  leerBorrador,
  leerEmisor,
} from "@/lib/cotizacion/persistencia";
import { aplicar, conHistorial, crearHistorial, deshacer } from "@/lib/cotizacion/reducer";
import { crearBorradorVacio, crearEmisorPorDefecto } from "@/lib/cotizacion/tipos";

const catalogo = normalizarCatalogo(
  JSON.parse(readFileSync("tests/fixtures/productos-shopify.json", "utf8")),
);

function producto(id: number): Producto {
  const p = catalogo.find((x) => x.id === id);
  if (!p) throw new Error(`falta el producto ${id} en el fixture`);
  return p;
}

const FARMTRAC = producto(50605744423200);
const PALA = producto(50404913873184);

function almacenFalso(): Almacen {
  const datos = new Map<string, string>();
  return {
    getItem: (clave) => datos.get(clave) ?? null,
    setItem: (clave, valor) => {
      datos.set(clave, valor);
    },
    removeItem: (clave) => {
      datos.delete(clave);
    },
  };
}

describe("aplicar", () => {
  it("agregar dos veces el mismo producto suma la cantidad y guarda el precio visto", () => {
    let b = aplicar(crearBorradorVacio(), { tipo: "agregar", producto: PALA, cantidad: 1 });
    b = aplicar(b, { tipo: "agregar", producto: PALA, cantidad: 1 });
    expect(b.items).toEqual([
      {
        productoId: PALA.id,
        cantidad: 2,
        descuento: null,
        lineasOcultas: [],
        mostrarFoto: true,
        precioVistoCentavos: 730000,
      },
    ]);
  });
  it("acota la cantidad a 1–99 y la validez a 1–365, y quita productos", () => {
    let b = aplicar(crearBorradorVacio(), { tipo: "agregar", producto: FARMTRAC, cantidad: 1 });
    b = aplicar(b, { tipo: "cantidad", productoId: FARMTRAC.id, cantidad: 500 });
    expect(b.items[0].cantidad).toBe(99);
    b = aplicar(b, { tipo: "validez", dias: 0 });
    expect(b.validezDias).toBe(1);
    b = aplicar(b, { tipo: "quitar", productoId: FARMTRAC.id });
    expect(b.items).toEqual([]);
  });
  it("oculta y vuelve a mostrar una línea de la descripción sin duplicarla", () => {
    let b = aplicar(crearBorradorVacio(), { tipo: "agregar", producto: FARMTRAC, cantidad: 1 });
    const deVenta = FARMTRAC.lineas.filter((l) => !l.importante).map((l) => l.id);
    expect(deVenta).toEqual(["L2", "L3", "L4", "L5", "L6", "L7", "L8", "L9", "L10", "L26", "L27"]);
    expect(b.items[0].lineasOcultas).toEqual(deVenta);
    const ocultar = { tipo: "ocultarLinea", productoId: FARMTRAC.id, lineaId: "L12" } as const;
    b = aplicar(b, { ...ocultar, oculta: true });
    b = aplicar(b, { ...ocultar, oculta: true });
    expect(b.items[0].lineasOcultas).toEqual([...deVenta, "L12"]);
    b = aplicar(b, { ...ocultar, oculta: false });
    expect(b.items[0].lineasOcultas).toEqual(deVenta);
  });
  it("actualizarPrecio acepta el precio nuevo de la web", () => {
    let b = aplicar(crearBorradorVacio(), { tipo: "agregar", producto: FARMTRAC, cantidad: 1 });
    b = aplicar(b, { tipo: "actualizarPrecio", productoId: FARMTRAC.id, precioCentavos: 1850000 });
    expect(b.items[0].precioVistoCentavos).toBe(1850000);
  });
  it("nuevo vuelve al borrador vacío", () => {
    const b = aplicar(crearBorradorVacio(), { tipo: "agregar", producto: FARMTRAC, cantidad: 1 });
    expect(aplicar(b, { tipo: "nuevo" })).toEqual(crearBorradorVacio());
  });
});

describe("historial", () => {
  it("varias acciones juntas se deshacen de una sola vez", () => {
    const h1 = conHistorial(crearHistorial(), [
      { tipo: "agregar", producto: FARMTRAC, cantidad: 1 },
      { tipo: "validez", dias: 15 },
    ]);
    expect(h1.actual.validezDias).toBe(15);
    const h2 = deshacer(h1);
    expect(h2.actual).toEqual(crearBorradorVacio());
    expect(deshacer(h2)).toEqual(h2);
  });
  it("guarda como máximo 30 pasos", () => {
    let h = crearHistorial();
    for (let dias = 1; dias <= 40; dias++) h = conHistorial(h, [{ tipo: "validez", dias }]);
    expect(h.pasado).toHaveLength(30);
    expect(h.actual.validezDias).toBe(40);
  });
});

describe("persistencia", () => {
  it("guarda y lee el borrador", () => {
    const almacen = almacenFalso();
    const b = aplicar(crearBorradorVacio(), { tipo: "agregar", producto: FARMTRAC, cantidad: 1 });
    guardarBorrador(almacen, b);
    expect(leerBorrador(almacen)).toEqual(b);
  });
  it("ignora un borrador corrupto o de otra versión", () => {
    const almacen = almacenFalso();
    almacen.setItem(CLAVE_BORRADOR, "{no es json");
    expect(leerBorrador(almacen)).toBeNull();
    almacen.setItem(CLAVE_BORRADOR, JSON.stringify({ version: 2 }));
    expect(leerBorrador(almacen)).toBeNull();
  });
  it("el emisor arranca con valores por defecto y se puede cambiar", () => {
    const almacen = almacenFalso();
    expect(leerEmisor(almacen)).toEqual(crearEmisorPorDefecto());
    guardarEmisor(almacen, {
      sucursal: "montevideo",
      vendedorNombre: "Ana",
      vendedorCelular: "099 123 456",
    });
    expect(leerEmisor(almacen).sucursal).toBe("montevideo");
  });
});
```

**Acceptance**

1. **WHEN** se agrega dos veces el mismo producto **THE SYSTEM SHALL** dejar un solo ítem con cantidad 2 y el precio visto de la web.
2. **WHEN** se pide cantidad 500 o validez 0 **THE SYSTEM SHALL** acotarlas a 99 y a 1.
3. **WHEN** se aplican varias acciones juntas y después Deshacer **THE SYSTEM SHALL** volver al estado anterior a todas ellas en un solo paso.
4. **WHEN** se hicieron 40 cambios **THE SYSTEM SHALL** guardar como máximo 30 pasos de Deshacer.
5. **WHEN** el borrador guardado en el navegador está corrupto o es de otra versión **THE SYSTEM SHALL** ignorarlo y devolver `null`.
6. **WHEN** se agrega el Farmtrac FT 6050 **THE SYSTEM SHALL** dejar ocultas de entrada las líneas de sus secciones de venta (L2 a L10, L26 y L27) y visible su ficha técnica.

**Verify**

```bash
npm run typecheck
npm run lint
npx vitest run tests/unit/reducer.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T6: historial con Deshacer y borrador guardado"
git tag step-06-historial
```

### `E1-T7` — Intérprete de frases en lenguaje simple

**Depends on:** `E1-T6` · **Priority:** p0 — metadato para recortes de alcance, no un orden

Código determinista, sin IA ni red, que traduce frases como «agregale la pala», «5% de descuento» o
«hacela proforma» a `Accion[]`. Si una parte no se entiende, no aplica nada. Implementalo con estas
reglas hasta que pase el test, que va tal cual.

`src/lib/interprete/texto.ts`
- `normalizarTexto(texto)`: NFD, sin marcas diacríticas, minúsculas, espacios colapsados, recortado
  («Sacá» → «saca», «añadí» → «anadi»).
- `parsearNumero(texto): number | null` sobre `^(\d[\d.,]*)\s*(mil)?$`: con `.` y `,` → el punto es
  miles y la coma decimal; solo `,` → decimal; solo `.` con forma `\d{1,3}(\.\d{3})+` → miles; si no,
  decimal; `mil` multiplica por 1000 («23.000» → 23000, «23 mil» → 23000, «5,5» → 5.5).
- `tokenizar(texto)`: normaliza, cambia `1,80` por `1.80`, separa dígitos de letras (`1.60mts` →
  `1.60 mts`, `ft26` → `ft 26`), corta por todo lo que no sea `[a-z0-9.]` y saca puntos de los bordes.

`src/lib/interprete/buscar.ts`
- Palabras vacías: `el la los las un una unos unas de del para con y al a otra otro otros otras tambien mas le lo`.
  Se ignoran también los tokens de una letra que no son números.
- Un token de la consulta coincide con un título si: es `tractor`/`tractores` y el título empieza con
  `Dong Feng`, `Farmtrac`, `Iseki` o `Landtrac`; o es numérico y el título tiene ese token exacto; o la
  raíz de algún token del título empieza con su raíz (raíz = sacar `es`/`s` final a tokens de más de 4
  letras: «palas» → «pala», «frontales» → «frontal»). Un producto es candidato si coinciden **todos** los tokens.
- Puntaje: base 100; −50 si es repuesto y la consulta no dice filtro/repuesto. Si la cotización tiene
  un tractor (título con marca): +30 si el candidato comparte un número de 3–4 dígitos con él (554,
  904, 6050…); si el tractor tiene «cabina», +10 a candidatos con «cabina» y −10 sin; si no la tiene,
  −10 a candidatos con «cabina»; −40 si el candidato es otro tractor o combo (título con marca) y la
  consulta no nombra marca ni «tractor».
- `buscarProductos(consulta, espacio: Producto[], contexto = { enBorrador: [] }): Candidato[]`
  ordenado por puntaje y después por título (`localeCompare(..., "es")`).
- `elegir(candidatos)`: ninguno → `{ tipo: "ninguno" }`; uno solo, o el primero le saca 10 puntos o
  más al segundo → `{ tipo: "unico", producto }`; si no → `{ tipo: "varios", opciones }` con los que
  están a menos de 10 puntos del primero, hasta 6.

`src/lib/interprete/interpretar.ts`
- Tipos exportados:
  ```ts
  export type Opcion = { etiqueta: string; acciones: Accion[]; resumen: string[] };
  export type ResultadoInterprete =
    | { estado: "ok"; acciones: Accion[]; resumen: string[] }
    | { estado: "elegir"; pregunta: string; opciones: Opcion[] }
    | { estado: "no-entendi"; mensaje: string };
  export type ContextoInterprete = { borrador: Borrador; catalogo: Producto[] };
  ```
- `interpretar(texto, contexto)`:
  1. Vacío → `no-entendi` «Escribí qué querés cambiar».
  2. **Cliente primero, sobre el texto original** (respeta mayúsculas y tildes):
     `/\bcliente\s*:?\s+(.+?)\s*,?\s+rut\s*:?\s*([\d.\s-]*\d)/i` → empresa (RUT = solo dígitos),
     resumen `Cliente: <razón social> (RUT <dígitos>)`; si no,
     `/\bcliente\s*:?\s+(.+?)\s*,?\s+(?:c[eé]dula|c\.\s?i\.|ci)\s*:?\s*([\d.\s-]*\d)/i` → persona,
     resumen `Cliente: <nombre> (C.I. <formatearCedula>)`. Se saca del texto y se aplica al borrador.
  3. El resto se parte en cláusulas por `;`, por `, ` y por ` y ` cuando lo sigue un verbo o un
     número (`agreg sum pon anad añad sac quit elimin borr descuento validez entrega hacel pasal cambi
     dejal precio total cantidad` o un dígito). Cada cláusula ve el borrador con lo anterior ya aplicado.
  4. Si una cláusula da `no-entendi`, se devuelve eso y nada se aplica. Si da `elegir`, se devuelve
     la pregunta con las acciones anteriores sumadas a cada opción (si quedaban cláusulas, la pregunta
     agrega ` (después volvé a escribir: «…»)`). Sin acciones al final → `No entendí: «<texto>»`.
- Reglas por cláusula (texto normalizado), **en este orden**:
  1. `\bproforma\b` → tipo proforma, «Ahora es factura proforma». `\bcotizacion\b` → «Ahora es cotización».
  2. `\bvalidez\b\D*(\d{1,3})\b` → validez (1–365, si no «La validez tiene que ser de 1 a 365 días»),
     «Validez: N días».
  3. `\binmediata\b` → «Entrega inmediata». `\bentrega\b\D*(\d{1,3})\s*dias?\b` → «Entrega en N días».
     `\bentrega\b.*\ba (convenir|confirmar)\b` → texto «A confirmar», «Entrega a confirmar».
  4. `\bsin descuentos?\b`, o empieza con saca/sacale/quita/quitale/elimina/borra y dice descuento →
     descuento general `null`, «Sin descuento general».
  5. `\b(dejalo|dejala|dejarlo|dejarla|precio final|total)\b\D*?(\d[\d.,]*(?:\s*mil)?)` → precio final:
     subtotal = `calcularTotales` sin descuento general; sin productos → «Primero agregá productos»;
     objetivo ≥ subtotal → «El precio final tiene que ser menor que el subtotal (<U$S subtotal>)»; si no,
     descuento general en monto = subtotal − objetivo, «Precio final <U$S objetivo>».
  6. `(\d+(?:[.,]\d+)?)\s*(?:%|por ?ciento)` → porcentaje (más de 0 y hasta 100, si no «El descuento
     tiene que ser de más de 0% y hasta 100%»). `\bdescuento\b\s*(?:de\s*)?(?:u\$s|usd|us\$|\$)?\s*(\d[\d.,]*(?:\s*mil)?)`
     → monto. En los dos, si lo que sigue tiene `(en|al|a|para) <consulta>`, se busca `<consulta>`
     entre los productos de la cotización: descuento de ítem («Descuento de 5% en <título>»); si no hay
     consulta, descuento general («Descuento general 5%» / «Descuento general U$S 500»). Porcentaje con
     decimales se muestra con coma.
  7. `^(?:cantidad\s*)?(\d{1,2})\s*(?:unidades|unidad|u)\b\s*(?:de\s+)?(.*)$` o
     `^cantidad\s*(\d{1,2})\s*(?:de\s+)?(.*)$` → cantidad (1–99) del producto buscado en la
     cotización (sin consulta y un solo ítem: ese), «Cantidad de <título>: N».
  8. Empieza con `saca sacale sacar quita quitale quitar elimina eliminar borra borrar` → quitar,
     «Quité <título>».
  9. Empieza con `agrega agregale agregame agregar suma sumale sumar pone ponele poner anade anadi
     anadile anadir mete metele quiero` → agregar: la consulta se parte por ` y ` y cada parte puede
     empezar con una cantidad («2 palas»); se busca en el catálogo con los productos de la cotización
     como contexto; resumen `Agregué [N × ]<título> (<U$S precio>)`; varias opciones → pregunta
     «¿Cuál querés agregar?» con etiquetas `<título> (<U$S precio>)`; ninguna → «No encontré «<parte>» en el catálogo».
  10. Sin verbo: se intenta agregar solo si hay un único producto; si no → «No entendí: «<cláusula>»».
- Búsquedas dentro de la cotización sin resultado → «No encontré «<consulta>» en la cotización»; con
  varias opciones → preguntas «¿A cuál le aplico el descuento?», «¿De cuál producto cambio la cantidad?»,
  «¿Cuál saco?».

**Files**
- `src/lib/interprete/texto.ts` — nuevo
- `src/lib/interprete/buscar.ts` — nuevo
- `src/lib/interprete/interpretar.ts` — nuevo
- `tests/unit/interprete.test.ts` — nuevo

`tests/unit/interprete.test.ts`
```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizarCatalogo, type Producto } from "@/lib/catalogo/normalizar";
import { aplicar } from "@/lib/cotizacion/reducer";
import { type Borrador, crearBorradorVacio } from "@/lib/cotizacion/tipos";
import { interpretar } from "@/lib/interprete/interpretar";

const catalogo = normalizarCatalogo(
  JSON.parse(readFileSync("tests/fixtures/productos-shopify.json", "utf8")),
);

const DF554 = 46732183077152; // Dong Feng DF 554 G3 - 55HP 4x4 (U$S 17.300)
const DF554_CABINA = 45523976487200; // Dong Feng DF 554 G3 con cabina
const PALA_554 = 50404913873184; // Palas frontales para DF 554 (U$S 7.300)
const PALA_554_CABINA = 50892279316768; // Palas frontales para DF 554 cabina
const PALA_904 = 48570276970784;
const PALA_CAJON = 48058042155296;
const PALA_NIVELADORA = 47450481099040;
const COMBO_554 = 50892293308704; // Dong Feng DF 554 con Pala frontal
const RETRO = 49362879217952;
const FARMTRAC = 50605744423200;

function producto(id: number): Producto {
  const p = catalogo.find((x) => x.id === id);
  if (!p) throw new Error(`falta el producto ${id} en el fixture`);
  return p;
}

function conItems(...ids: number[]): Borrador {
  return ids.reduce(
    (b, id) => aplicar(b, { tipo: "agregar", producto: producto(id), cantidad: 1 }),
    crearBorradorVacio(),
  );
}

function ok(texto: string, borrador: Borrador = crearBorradorVacio()) {
  const r = interpretar(texto, { borrador, catalogo });
  if (r.estado !== "ok") throw new Error(`esperaba ok para «${texto}»: ${JSON.stringify(r)}`);
  return r;
}

describe("agregar productos", () => {
  it("«agregale la pala» con un DF 554 elige la pala del 554 sin cabina", () => {
    const r = ok("agregale la pala", conItems(DF554));
    expect(r.acciones).toHaveLength(1);
    expect(r.acciones[0]).toMatchObject({
      tipo: "agregar",
      cantidad: 1,
      producto: { id: PALA_554 },
    });
    expect(r.resumen).toEqual(["Agregué Palas frontales para DF 554 (U$S 7.300)"]);
  });
  it("con el DF 554 con cabina elige la pala para cabina", () => {
    const r = ok("agregale la pala", conItems(DF554_CABINA));
    expect(r.acciones[0]).toMatchObject({ tipo: "agregar", producto: { id: PALA_554_CABINA } });
  });
  it("sin tractor en la cotización pregunta cuál pala, con hasta 6 opciones", () => {
    const r = interpretar("agregá la pala", { borrador: crearBorradorVacio(), catalogo });
    expect(r.estado).toBe("elegir");
    if (r.estado !== "elegir") return;
    expect(r.pregunta).toBe("¿Cuál querés agregar?");
    const ids = r.opciones.map((o) => {
      const accion = o.acciones[0];
      return accion.tipo === "agregar" ? accion.producto.id : 0;
    });
    expect(new Set(ids)).toEqual(
      new Set([PALA_554, PALA_554_CABINA, PALA_904, PALA_CAJON, PALA_NIVELADORA, COMBO_554]),
    );
  });
  it("encuentra la retro por el comienzo de la palabra", () => {
    expect(ok("agregá la retro").acciones[0]).toMatchObject({ producto: { id: RETRO } });
  });
  it("agrega dos productos separados por «y»", () => {
    const r = ok("agregá la retro y la pala niveladora");
    expect(r.acciones.map((a) => (a.tipo === "agregar" ? a.producto.id : 0))).toEqual([
      RETRO,
      PALA_NIVELADORA,
    ]);
  });
  it("sin verbo, agrega solo si hay un único producto que coincide", () => {
    expect(ok("farmtrac 6050").acciones[0]).toMatchObject({ producto: { id: FARMTRAC } });
  });
  it("avisa cuando el producto no está en el catálogo", () => {
    const r = interpretar("agregá la sembradora", { borrador: crearBorradorVacio(), catalogo });
    expect(r).toEqual({
      estado: "no-entendi",
      mensaje: "No encontré «la sembradora» en el catálogo",
    });
  });
});

describe("descuentos y precio final", () => {
  it("«5% de descuento» es un descuento general", () => {
    const r = ok("5% de descuento", conItems(DF554));
    expect(r.acciones).toEqual([
      { tipo: "descuentoGeneral", descuento: { tipo: "porcentaje", valor: 5 } },
    ]);
    expect(r.resumen).toEqual(["Descuento general 5%"]);
  });
  it("«descuento de 500 dólares» es un monto en centavos", () => {
    expect(ok("descuento de 500 dólares", conItems(DF554)).acciones).toEqual([
      { tipo: "descuentoGeneral", descuento: { tipo: "monto", centavos: 50000 } },
    ]);
  });
  it("«5% en el tractor» descuenta solo el tractor", () => {
    expect(ok("5% en el tractor", conItems(DF554, PALA_554)).acciones).toEqual([
      { tipo: "descuentoItem", productoId: DF554, descuento: { tipo: "porcentaje", valor: 5 } },
    ]);
  });
  it("«dejalo en 23.000» calcula el descuento general que falta", () => {
    const r = ok("dejalo en 23.000", conItems(DF554, PALA_554));
    expect(r.acciones).toEqual([
      { tipo: "descuentoGeneral", descuento: { tipo: "monto", centavos: 160000 } },
    ]);
    expect(r.resumen).toEqual(["Precio final U$S 23.000"]);
  });
  it("un precio final mayor al subtotal no se aplica", () => {
    const r = interpretar("dejalo en 30.000", { borrador: conItems(DF554, PALA_554), catalogo });
    expect(r).toEqual({
      estado: "no-entendi",
      mensaje: "El precio final tiene que ser menor que el subtotal (U$S 24.600)",
    });
  });
  it("«sin descuento» borra el descuento general", () => {
    expect(ok("sin descuento").acciones).toEqual([{ tipo: "descuentoGeneral", descuento: null }]);
  });
});

describe("condiciones y documento", () => {
  it("cambia la validez", () => {
    expect(ok("cambiá la validez a 15 días").acciones).toEqual([{ tipo: "validez", dias: 15 }]);
  });
  it("entrega inmediata y entrega en días", () => {
    expect(ok("entrega inmediata").acciones).toEqual([
      { tipo: "entrega", entrega: { tipo: "inmediata" } },
    ]);
    expect(ok("entrega en 30 días").acciones).toEqual([
      { tipo: "entrega", entrega: { tipo: "dias", dias: 30 } },
    ]);
  });
  it("«hacela proforma» cambia el tipo de documento", () => {
    expect(ok("hacela proforma").acciones).toEqual([{ tipo: "tipoDocumento", valor: "proforma" }]);
  });
});

describe("cliente", () => {
  it("empresa con RUT, respetando mayúsculas", () => {
    const r = ok("cliente Agro Ejemplo S.A. rut 211234560019");
    expect(r.acciones).toEqual([
      {
        tipo: "cliente",
        cliente: { tipo: "empresa", razonSocial: "Agro Ejemplo S.A.", rut: "211234560019" },
      },
    ]);
    expect(r.resumen).toEqual(["Cliente: Agro Ejemplo S.A. (RUT 211234560019)"]);
  });
  it("persona con cédula", () => {
    const r = ok("cliente Juan Pérez cédula 1.234.567-2");
    expect(r.acciones).toEqual([
      { tipo: "cliente", cliente: { tipo: "persona", nombre: "Juan Pérez", cedula: "12345672" } },
    ]);
    expect(r.resumen).toEqual(["Cliente: Juan Pérez (C.I. 1.234.567-2)"]);
  });
});

describe("quitar y cantidad", () => {
  it("«sacá la pala» quita la pala de la cotización", () => {
    expect(ok("sacá la pala", conItems(DF554, PALA_554)).acciones).toEqual([
      { tipo: "quitar", productoId: PALA_554 },
    ]);
  });
  it("«2 unidades de la pala» cambia la cantidad", () => {
    expect(ok("2 unidades de la pala", conItems(DF554, PALA_554)).acciones).toEqual([
      { tipo: "cantidad", productoId: PALA_554, cantidad: 2 },
    ]);
  });
});

describe("frases combinadas", () => {
  it("coma y «y» separan pedidos", () => {
    const r = ok("agregá la retro, validez 15 días");
    expect(r.acciones.map((a) => a.tipo)).toEqual(["agregar", "validez"]);
  });
  it("«agregale la pala y 5% de descuento» aplica las dos cosas", () => {
    const r = ok("agregale la pala y 5% de descuento", conItems(DF554));
    expect(r.acciones.map((a) => a.tipo)).toEqual(["agregar", "descuentoGeneral"]);
  });
  it("una frase que no entiende no aplica nada", () => {
    const r = interpretar("hola que tal", { borrador: crearBorradorVacio(), catalogo });
    expect(r).toEqual({ estado: "no-entendi", mensaje: "No entendí: «hola que tal»" });
  });
});
```

**Acceptance**

1. **WHEN** se escribe «agregale la pala» con un Dong Feng DF 554 G3 en la cotización **THE SYSTEM SHALL** agregar las Palas frontales para DF 554 y resumir «Agregué Palas frontales para DF 554 (U$S 7.300)».
2. **WHEN** se escribe «agregá la pala» sin tractor en la cotización **THE SYSTEM SHALL** preguntar «¿Cuál querés agregar?» con las 6 palas del catálogo de prueba como opciones.
3. **WHEN** se escribe «dejalo en 23.000» con un subtotal de U$S 24.600 **THE SYSTEM SHALL** poner un descuento general de 160000 centavos.
4. **WHEN** se escribe «cliente Agro Ejemplo S.A. rut 211234560019» **THE SYSTEM SHALL** cargar un cliente empresa con esa razón social y ese RUT.
5. **WHEN** una parte de la frase no se entiende **THE SYSTEM SHALL** devolver `no-entendi` sin aplicar ninguna acción.
6. **WHEN** corre `npx vitest run tests/unit/interprete.test.ts` **THE SYSTEM SHALL** pasar con 0 fallas.

**Verify**

```bash
npm run typecheck
npm run lint
npx vitest run tests/unit/interprete.test.ts
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T7: intérprete de frases en lenguaje simple"
git tag step-07-interprete
```

---

## Epic acceptance

El epic está hecho cuando todas las tareas están `done` **y**:

1. **WHEN** corre la suite completa **THE SYSTEM SHALL** pasar los 7 archivos de tests unitarios de este epic con 0 fallas.
2. **WHEN** el servidor armado recibe una página sin cookie **THE SYSTEM SHALL** redirigir a /acceso, y con la cookie **THE SYSTEM SHALL** responder 200.

```bash
npm run typecheck && npm run lint && npm test
npm run build && node scripts/probar-servidor.mjs "GET / 307 destino=/acceso" "GET / 200 acceso" "GET /api/salud 200 contiene=fh-cotizador"
```

## Pitfalls

- **Escapes que se pierden.** `sed`/`perl` y algunos editores se comen la barra invertida de los escapes Unicode dentro de strings:
  por eso las marcas de `descripcion.ts` son `String.fromCharCode(1)` y `String.fromCharCode(2)`.
- **`middleware.ts` no existe en Next 16:** el archivo es `src/proxy.ts` y la función se llama `proxy`.
- **El `Secure` de la cookie** se activa solo con `NODE_ENV=production`; `next start` en localhost lo
  acepta igual. No lo saques.
- **Montos en coma flotante:** `0.1 + 0.2` rompe centavos. Todo en enteros.
- **Tildes en los mensajes:** los tests comparan «Agregué», «Validez: 15 días», «dieciséis». Copiá los
  textos de este epic.

## Before moving on

- [ ] Todas las tareas de este epic están `done` en `tasks.json`; ninguna quedó `in_progress`.
- [ ] Pasaron todos los comandos `verify` de todas las tareas, no solo el primero.
- [ ] No se editó ni se salteó ningún comando `verify`.
- [ ] Cada tarea tiene su tag (`git tag -l 'step-*'` lista `step-01-base` … `step-07-interprete`).
- [ ] El gate pasa limpio desde la raíz del proyecto.
- [ ] Existen todas las firmas de "Produced".
- [ ] No se tocó ningún archivo fuera del árbol de este epic.
- [ ] `.env.example` sigue con `ACCESS_KEY` como única variable.
- [ ] Un commit por tarea, con el id adelante, seguido de su tag.
