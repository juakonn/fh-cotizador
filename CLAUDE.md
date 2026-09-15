# FH Cotizador

App interna de Florencio Hernández (Riaden S.A.) para armar cotizaciones y facturas proforma en PDF
a partir del catálogo de la web (Shopify), con ajustes escritos en lenguaje simple.

## Comandos

| Tarea | Comando |
|---|---|
| Instalar | `npm install` |
| Desarrollo | `npm run dev` — http://localhost:3000 |
| Build | `npm run build` |
| Tipos | `npm run typecheck` |
| Lint / formato | `npm run lint` · `npm run format` |
| Tests unitarios | `npm test` · un archivo: `npx vitest run tests/unit/<archivo>` |
| E2E | `npm run test:e2e` (navegador: `npx playwright install chromium`) |
| Probar el servidor armado | `node scripts/probar-servidor.mjs "GET /api/salud 200"` (después de `npm run build`) |
| Revisar etiquetas de IVA | `npm run iva:revisar` |
| Todo junto | `npm run verificar` |

**Gate:** `npm run typecheck && npm run lint && npm test` pasa antes de marcar cualquier tarea como hecha.

Node queda fijado en `.nvmrc` (24). Las versiones exactas están en `package.json` y en el lockfile:
nunca adivines una.

**Orden de construcción:** `blueprints/fh-cotizador/tasks.json` y `blueprints/fh-cotizador/epics/`.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS 4 · @react-pdf/renderer · sharp · zod · Vitest · Playwright ·
Biome · npm · Vercel (plan gratis). Sin base de datos, sin IA, sin servicios pagos.

## Arquitectura

**Camino de la página.** `src/proxy.ts` (cookie `fh_acceso`) → `src/app/page.tsx` (servidor: lee el
catálogo con `src/lib/catalogo/shopify.ts`) → `src/components/cotizador/Cotizador.tsx` (cliente: estado
con `src/lib/cotizacion/reducer.ts`, borrador en localStorage con `persistencia.ts`, frases con
`src/lib/interprete/interpretar.ts`).

**Camino del PDF.** `BarraTotal.tsx` → `POST /api/pdf` (`src/app/api/pdf/route.ts`) →
`src/lib/pdf/generar.ts` (valida con `esquema.ts`, relee el catálogo, recalcula con `calculo.ts`,
compara precios, baja fotos) → `src/lib/pdf/documento.tsx` → PDF.

**Fuente de verdad: Shopify.** Precios, títulos, descripciones, fotos y la etiqueta `iva-incluido` se
leen de `https://florenciohernandez.com.uy/products.json`. La app nunca guarda ni edita precios.

| Capa | Puede importar | Nunca |
|---|---|---|
| `src/app/**` | `components`, `lib` | lógica de negocio escrita en la ruta |
| `src/components/**` | `lib/cotizacion`, `lib/interprete`, `lib/dinero`, `lib/documentos`, `lib/config`, tipos de `lib/catalogo/normalizar` | `lib/pdf`, `lib/catalogo/shopify`, `lib/acceso`, `node:*` |
| `src/lib/**` | otros `lib`, `zod` | `components`, React DOM |
| `src/lib/pdf/**` | `lib` | ser importado por `components` o por `scripts` |
| `scripts/**` | `lib` salvo `lib/pdf` | `@react-pdf/renderer` (tsx no lo puede cargar) |

| Tema | Único lugar |
|---|---|
| Datos fijos del negocio (URL Shopify, validez, forma de pago, sucursales, celular fijo de cada vendedor) | `src/lib/config/negocio.ts` |
| Tipos de la cotización | `src/lib/cotizacion/tipos.ts` |
| Validación de lo que llega a la API | `src/lib/cotizacion/esquema.ts` (zod) |
| Montos, formato y letras | `src/lib/dinero/formato.ts`, `src/lib/dinero/letras.ts` |
| RUT y cédula | `src/lib/documentos/identificacion.ts` |
| Clave y cookie de acceso | `src/lib/acceso.ts` |
| Colores | bloque `@theme` de `src/app/globals.css` |
| Membrete y logo del PDF | `src/lib/pdf/assets/` |

## Reglas de código

1. La plata va siempre en **centavos enteros**. El único `Number(price)` está en
   `src/lib/catalogo/normalizar.ts`.
2. El total en letras sale de `montoEnLetras(totalCentavos)`, el mismo entero que `formatearUSD`.
   Nunca se escribe a mano.
3. Todo texto que va al PDF pasa por `aWinAnsi()`: Helvetica no tiene emojis ni flechas.
4. Alias `@/` → `src/`. Sin archivos barril (`index.ts`).
5. Componentes de servidor por defecto. `"use client"` solo en `src/components/cotizador/*`.
6. Máximo 300 líneas por archivo; si pasa, se divide por responsabilidad.
7. La API responde errores con un solo sobre: `{ error: { codigo, mensaje, detalle? } }`.
8. Scripts sueltos: extensión `.mts`, se corren con `tsx`, sin `await` fuera de funciones async en
   `.ts`, y nunca importan `src/lib/pdf/**`.
9. Todo control interactivo tiene nombre accesible (label o `aria-label`). Los tests e2e lo buscan
   por rol y nombre exactos: no se renombran sin cambiar el test.

## Diseño

| Token (`@theme`) | Valor | Uso |
|---|---|---|
| `--color-marino` | `#0c2641` | barra superior, botón principal, títulos |
| `--color-marino-claro` | `#163a5f` | hover del botón principal |
| `--color-dorado` | `#c9a34b` | acentos, bordes destacados (nunca texto chico) |
| `--color-fondo` | `#f5f6f8` | fondo de página |
| `--color-superficie` | `#ffffff` | tarjetas y campos |
| `--color-borde` | `#d9dee7` | bordes y separadores |
| `--color-texto` | `#14202e` | texto |
| `--color-texto-suave` | `#5b6878` | ayudas y leyendas |
| `--color-error` | `#b42318` | errores y advertencias |
| `--color-ok` | `#1f7a4d` | confirmaciones |

- Tipografía: pila del sistema (`--font-sans`). Base 16px; títulos 20/24px semibold.
- Espaciado Tailwind (múltiplos de 4px). Bordes: `rounded-lg` en campos y botones, `rounded-xl` en tarjetas.
- Botones y controles de al menos 44px de alto: se usa con el pulgar en el celular.
- Diseño mobile-first, ancho máximo 42rem (`max-w-2xl`). Sin modo oscuro. Sin animaciones salvo
  `transition-colors`.

## Entorno

| Variable | Requerida | Usada por | De dónde |
|---|---|---|---|
| `ACCESS_KEY` | sí (desde el paso 2) | `src/lib/acceso.ts`, `scripts/probar-servidor.mjs`, `playwright.config.ts` | local: `.env.local` (copia de `.env.example`); producción: Vercel → Settings → Environment Variables |

`.env.example` se commitea y queda al día. `.env.local` y cualquier otra clave real, nunca.

## Reglas por área

| Archivo | Aplica a |
|---|---|
| `.claude/rules/pdf.md` | `src/lib/pdf/**`, `src/app/api/pdf/**` |
| `.claude/rules/interprete.md` | `src/lib/interprete/**` |
| `.claude/rules/catalogo.md` | `src/lib/catalogo/**`, `scripts/**` |
| `.claude/rules/interfaz.md` | `src/components/**`, `src/app/**/*.tsx` |

## No negociable

1. Shopify es la única fuente de precios: nada de precios cargados a mano ni guardados en el servidor.
2. Número y letras del total salen del mismo entero en centavos.
3. Sin plazo de entrega no hay PDF, y la factura proforma exige cliente.
4. Costo mensual cero: sin base de datos, sin IA, sin servicios con clave o pagos.
5. Nunca commitear `.env.local` ni claves; la `ACCESS_KEY` real vive solo en Vercel.
6. No editar a mano archivos generados (`next-env.d.ts`, `.next/`, `package-lock.json`).
7. Nunca marcar una tarea como hecha con un gate en rojo.
