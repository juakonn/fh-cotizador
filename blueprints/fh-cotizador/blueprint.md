# FH Cotizador — Blueprint

> Generado por The Architect el 2026-09-11
> Shape: internal tool · `knowledge/shapes/internal-tool.md`
> Runtime track: TypeScript / Node · `knowledge/runtime-tracks/ts-node.md`
> Emission mode: bundle (14 pasos → `tasks.json` + 2 epics)
> Blueprint version: 1
> Versions last verified: 2026-09-11 — ver §11 para la procedencia de cada paquete

---

## 1. Project Overview & Non-Goals

### Vision

Florencio Hernández (Riaden S.A., San Jacinto y Montevideo) vende tractores y maquinaria agrícola y
cotiza hoy editando ~700 Words viejos (2010–2023) con precios desactualizados, lo que genera errores
como un precio en número distinto del precio en letras. **FH Cotizador** es una app web interna,
usada desde el celular o la PC, que arma una **cotización o factura proforma en PDF** con la hoja
membretada de la empresa, a partir del catálogo que ya está al día en la web de Shopify
(florenciohernandez.com.uy, en USD): se elige uno o varios productos, se cargan (si hace falta) los
datos del cliente, se piden ajustes escritos en castellano simple («agregale la pala», «5% de
descuento», «validez 15 días») y sale el PDF listo para mandar por WhatsApp o mail.

Tres principios mandan sobre cualquier otra decisión: **Shopify es la única fuente de precios,
descripciones y fotos**, **el total en letras sale del mismo número que el total en cifras**, y
**la app cuesta US$ 0 por mes** (sin base de datos, sin IA, sin servicios pagos).

### Users

| Persona | Qué viene a hacer | Frecuencia |
|---|---|---|
| Joaquín y vendedores de FH (1 a 10 personas, San Jacinto y Montevideo) | Armar y mandar una cotización o proforma a un cliente, casi siempre desde el celular | Varias veces por semana |
| Joaquín como administrador | Cargar la etiqueta `iva-incluido` en Shopify, cambiar la clave de acceso, reemplazar el membrete | Ocasional |

### Goals — v1 scope

1. Buscar productos del catálogo de Shopify y armar una cotización con uno o varios productos, cantidad, descuento por producto y descuento general.
2. Elegir el tipo de documento (Cotización o Factura proforma) y cargar el cliente como Empresa (razón social + RUT) o Persona (nombre + cédula), con validación del dígito verificador.
3. Exigir el plazo de entrega en cada documento; validez 30 días por defecto; forma de pago fija «contado o financiado con Mi Maquinaria by Santander».
4. Generar un PDF A4 con el membrete de FH de fondo, **una hoja por producto** con foto, precio y ficha técnica (medidas, peso, equipamiento, tal como están en Shopify), IVA indicado por producto (etiqueta `iva-incluido`) y total en número y en letras.
5. Interpretar frases simples en castellano y aplicarlas con un paso de Deshacer, sin IA.
6. Compartir el PDF desde el celular (WhatsApp, mail) o descargarlo; entrar con un link de acceso que el dispositivo recuerda.

### Non-Goals — explicitly out of scope for v1

| Not building | Why not now | Revisit when |
|---|---|---|
| Historial, numeración o búsqueda de cotizaciones emitidas | Joaquín pidió partir siempre de la base; evita base de datos y costo | Si necesitan reenviar o buscar cotizaciones de meses anteriores |
| Cuentas por persona, roles o registro de quién hizo qué | Un código de equipo alcanza para 1–10 personas de la empresa | Si pasan de 10 usuarios o hace falta auditar |
| IA o frases totalmente libres | Tiene costo por uso y se decidió costo cero | Si más del 20% de los pedidos reales terminan en «No entendí» |
| Precios en pesos o tipo de cambio | La web está en USD y la cotización también | Si los clientes piden cotizaciones en UYU |
| Productos que no están en la web (usados, marcas que ya no se venden) | Shopify es la única fuente | Cuando se carguen en Shopify: aparecen solos |
| Cálculo de cuotas de Mi Maquinaria by Santander | Las condiciones las define el banco | Si Santander entrega una tabla oficial |
| Envío automático por mail o WhatsApp desde el servidor | El botón Compartir del celular ya lo resuelve sin costo | Si piden mandar sin pasar por el celular |
| Editar precios, productos o descripciones desde la app | Se hace en Shopify, un solo lugar | Nunca: es el principio del proyecto |
| Dominio propio, modo oscuro, otros idiomas | Uso interno | Si la app pasa a usarse con clientes |

**The builder must not implement anything in this table**, even if it seems like a small addition
while working on an adjacent step. If a step appears to require a non-goal, that is a blueprint
defect — stop and report it rather than expanding scope.

### Success metrics

| Metric | Target | How measured |
|---|---|---|
| Tiempo para armar y compartir una cotización típica (tractor + implemento) | Menos de 2 minutos desde el celular, en la primera semana de uso | Cronometrar 5 cotizaciones reales |
| Documentos con total en cifras distinto al total en letras | 0 | Por construcción: `tests/unit/dinero.test.ts` y `tests/unit/pdf.test.tsx` |
| Costo mensual | US$ 0 | Vercel Hobby sin cargos; ningún otro servicio |
| Pedidos del intérprete entendidos | 80% o más en las primeras 2 semanas | Anotar cada «No entendí» y sumarlo como caso con la skill `agregar-frase` |

---

## 2. Tech Stack

**Runtime track: TypeScript / Node.** Esta tabla nombra decisiones, no versiones: cada versión está
en §11.

| Layer | Choice | Why this, over what |
|---|---|---|
| Language / runtime | TypeScript 6 sobre Node 24 LTS | Mismo stack que la otra app de FH (FH Historias); TS 7 queda afuera porque Next exige una opción experimental para usarlo |
| Framework | Next.js 16 (App Router) en un solo proyecto | Pantalla y API en un solo deploy gratis en Vercel; se descartó separar un backend porque no hay nada que lo justifique |
| Styling | Tailwind CSS 4 con tokens en `@theme` | Rápido para una sola pantalla mobile-first; la otra app de FH ya lo usa |
| Component layer | Componentes propios, sin librería (ni shadcn) | Son ~8 componentes con nombres accesibles fijos que usan los tests; una librería suma peso sin ahorrar trabajo |
| Database | Ninguna | Sin historial (non-goal): el catálogo se lee de Shopify y el borrador vive en `localStorage` |
| ORM / data access | NOT APPLICABLE — no hay base de datos | — |
| Auth | Código de equipo (`ACCESS_KEY`) + cookie httpOnly con HMAC-SHA256 | Joaquín pidió el acceso más simple posible para 1–10 personas; Clerk o Auth.js exigen cuentas y no aportan nada acá |
| Background work | Ninguno | Todo es pedido-respuesta y termina en segundos |
| PDF | @react-pdf/renderer en el servidor, fotos recomprimidas con sharp | Maqueta con componentes y texto real (buscable); sharp pasa cada foto a JPG de 1000 px para que el PDF quede liviano y por debajo del límite de 4,5 MB de Vercel; probado con el membrete real y fotos de Shopify |
| Validation | zod 4 | Un esquema para la API y para el borrador guardado en el navegador |
| Payments | NOT APPLICABLE — la app no cobra | — |
| File storage | Ninguno | El PDF se genera y se entrega en la respuesta; el membrete y el logo viven en el repo |
| Email / notifications | Ninguno | Compartir del celular (Web Share API) o descarga |
| Hosting | Vercel, plan Hobby (gratis) | Decisión de Joaquín (uso ocasional); cero configuración para Next.js |
| Tests | Vitest (unidad, con `unpdf` para leer el texto del PDF) + Playwright (e2e en Chromium, perfil Pixel 7) | Vitest carga @react-pdf sin problemas; Playwright prueba la pantalla real en tamaño celular |
| Lint / format | Biome | Una sola herramienta, recomendada por el track |
| Package manager | npm | Desvío del track (pnpm): la otra app de FH usa npm y en Windows evita los bloqueos de scripts de instalación de pnpm 11 |

### Compatibility check

Checked against `knowledge/stack-compatibility.md` — de sus filas conocidas, solo aplica
"linter que parsea CSS + estilos CSS-first": resuelto con `"css": { "parser": { "tailwindDirectives": true } }`
en `biome.json` desde el Bootstrap (verificado con Biome 2.5.13 sobre el `globals.css` del proyecto).
Ninguna otra fila aplica: no hay proceso de larga vida, ni estado en memoria compartido, ni base de
datos, ni dos proveedores de identidad. Hallazgos propios de esta combinación, verificados en la
preparación y resueltos en los archivos emitidos:
- `tsx` no puede cargar `@react-pdf/renderer` (su dependencia `@react-pdf/hyphenate` solo exporta ESM);
  ningún script importa `src/lib/pdf/**`.
- Sin `"type": "module"` en `package.json`, Vite avisa si su config está en `.ts`: por eso es
  `vitest.config.mts`.
- react-pdf solo acepta JPG y PNG, y Shopify devuelve PNG de 1,2–2,5 MB cuando la foto tiene
  transparencia aunque se pida JPG (8 de las 13 fotos del fixture): cada foto se recomprime con sharp
  (JPG de 1000 px, ~200 KB) para no pasar el límite de 4,5 MB de respuesta de Vercel.

---

## 3. Directory Structure

```
fh-cotizador/
  .nvmrc                          # workspace — Node 24
  .gitignore                      # workspace — commitea .env.example, ignora .env*
  .env.example                    # workspace — ACCESS_KEY de prueba local
  package.json                    # workspace — scripts y versiones exactas
  package-lock.json               # generado por `npm install` en el Bootstrap
  tsconfig.json                   # workspace — alias @/ → src/, excluye blueprints/
  next.config.ts                  # workspace — paquete externo @react-pdf, assets del PDF, headers
  postcss.config.mjs              # workspace — plugin de Tailwind 4
  biome.json                      # workspace — lint/format, excluye blueprints/ y tests/fixtures/
  vitest.config.mts               # workspace — alias @, ACCESS_KEY de test, solo tests/unit
  playwright.config.ts            # workspace — carga .env.local, levanta la app en :3000
  CLAUDE.md, AGENTS.md            # workspace — instrucciones del proyecto
  README.md                       # paso 14 — uso y deploy para Joaquín
  .claude/
    settings.json                 # workspace — permisos de los comandos de verificación
    rules/pdf.md, interprete.md, catalogo.md, interfaz.md   # workspace
    skills/probar-servidor/, agregar-frase/, cambiar-membrete/   # workspace
  public/icons/icon-192.png, icon-512.png   # workspace — íconos de la app instalable
  scripts/
    probar-servidor.mjs           # workspace — chequeos HTTP contra `next start` en :3100
    revisar-iva.mts               # paso 13 — lista etiquetas iva-incluido
  src/
    proxy.ts                      # paso 2 — exige la cookie de acceso
    app/
      layout.tsx                  # paso 1 (paso 13 agrega appleWebApp)
      globals.css                 # paso 1 — tokens @theme
      page.tsx                    # paso 1 (marcador), paso 10 (pantalla real)
      manifest.ts                 # paso 13
      icon.png, apple-icon.png    # workspace
      acceso/page.tsx             # paso 2
      api/salud/route.ts          # paso 1
      api/acceso/route.ts         # paso 2
      api/pdf/route.ts            # paso 9
    components/cotizador/         # pasos 10–12 — toda la interfaz ("use client")
      Cotizador.tsx, DatosCliente.tsx, BuscadorProductos.tsx, ItemCotizacion.tsx,
      Condiciones.tsx, Interprete.tsx, AjustesDispositivo.tsx, BarraTotal.tsx
    lib/
      acceso.ts                   # paso 2
      config/negocio.ts           # paso 3 — URL Shopify, validez, forma de pago, sucursales
      dinero/formato.ts, letras.ts            # paso 3
      documentos/identificacion.ts            # paso 3 — RUT y cédula
      catalogo/winansi.ts, descripcion.ts, normalizar.ts, shopify.ts   # paso 4
      cotizacion/tipos.ts, calculo.ts, validacion.ts, esquema.ts       # paso 5
      cotizacion/reducer.ts, persistencia.ts  # paso 6
      interprete/texto.ts, buscar.ts, interpretar.ts                   # paso 7
      pdf/fecha.ts, archivo.ts, imagenes.ts, documento.tsx             # paso 8
      pdf/generar.ts              # paso 9
      pdf/assets/membrete-fh-a4.jpg, mi-maquinaria.png                 # workspace
  tests/
    unit/salud.test.ts (1), acceso.test.ts (2), dinero.test.ts (3), catalogo.test.ts (4),
         cotizacion.test.ts (5), reducer.test.ts (6), interprete.test.ts (7),
         pdf.test.tsx (8), api-pdf.test.ts (9)                         # número = paso que lo crea
    e2e/cotizacion.spec.ts        # paso 12
    fixtures/productos-shopify.json, foto.jpg, solicitud-incompleta.json, solicitud-invalida.txt  # workspace
  blueprints/fh-cotizador/        # este paquete — excluido de tsconfig, biome y vitest
```

**Boundary rules**
- `src/components/**` nunca importa `src/lib/pdf/**`, `src/lib/catalogo/shopify.ts` ni `src/lib/acceso.ts`: la pantalla habla con el servidor por `POST /api/pdf` y recibe el catálogo como prop.
- `scripts/**` nunca importa `src/lib/pdf/**` (tsx no carga @react-pdf).
- `src/lib/**` no importa React DOM ni `components`.
- La convención de imports (alias `@/`) está reconciliada contra cada cargador en §19.6.

Cada archivo del árbol tiene un solo origen: **workspace** (llega con la copia del Bootstrap) o el
paso de §9 que lo nombra en su lista de archivos.

---

## 4. Data Model

**No hay base de datos.** Los datos son: el catálogo, leído de Shopify en cada pedido (con caché de
5 minutos), y el borrador de la cotización, que vive en el navegador.

### Entities

**Producto** — una variante de Shopify con precio mayor a 0, normalizada (`src/lib/catalogo/normalizar.ts`).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | number | único | id de la **variante** de Shopify |
| `productoId` | number | | id del producto de Shopify |
| `handle` | string | | slug de la web |
| `titulo` | string | solo caracteres WinAnsi | título (+ " - " + variante si hay más de una) |
| `precioCentavos` | number | entero > 0 | precio de la web × 100 |
| `imagenUrl` | string \| null | | primera foto con `width=1000&format=pjpg` |
| `lineas` | `Linea[]` | ids `L1`… | descripción limpia; cada línea con `importante` (false en secciones de venta: «Ideal para», «Por qué elegirlo», «El respaldo…») |
| `ivaIncluido` | boolean | | tiene la etiqueta `iva-incluido` |
| `sospechaIva` | boolean | | pala frontal, pala cajón o retro sin la etiqueta |
| `esRepuesto` | boolean | | `product_type` empieza con "repuesto" |

**Borrador** — la cotización en armado (`src/lib/cotizacion/tipos.ts`, literal en `epics/01-motor.md`, E1-T5).

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `version` | `1` | literal | cambia si cambia la forma; un borrador viejo se ignora |
| `tipoDocumento` | `"cotizacion" \| "proforma"` | | cambia solo el título y el nombre del archivo |
| `cliente` | `Cliente \| null` | proforma exige no nulo | empresa `{ razonSocial, rut }` o persona `{ nombre, cedula }` |
| `items` | `Item[]` | 0–20 | ver Item |
| `descuentoGeneral` | `Descuento \| null` | porcentaje (0, 100] o monto > 0 | se aplica sobre el subtotal |
| `validezDias` | number | entero 1–365, por defecto 30 | |
| `entrega` | `Entrega \| null` | obligatorio para el PDF | inmediata, días (1–365) o texto (1–80) |
| `notas` | string[] | hasta 10 de hasta 200 caracteres | van al PDF con viñeta |

**Item**

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `productoId` | number | existe en el catálogo | id de variante |
| `cantidad` | number | entero 1–99 | |
| `descuento` | `Descuento \| null` | | del ítem, antes del general |
| `lineasOcultas` | string[] | ids `L*` | líneas de la descripción que no van al PDF; al agregar arranca con las líneas `importante: false` |
| `mostrarFoto` | boolean | por defecto true | |
| `precioVistoCentavos` | number | entero ≥ 0 | precio que vio quien cotiza; si la web cambió, la API responde 409 |

**Emisor** — ajustes del dispositivo: `sucursal` (`"san-jacinto" | "montevideo"`), `vendedorNombre`, `vendedorCelular`.

### Relationships
`Borrador —(1:N)→ Item —(N:1)→ Producto` por `productoId`. Si un producto desaparece de la web, el
cálculo devuelve `PRODUCTO_NO_DISPONIBLE`; nada se borra solo.

### Indexes
NOT APPLICABLE — no hay base de datos; las búsquedas son sobre ~170 productos en memoria.

### Schema
El esquema ejecutable es `src/lib/cotizacion/esquema.ts` (zod), emitido literal en
`epics/01-motor.md`, tarea E1-T5. Valida el cuerpo de `POST /api/pdf` y el borrador leído del navegador.

### Migrations
NOT APPLICABLE — sin base de datos. El borrador guardado lleva `version: 1` y la clave
`fh-cotizador:borrador:v1`: un cambio de forma sube la versión y los borradores viejos se ignoran.

### Seed data
`tests/fixtures/productos-shopify.json` (workspace): 14 productos reales del 2026-09-11, con la
etiqueta `iva-incluido` agregada a las dos «Palas frontales para DF 554». Lo usan todos los tests
unitarios. En desarrollo la app lee la web real.

---

## 5. API Design

### Conventions
- Base path: `/api` (rutas de Next.js). Sin versión: la usa solo esta app.
- Response envelope de error, siempre: `{ "error": { "codigo": string, "mensaje": string, "detalle"?: unknown } }`.
- Validation: zod en `src/lib/cotizacion/esquema.ts`.
- Pagination: NOT APPLICABLE — no hay listados en la API.
- Idempotency: `POST /api/pdf` no tiene efectos secundarios: repetirlo da otro PDF igual.
- Rate limits: ninguno en v1 (4 usuarios internos detrás de la clave); ver §20.2.

| Código | Estado | Cuándo |
|---|---|---|
| `SIN_ACCESO` | 401 | falta la cookie `fh_acceso` o no es válida (lo responde `src/proxy.ts`) |
| `CONFIGURACION` | 500 | falta `ACCESS_KEY` o tiene menos de 12 caracteres |
| `SOLICITUD_INVALIDA` | 400 | el cuerpo no es JSON o no cumple el esquema |
| `BORRADOR_INCOMPLETO` | 422 | faltan productos, plazo de entrega o cliente de la proforma |
| `PRODUCTO_NO_DISPONIBLE` | 409 | un producto ya no está en la web |
| `PRECIO_CAMBIO` | 409 | el precio de la web cambió desde que se armó |
| `SHOPIFY_NO_DISPONIBLE` | 502 | la web no responde |

### Routes

| Method | Path | Description | Auth | Rate limit |
|---|---|---|---|---|
| GET | `/api/salud` | `{ ok: true, app: "fh-cotizador" }` | pública | — |
| GET | `/api/acceso?k=<clave>` | link de acceso: cookie + 303 a `/` (clave mala: 303 a `/acceso?error=1`) | pública | — |
| POST | `/api/acceso` | formulario `clave=<clave>`, mismo comportamiento | pública | — |
| POST | `/api/pdf` | genera el PDF de `{ borrador, emisor }` | cookie | — |
| GET | `/manifest.webmanifest` | manifest de la app instalable | pública | — |
| GET | `/` | pantalla del cotizador | cookie (sin ella: 307 a `/acceso`) | — |
| GET | `/acceso` | formulario de clave | pública | — |

### Critical endpoints — full detail

**`POST /api/pdf`**
- Request: `{ borrador: Borrador, emisor: Emisor }` (esquema en §4).
- Orden de validación: JSON → esquema (400) → `validarParaPdf` (422, sin leer el catálogo) →
  catálogo (502) → productos existentes (409 `PRODUCTO_NO_DISPONIBLE`, `detalle: { productoIds }`) →
  precios iguales a `precioVistoCentavos` (409 `PRECIO_CAMBIO`, `detalle: [{ productoId, titulo,
  antesCentavos, ahoraCentavos }]`) → fotos (una foto que falla no corta nada) → PDF.
- 200: `content-type: application/pdf`, `content-disposition: attachment; filename="<ascii>";
  filename*=UTF-8''<nombre>`, `cache-control: no-store`. Nombre: `Proforma|Cotización - <cliente o
  «Sin cliente»> - <primer producto> - <AAAA-MM-DD>.pdf`.
- Efectos secundarios: ninguno (no se guarda nada).

**`GET /api/acceso`** — compara `k` con `ACCESS_KEY` en tiempo constante; si coincide, cookie
`fh_acceso` = HMAC-SHA256(`ACCESS_KEY`, `"fh-cotizador:acceso:v1"`) en base64url, `httpOnly`,
`sameSite=lax`, `secure` en producción, `path=/`, 400 días.

---

## 6. Frontend Architecture

### Routes
| Route | Page | Data source | Auth |
|---|---|---|---|
| `/` | Cotizador | `obtenerCatalogo()` en el servidor, en cada pedido (caché de fetch de 5 min) | cookie |
| `/acceso` | Formulario de clave | estático | pública |

### Rendering strategy
`/` es `export const dynamic = "force-dynamic"`: el servidor lee el catálogo y lo pasa como prop a
`<Cotizador>` (componente cliente). `/acceso` y `/api/*` son dinámicos. No se usa `cacheComponents`.

### Component hierarchy
```
app/page.tsx (servidor)
└── Cotizador ("use client") — Historial, Emisor, localStorage
    ├── cabecera: título · Deshacer · Nueva cotización · AjustesDispositivo (<dialog>)
    ├── tipo de documento (radios)
    ├── DatosCliente
    ├── BuscadorProductos
    ├── ItemCotizacion × N
    ├── Condiciones (validez, entrega, descuento general, notas, forma de pago)
    ├── Interprete (Pedile algo · Aplicar · role=status · opciones)
    └── BarraTotal (sticky: total, problemas, Generar PDF, Descargar, Compartir)
```

### State management
Todo el estado de la cotización es un `Historial` (`src/lib/cotizacion/reducer.ts`) en `Cotizador`;
cada cambio es `despachar(acciones)` → `conHistorial`, y un pedido del intérprete es un solo paso de
Deshacer. El borrador se guarda en `localStorage` en cada cambio y se carga al montar. El catálogo es
una prop de solo lectura. No hay librería de estado ni de caché de datos.

### Loading, empty, and error states
| Superficie | Cargando | Vacío | Error |
|---|---|---|---|
| Catálogo (`/`) | lo resuelve el servidor antes de responder | — | «No se pudo cargar el catálogo de la web.» + «Reintentar» |
| Búsqueda | — | «No hay productos con esa búsqueda» | — |
| Ítems | — | «Todavía no agregaste productos» | producto que dejó de existir: lo informa la API (409) |
| Generar PDF | botón deshabilitado con «Generando…» | — | mensaje del sobre de error; 409 de precio con «Usar precios nuevos»; 401 con enlace a `/acceso` |
| Intérprete | — | ejemplos de frases | mensaje «No entendí…» en la región de estado |

### Contrato de la interfaz
Nombres accesibles exactos; `tests/e2e/cotizacion.spec.ts` los usa. La tabla completa por componente
está en `epics/02-pdf-e-interfaz.md`, tarea E2-T3. Los que prueba el e2e: searchbox `Buscar producto`,
botones de resultado `<título> · <U$S precio>`, radios `Cotización` / `Factura proforma`, radio
`Entrega inmediata`, textbox `Pedile algo`, botón `Aplicar`, la única región `role="status"`, botón
`Deshacer`, spinbutton `Validez (días)`, botón `Generar PDF`, botón `Descargar` y el texto «La factura
proforma necesita los datos del cliente».

---

## 7. Design System

Sin `ui-ux-pro-max` instalado en esta sesión: la paleta sale del membrete de FH (azul marino y dorado
muestreados del JPG) siguiendo `knowledge/capabilities/styling.md`.

### Colors
| Token | Light | Dark | Usage |
|---|---|---|---|
| `--color-marino` (primary) | `#0c2641` | — (sin modo oscuro en v1) | cabecera, botón principal, títulos |
| `--primary-fg` (texto sobre marino) | `#ffffff` | — | texto de botones principales |
| `--color-fondo` (background) | `#f5f6f8` | — | fondo de página |
| `--color-superficie` (surface) | `#ffffff` | — | tarjetas y campos |
| `--color-borde` (border) | `#d9dee7` | — | bordes y separadores |
| `--color-texto` (fg) | `#14202e` | — | texto |
| `--color-texto-suave` (fg-muted) | `#5b6878` | — | ayudas y leyendas |
| `--color-error` (destructive) | `#b42318` | — | errores y advertencias |
| `--color-ok` (success) | `#1f7a4d` | — | confirmaciones |
| `--color-dorado` (acento) | `#c9a34b` | — | bordes y detalles, nunca texto chico |

**Contrast** (fórmula WCAG): texto `#14202e` sobre fondo `#f5f6f8` ≈ 15,2:1; blanco sobre marino
`#0c2641` ≈ 15,3:1; texto suave `#5b6878` sobre blanco ≈ 5,7:1; error `#b42318` sobre blanco ≈ 6,6:1;
dorado sobre marino ≈ 6,4:1. Todos pasan AA.

### Typography
| Role | Family | Size / line-height | Weight | Tracking |
|---|---|---|---|---|
| Display | pila del sistema (`--font-sans`) | 24px / 1.25 | 700 | normal |
| Heading | pila del sistema | 20px / 1.3 | 600 | normal |
| Body | pila del sistema | 16px / 1.5 | 400 | normal |
| Mono | NOT APPLICABLE — no se muestra código | — | — | — |

**Font loading:** sin fuentes descargadas (pila del sistema: `ui-sans-serif, system-ui, -apple-system,
"Segoe UI", Roboto, Arial, sans-serif`). El PDF usa Helvetica estándar.

### Spacing, radius, elevation
- Spacing: escala de Tailwind (4px): 4, 8, 12, 16, 24, 32.
- Radius: `rounded-lg` (8px) campos y botones; `rounded-xl` (12px) tarjetas.
- Shadows: ninguna; bordes `border-borde`.
- Max content width: `max-w-2xl` (42rem). Breakpoints: mobile-first, sin rediseño para escritorio.

### Motion
Solo `transition-colors` de 150ms en botones; nada animado más. Respeta `prefers-reduced-motion`
(no hay animaciones que desactivar).

### Component style
Utilitario y denso: una columna, tarjetas blancas con borde fino sobre fondo gris claro, cabecera
azul marino como el membrete, botón principal azul marino con texto blanco y 44px de alto. El PDF
lleva el membrete real de fondo, título en azul marino con barra dorada, una hoja por producto (foto y
precio lado a lado, ficha técnica como tabla «etiqueta | valor») y un cierre con resumen, total con borde
dorado y condiciones que nunca se parte entre hojas (maqueta validada con fotos reales; `epics/02-pdf-e-interfaz.md`, E2-T1).

---

## 8. Authentication & Authorization

### Provider and rationale
Código de equipo propio (`src/lib/acceso.ts`): Joaquín pidió el acceso más simple posible, sin
importar si son 1, 4 o 10 personas. No hay cuentas, así que no hay nada que un proveedor aporte.

### Flows
1. Joaquín manda por WhatsApp `https://<app>.vercel.app/api/acceso?k=<ACCESS_KEY>`.
2. La persona lo abre: cookie de 400 días y entra a `/`. Opcional: «Agregar a la pantalla de inicio».
3. Sin cookie, cualquier página lleva a `/acceso` (formulario con la clave, para la PC).
4. Clave incorrecta: vuelve a `/acceso?error=1` con «La clave no es correcta.».
5. Revocar a todos: cambiar `ACCESS_KEY` en Vercel y volver a desplegar; hay que mandar el link nuevo.
6. No hay "salir" ni recuperación de clave: la clave la tiene Joaquín.

### Route protection
| Surface | Rule | Enforced where |
|---|---|---|
| `/` y cualquier página | cookie válida, si no 307 a `/acceso` | `src/proxy.ts` |
| `/api/*` salvo salud y acceso | cookie válida, si no 401 `SIN_ACCESO` | `src/proxy.ts` |
| `/api/salud`, `/api/acceso`, `/acceso`, íconos, manifest | públicos | matcher de `src/proxy.ts` |

**Enforcement rule:** el chequeo es del servidor en cada pedido (proxy). Ocultar un botón no es un permiso.

### Roles and permissions
| Role | Can | Cannot |
|---|---|---|
| Quien tiene el link (equipo de FH) | todo lo de la app | cambiar precios (se hace en Shopify) |

### Sessions
Cookie `fh_acceso`: valor HMAC-SHA256 de la clave (no la clave), `HttpOnly`, `Secure` en producción,
`SameSite=Lax`, `Path=/`, `Max-Age` 400 días. CSRF: `SameSite=Lax` no manda la cookie en POST desde
otros sitios, y `POST /api/pdf` no cambia nada.

### Multi-tenancy / row-level isolation
NOT APPLICABLE — una sola empresa, sin datos guardados en el servidor.

---

## 9. BUILD ORDER

Reglas: cada paso tiene **Do**, **Done when** (EARS), **Verify** (comandos que salen 0 cuando el paso
está bien) y **Checkpoint** (commit + tag `step-NN-slug`). Un paso no está hecho hasta que pasan su
`Verify` y los de los pasos anteriores. No se saltea ningún paso. Si un paso sale mal:
`git reset --hard <tag anterior>` y se reintenta. Los cuerpos literales (archivos y tests) están en
los epics, que son la fuente para escribirlos: `epics/01-motor.md` (pasos 1–7) y
`epics/02-pdf-e-interfaz.md` (pasos 8–14). `tasks.json` tiene los mismos 14 pasos.

Todos los comandos corren desde la raíz del proyecto, con el paquete en `blueprints/fh-cotizador/`.

### Step map

| # | Step | Depends on | Touches | Gate |
|---|---|---|---|---|
| 1 | Base del proyecto y endpoint de salud | Bootstrap | `src/app/layout.tsx`, `globals.css`, `page.tsx`, `api/salud/route.ts`, `tests/unit/salud.test.ts` | `probar-servidor` GET /api/salud 200 |
| 2 | Acceso con link y cookie firmada | 1 | `src/lib/acceso.ts`, `src/proxy.ts`, `api/acceso/route.ts`, `acceso/page.tsx`, test | `probar-servidor` GET / 307 y 200 con cookie |
| 3 | Montos, letras, RUT y cédula | 1 | `config/negocio.ts`, `dinero/*`, `documentos/identificacion.ts`, test | `vitest dinero` |
| 4 | Catálogo de Shopify | 3 | `catalogo/*`, test | `vitest catalogo` |
| 5 | Cálculo, validación y esquema | 4 | `cotizacion/tipos|calculo|validacion|esquema`, test | `vitest cotizacion` |
| 6 | Historial y borrador guardado | 5 | `cotizacion/reducer|persistencia`, test | `vitest reducer` |
| 7 | Intérprete de frases | 6 | `interprete/*`, test | `vitest interprete` |
| 8 | Documento PDF | 5 | `pdf/fecha|archivo|imagenes|documento`, test | `vitest pdf` |
| 9 | Ruta POST /api/pdf | 8, 2 | `pdf/generar.ts`, `api/pdf/route.ts`, test | `probar-servidor` 401/400/422 |
| 10 | Pantalla de armado | 2, 6 | `page.tsx`, `Cotizador`, `DatosCliente`, `BuscadorProductos`, `ItemCotizacion` | `probar-servidor` GET / con «Buscar producto» |
| 11 | Condiciones, intérprete y ajustes | 10, 7 | `Condiciones`, `Interprete`, `AjustesDispositivo`, `Cotizador` | `probar-servidor` GET / con «Pedile algo» |
| 12 | Generar y compartir, con e2e | 11, 9 | `BarraTotal`, `Cotizador`, `tests/e2e/cotizacion.spec.ts` | `npm run test:e2e` |
| 13 | Ícono en el celular y revisión de IVA | 2, 4 | `manifest.ts`, `layout.tsx`, `scripts/revisar-iva.mts` | `probar-servidor` manifest e íconos |
| 14 | README y gate final | 12, 13 | `README.md` | `npm run verificar` + `npm run test:e2e` |

El paso 1 ya ejecuta el servidor armado (regla 13): cualquier desacuerdo entre `package.json`,
`next.config.ts` y el script de chequeo aparece ahí, no al final.

---

#### Step 1 — Base del proyecto y endpoint de salud

**Do**
Crear `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx` (marcador), `src/app/api/salud/route.ts`
y `tests/unit/salud.test.ts` con el contenido literal de `epics/01-motor.md`, tarea E1-T1.

**Done when**
- [ ] WHEN `npm run typecheck` y `npm run lint` corren sobre el proyecto recién copiado THE SYSTEM SHALL terminar con código 0.
- [ ] WHEN el servidor armado recibe GET /api/salud THE SYSTEM SHALL responder 200 con el JSON `{"ok":true,"app":"fh-cotizador"}`.
- [ ] WHEN el servidor armado responde cualquier ruta THE SYSTEM SHALL incluir el header `X-Frame-Options: DENY`.
- [ ] WHEN corre `npx vitest run tests/unit/salud.test.ts` THE SYSTEM SHALL pasar con 0 fallas.

**Verify**
```bash
npm run typecheck                                  # expect: exit 0
npm run lint                                       # expect: exit 0
npx vitest run tests/unit/salud.test.ts            # expect: 1 passed, 0 failed
npm run build                                      # expect: exit 0
node scripts/probar-servidor.mjs "GET /api/salud 200 contiene=fh-cotizador tipo=application/json" "GET /api/salud 200 encabezado='x-frame-options: DENY'"   # expect: 2 líneas OK, exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 1: base del proyecto y endpoint de salud"
git tag step-01-base
```

#### Step 2 — Acceso con link y cookie firmada

**Do**
Crear `src/lib/acceso.ts`, `src/proxy.ts`, `src/app/api/acceso/route.ts`, `src/app/acceso/page.tsx` y
`tests/unit/acceso.test.ts` con el contenido literal de `epics/01-motor.md`, tarea E1-T2. `ACCESS_KEY`
pasa a ser necesaria desde este paso (el Bootstrap ya dejó `.env.local`).

**Done when**
- [ ] WHEN una página se pide sin la cookie `fh_acceso` THE SYSTEM SHALL redirigir con 307 a /acceso.
- [ ] WHEN una ruta /api/ que no es /api/salud ni /api/acceso se pide sin la cookie THE SYSTEM SHALL responder 401 con `{ error: { codigo: "SIN_ACCESO", mensaje: "Abrí el link de acceso para usar la app" } }`.
- [ ] WHEN se abre /api/acceso?k=<ACCESS_KEY> THE SYSTEM SHALL guardar la cookie httpOnly `fh_acceso` por 400 días y redirigir con 303 a /.
- [ ] WHEN la clave del link o del formulario es incorrecta THE SYSTEM SHALL redirigir con 303 a /acceso?error=1 sin guardar cookie.
- [ ] WHEN corre `npx vitest run tests/unit/acceso.test.ts` THE SYSTEM SHALL pasar con 0 fallas.

**Verify**
```bash
npm run typecheck                                  # expect: exit 0
npm run lint                                       # expect: exit 0
npx vitest run tests/unit/acceso.test.ts           # expect: 0 failed
npm run build                                      # expect: exit 0
node scripts/probar-servidor.mjs "GET / 307 destino=/acceso" "GET /acceso 200 contiene='Clave del equipo'" "GET /api/acceso?k=mala 303 destino=/acceso?error=1" "POST /api/pdf 401 contiene=SIN_ACCESO" "GET / 200 acceso" "GET /api/salud 200 contiene=fh-cotizador"   # expect: 6 OK, exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 2: acceso con link y cookie firmada"
git tag step-02-acceso
```

#### Step 3 — Montos, montos en letras, RUT y cédula

**Do**
Crear `src/lib/config/negocio.ts` (literal) y `src/lib/dinero/formato.ts`, `src/lib/dinero/letras.ts`,
`src/lib/documentos/identificacion.ts` según las reglas de `epics/01-motor.md`, tarea E1-T3, más
`tests/unit/dinero.test.ts` (literal).

**Done when**
- [ ] WHEN se formatean 1790000 centavos THE SYSTEM SHALL devolver `U$S 17.900`, y para 247050 centavos `U$S 2.470,50`.
- [ ] WHEN se pasan a letras 2483500 centavos THE SYSTEM SHALL devolver `Dólares americanos veinticuatro mil ochocientos treinta y cinco`.
- [ ] WHEN se pasa a letras el número 21000 THE SYSTEM SHALL devolver `veintiún mil`, y para 1000000 `un millón`.
- [ ] WHEN se valida el RUT 212983680015 THE SYSTEM SHALL darlo por válido, y el 211234560018 por inválido con el motivo `El dígito verificador del RUT no coincide`.
- [ ] WHEN se valida la cédula 1.234.567-2 THE SYSTEM SHALL darla por válida con normalizado `12345672`, y la 1.234.567-3 por inválida.
- [ ] WHEN corre `npx vitest run tests/unit/dinero.test.ts` THE SYSTEM SHALL pasar con 0 fallas.

**Verify**
```bash
npm run typecheck                                  # expect: exit 0
npm run lint                                       # expect: exit 0
npx vitest run tests/unit/dinero.test.ts           # expect: 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 3: montos, montos en letras, RUT y cédula"
git tag step-03-dinero
```

#### Step 4 — Lectura y limpieza del catálogo de Shopify

**Do**
Crear `src/lib/catalogo/winansi.ts`, `descripcion.ts`, `normalizar.ts` y `shopify.ts` según
`epics/01-motor.md`, tarea E1-T4, más `tests/unit/catalogo.test.ts` (literal). Los tests usan el
fixture, no la web.

**Done when**
- [ ] WHEN se normaliza `tests/fixtures/productos-shopify.json` THE SYSTEM SHALL excluir los productos con precio 0 y usar el id de variante con el precio en centavos (Farmtrac FT 6050 → id 50605744423200 y 1790000).
- [ ] WHEN un producto tiene la etiqueta `iva-incluido` THE SYSTEM SHALL marcarlo con `ivaIncluido: true` y `sospechaIva: false`, y WHEN una pala frontal, pala cajón, retroexcavadora o chipeadora no la tiene THE SYSTEM SHALL marcarla con `sospechaIva: true`.
- [ ] WHEN se limpia una descripción THE SYSTEM SHALL devolver líneas con ids L1…Ln, solo caracteres WinAnsi y sin menciones a WhatsApp, financiación, Santander, cuotas, precalificación ni precios escritos a mano («CONTADO U$S 2610»).
- [ ] WHEN una descripción tiene las secciones «Ideal para», «Ficha técnica» y «El respaldo Florencio Hernández» THE SYSTEM SHALL marcar con `importante: false` los títulos y líneas de «Ideal para» y «El respaldo Florencio Hernández», y con `importante: true` los de «Ficha técnica».
- [ ] WHEN la primera página de Shopify trae 250 productos THE SYSTEM SHALL pedir la página 2 y juntar las dos.
- [ ] WHEN Shopify responde un estado de error THE SYSTEM SHALL fallar con `ErrorCatalogo` de código `SHOPIFY_NO_DISPONIBLE`.

**Verify**
```bash
npm run typecheck                                  # expect: exit 0
npm run lint                                       # expect: exit 0
npx vitest run tests/unit/catalogo.test.ts         # expect: 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 4: lectura y limpieza del catálogo de Shopify"
git tag step-04-catalogo
```

#### Step 5 — Motor de cálculo, validación y esquema

**Do**
Crear `src/lib/cotizacion/tipos.ts` y `esquema.ts` (literales), `calculo.ts` y `validacion.ts` según
`epics/01-motor.md`, tarea E1-T5, más `tests/unit/cotizacion.test.ts` (literal).

**Done when**
- [ ] WHEN la cotización tiene el Farmtrac FT 6050 (U$S 17.900) y las Palas frontales para DF 554 (U$S 7.300) THE SYSTEM SHALL calcular subtotal y total de 2520000 centavos con IVA `mixto`.
- [ ] WHEN la pala tiene 5% de descuento y hay un descuento general de U$S 500 THE SYSTEM SHALL calcular el neto de la pala en 693500, el subtotal en 2483500 y el total en 2433500 centavos.
- [ ] WHEN un producto de la cotización ya no está en el catálogo THE SYSTEM SHALL devolver `PRODUCTO_NO_DISPONIBLE` con su id.
- [ ] WHEN el borrador está vacío THE SYSTEM SHALL pedir productos y plazo de entrega, y WHEN es factura proforma sin cliente THE SYSTEM SHALL pedir los datos del cliente.
- [ ] WHEN el RUT del cliente es inválido o un producto tiene `sospechaIva` THE SYSTEM SHALL devolver una advertencia sin sumar problemas que bloqueen el PDF.
- [ ] WHEN la solicitud trae cantidad 0 o un porcentaje de descuento mayor a 100 THE SYSTEM SHALL rechazarla con `esquemaSolicitudPdf`.

**Verify**
```bash
npm run typecheck                                  # expect: exit 0
npm run lint                                       # expect: exit 0
npx vitest run tests/unit/cotizacion.test.ts       # expect: 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 5: motor de cálculo, validación y esquema"
git tag step-05-calculo
```

#### Step 6 — Historial con Deshacer y borrador guardado

**Do**
Crear `src/lib/cotizacion/reducer.ts` (con el tipo `Accion` literal) y `persistencia.ts` según
`epics/01-motor.md`, tarea E1-T6, más `tests/unit/reducer.test.ts` (literal).

**Done when**
- [ ] WHEN se agrega dos veces el mismo producto THE SYSTEM SHALL dejar un solo ítem con cantidad 2 y el precio visto de la web.
- [ ] WHEN se pide cantidad 500 o validez 0 THE SYSTEM SHALL acotarlas a 99 y a 1.
- [ ] WHEN se aplican varias acciones juntas y después Deshacer THE SYSTEM SHALL volver al estado anterior a todas ellas en un solo paso.
- [ ] WHEN se hicieron 40 cambios THE SYSTEM SHALL guardar como máximo 30 pasos de Deshacer.
- [ ] WHEN el borrador guardado en el navegador está corrupto o es de otra versión THE SYSTEM SHALL ignorarlo y devolver `null`.
- [ ] WHEN se agrega el Farmtrac FT 6050 THE SYSTEM SHALL dejar ocultas de entrada las líneas de sus secciones de venta (L2 a L10, L26 y L27) y visible su ficha técnica.

**Verify**
```bash
npm run typecheck                                  # expect: exit 0
npm run lint                                       # expect: exit 0
npx vitest run tests/unit/reducer.test.ts          # expect: 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 6: historial con Deshacer y borrador guardado"
git tag step-06-historial
```

#### Step 7 — Intérprete de frases en lenguaje simple

**Do**
Crear `src/lib/interprete/texto.ts`, `buscar.ts` e `interpretar.ts` según las reglas de
`epics/01-motor.md`, tarea E1-T7, más `tests/unit/interprete.test.ts` (literal).

**Done when**
- [ ] WHEN se escribe «agregale la pala» con un Dong Feng DF 554 G3 en la cotización THE SYSTEM SHALL agregar las Palas frontales para DF 554 y resumir «Agregué Palas frontales para DF 554 (U$S 7.300)».
- [ ] WHEN se escribe «agregá la pala» sin tractor en la cotización THE SYSTEM SHALL preguntar «¿Cuál querés agregar?» con las 6 palas del catálogo de prueba como opciones.
- [ ] WHEN se escribe «dejalo en 23.000» con un subtotal de U$S 24.600 THE SYSTEM SHALL poner un descuento general de 160000 centavos.
- [ ] WHEN se escribe «cliente Agro Ejemplo S.A. rut 211234560019» THE SYSTEM SHALL cargar un cliente empresa con esa razón social y ese RUT.
- [ ] WHEN una parte de la frase no se entiende THE SYSTEM SHALL devolver `no-entendi` sin aplicar ninguna acción.
- [ ] WHEN corre `npx vitest run tests/unit/interprete.test.ts` THE SYSTEM SHALL pasar con 0 fallas.

**Verify**
```bash
npm run typecheck                                  # expect: exit 0
npm run lint                                       # expect: exit 0
npx vitest run tests/unit/interprete.test.ts       # expect: 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 7: intérprete de frases en lenguaje simple"
git tag step-07-interprete
```

#### Step 8 — Documento PDF con membrete de fondo

**Do**
Crear `src/lib/pdf/documento.tsx` (literal), `fecha.ts`, `archivo.ts` e `imagenes.ts` según
`epics/02-pdf-e-interfaz.md`, tarea E2-T1, más `tests/unit/pdf.test.tsx` (literal).

**Done when**
- [ ] WHEN se genera la proforma de prueba (Farmtrac FT 6050 más Palas frontales para DF 554 con 5%) THE SYSTEM SHALL producir un PDF de menos de 2,5 MB cuyo texto contiene «FACTURA PROFORMA», «TOTAL: U$S 24.835» y «(Dólares americanos veinticuatro mil ochocientos treinta y cinco)».
- [ ] WHEN la proforma de prueba tiene 2 productos THE SYSTEM SHALL producir 2 hojas: la primera con el Farmtrac FT 6050, su precio y su ficha técnica hasta «Barra antivuelco plegable», sin las Palas frontales para DF 554 ni «TOTAL:»; la segunda con las Palas frontales para DF 554, «TOTAL: U$S 24.835» y la forma de pago.
- [ ] WHEN un ítem tiene líneas de descripción ocultas (L1 y las secciones de venta del Farmtrac) THE SYSTEM SHALL dejar ese texto fuera del PDF («Por qué elegirlo» no aparece) y mostrar la ficha técnica («Tanque de combustible 60 litros»).
- [ ] WHEN el documento es una cotización sin cliente THE SYSTEM SHALL titularlo «COTIZACIÓN» y no escribir «Cliente:», y WHEN el vendedor es Joaquín con otro celular guardado THE SYSTEM SHALL escribir «Atendido por: Joaquín · Cel. 092 469 449».
- [ ] WHEN la fecha es 2026-09-11T02:30:00Z THE SYSTEM SHALL escribir «10 de setiembre de 2026» (hora de Montevideo), y WHEN se arma el nombre del archivo de la proforma de prueba THE SYSTEM SHALL devolver «Proforma - Agro Ejemplo S.A. - Farmtrac FT 6050 - 50HP - 4x4 - 2026-09-11.pdf».
- [ ] WHEN una foto llega como PNG pesado con transparencia THE SYSTEM SHALL convertirla en un JPG de menos de 400 KB, y un PDF con 3 fotos así THE SYSTEM SHALL dejarlo por debajo de 4 MB (Vercel corta respuestas de más de 4,5 MB).

**Verify**
```bash
npm run typecheck                                  # expect: exit 0
npm run lint                                       # expect: exit 0
npx vitest run tests/unit/pdf.test.tsx             # expect: 0 failed
```

**Checkpoint**
```bash
git add -A && git commit -m "step 8: documento PDF con membrete de fondo"
git tag step-08-pdf
```

#### Step 9 — Ruta POST /api/pdf

**Do**
Crear `src/lib/pdf/generar.ts` y `src/app/api/pdf/route.ts` según `epics/02-pdf-e-interfaz.md`, tarea
E2-T2, más `tests/unit/api-pdf.test.ts` (literal).

**Done when**
- [ ] WHEN `generarPdf` recibe una solicitud válida THE SYSTEM SHALL devolver el PDF y el nombre «Cotización - Sin cliente - Farmtrac FT 6050 - 50HP - 4x4 - 2026-09-11.pdf».
- [ ] WHEN el cuerpo no es JSON o no cumple el esquema THE SYSTEM SHALL responder 400 con `{ error: { codigo: "SOLICITUD_INVALIDA" } }`.
- [ ] WHEN falta el plazo de entrega THE SYSTEM SHALL responder 422 `BORRADOR_INCOMPLETO` sin leer el catálogo.
- [ ] WHEN el precio de la web cambió desde que se armó la cotización THE SYSTEM SHALL responder 409 `PRECIO_CAMBIO` con el precio anterior y el nuevo en centavos.
- [ ] WHEN Shopify no responde THE SYSTEM SHALL responder 502 `SHOPIFY_NO_DISPONIBLE`.
- [ ] WHEN corre `npm run build` THE SYSTEM SHALL incluir `membrete-fh-a4.jpg` en el trazado de archivos de la función /api/pdf.

**Verify**
```bash
npm run typecheck                                  # expect: exit 0
npm run lint                                       # expect: exit 0
npx vitest run tests/unit/api-pdf.test.ts          # expect: 0 failed
npm run build                                      # expect: exit 0
grep -q membrete-fh-a4.jpg .next/server/app/api/pdf/route.js.nft.json   # expect: exit 0 — archivo que genera `npm run build` (nombre verificado con Next 16.3.4 el 2026-09-11)
node scripts/probar-servidor.mjs "POST /api/pdf 401 contiene=SIN_ACCESO" "POST /api/pdf 400 acceso cuerpo=tests/fixtures/solicitud-invalida.txt contiene=SOLICITUD_INVALIDA" "POST /api/pdf 422 acceso cuerpo=tests/fixtures/solicitud-incompleta.json contiene=BORRADOR_INCOMPLETO"   # expect: 3 OK, exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 9: ruta POST /api/pdf"
git tag step-09-api-pdf
```

#### Step 10 — Pantalla de armado: cliente, buscador e ítems

**Do**
Reemplazar `src/app/page.tsx` y crear `src/components/cotizador/Cotizador.tsx`, `DatosCliente.tsx`,
`BuscadorProductos.tsx` e `ItemCotizacion.tsx` según `epics/02-pdf-e-interfaz.md`, tarea E2-T3 (incluye
la tabla "Contrato de la interfaz").

**Done when**
- [ ] WHEN el servidor armado recibe GET / con la cookie de acceso THE SYSTEM SHALL responder 200 con el campo «Buscar producto» y títulos del catálogo de la web en el HTML (por ejemplo «Farmtrac»).
- [ ] WHEN corren `npm run typecheck` y `npm run lint` con los componentes nuevos THE SYSTEM SHALL terminar con código 0.
- [ ] WHEN corre `npm test` THE SYSTEM SHALL pasar todos los tests unitarios con 0 fallas.

**Verify**
```bash
npm run typecheck                                  # expect: exit 0
npm run lint                                       # expect: exit 0
npm test                                           # expect: 0 failed
npm run build                                      # expect: exit 0
node scripts/probar-servidor.mjs "GET / 200 acceso contiene='Buscar producto'" "GET / 200 acceso contiene=Farmtrac"   # expect: 2 OK (necesita internet)
```

**Checkpoint**
```bash
git add -A && git commit -m "step 10: pantalla de armado: cliente, buscador e ítems"
git tag step-10-armado
```

#### Step 11 — Condiciones, intérprete y ajustes del dispositivo

**Do**
Crear `src/components/cotizador/Condiciones.tsx`, `Interprete.tsx`, `AjustesDispositivo.tsx` y
montarlos en `Cotizador.tsx`, según `epics/02-pdf-e-interfaz.md`, tarea E2-T4.

**Done when**
- [ ] WHEN el servidor armado recibe GET / con la cookie de acceso THE SYSTEM SHALL incluir en el HTML el cuadro «Pedile algo», la opción «Entrega inmediata» y el botón «Ajustes del dispositivo».
- [ ] WHEN corren `npm run typecheck`, `npm run lint` y `npm test` THE SYSTEM SHALL terminar con código 0.

**Verify**
```bash
npm run typecheck                                  # expect: exit 0
npm run lint                                       # expect: exit 0
npm test                                           # expect: 0 failed
npm run build                                      # expect: exit 0
node scripts/probar-servidor.mjs "GET / 200 acceso contiene='Pedile algo'" "GET / 200 acceso contiene='Entrega inmediata'" "GET / 200 acceso contiene='Ajustes del dispositivo'"   # expect: 3 OK
```

**Checkpoint**
```bash
git add -A && git commit -m "step 11: condiciones, intérprete y ajustes del dispositivo"
git tag step-11-condiciones
```

#### Step 12 — Generar, compartir y descargar el PDF, con e2e

**Do**
Crear `src/components/cotizador/BarraTotal.tsx`, montarlo en `Cotizador.tsx` y crear
`tests/e2e/cotizacion.spec.ts` (literal), según `epics/02-pdf-e-interfaz.md`, tarea E2-T5.

**Done when**
- [ ] WHEN se busca «farmtrac 6050», se agrega, se elige «Entrega inmediata», se escribe «5% de descuento» en «Pedile algo» y se toca «Aplicar» THE SYSTEM SHALL mostrar «Descuento general 5%» en la zona de estado.
- [ ] WHEN después se toca «Generar PDF» THE SYSTEM SHALL recibir de /api/pdf un 200 `application/pdf` y mostrar el botón «Descargar».
- [ ] WHEN es factura proforma sin cliente THE SYSTEM SHALL mostrar «La factura proforma necesita los datos del cliente» y dejar deshabilitado «Generar PDF».
- [ ] WHEN se escribe «validez 15 días», se aplica y después se toca «Deshacer» THE SYSTEM SHALL volver a mostrar 30 en «Validez (días)».

**Verify**
```bash
npm run typecheck                                  # expect: exit 0
npm run lint                                       # expect: exit 0
npm run test:e2e                                   # expect: 0 failed (arma la app y usa la web real)
```

**Checkpoint**
```bash
git add -A && git commit -m "step 12: generar, compartir y descargar el PDF, con e2e"
git tag step-12-generar
```

#### Step 13 — Ícono en el celular y revisión de etiquetas de IVA

**Do**
Crear `src/app/manifest.ts` y `scripts/revisar-iva.mts` (literales) y agregar `appleWebApp` a la
metadata de `src/app/layout.tsx`, según `epics/02-pdf-e-interfaz.md`, tarea E2-T6.

**Done when**
- [ ] WHEN se pide /manifest.webmanifest sin cookie THE SYSTEM SHALL responder 200 con el nombre «FH Cotizador», `display: standalone` e íconos de 192 y 512 px.
- [ ] WHEN se piden /icons/icon-192.png y /icon.png sin cookie THE SYSTEM SHALL responder 200 con `image/png`.
- [ ] WHEN corre `npm run iva:revisar -- --fixture tests/fixtures/productos-shopify.json` THE SYSTEM SHALL listar «Retroexcavadora LW-6» entre los productos que parecen llevar IVA sin la etiqueta.

**Verify**
```bash
npm run typecheck                                  # expect: exit 0
npm run lint                                       # expect: exit 0
npm run build                                      # expect: exit 0
node scripts/probar-servidor.mjs "GET /manifest.webmanifest 200 contiene='FH Cotizador'" "GET /manifest.webmanifest 200 contiene=standalone" "GET /icons/icon-192.png 200 tipo=image/png" "GET /icon.png 200 tipo=image/png"   # expect: 4 OK
npm run iva:revisar -- --fixture tests/fixtures/productos-shopify.json | grep -q "Retroexcavadora LW-6"   # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 13: ícono en el celular y revisión de etiquetas de IVA"
git tag step-13-app-celular
```

#### Step 14 — README de uso y deploy, y gate final

**Do**
Escribir `README.md` con las 7 secciones de `epics/02-pdf-e-interfaz.md`, tarea E2-T7, y correr el
gate completo.

**Done when**
- [ ] WHEN corre `npm run verificar` THE SYSTEM SHALL terminar con código 0 (tipos, lint, tests unitarios y build).
- [ ] WHEN corre `npm run test:e2e` THE SYSTEM SHALL pasar todos los recorridos con 0 fallas.
- [ ] WHEN se lee README.md THE SYSTEM SHALL encontrar las secciones de deploy en Vercel, la variable `ACCESS_KEY`, el link de acceso y la etiqueta `iva-incluido`.

**Verify**
```bash
npm run verificar                                  # expect: exit 0
npm run test:e2e                                   # expect: 0 failed
grep -q "ACCESS_KEY" README.md                     # expect: exit 0
grep -q "iva-incluido" README.md                   # expect: exit 0
grep -q "/api/acceso?k=" README.md                 # expect: exit 0
grep -q "Vercel" README.md                         # expect: exit 0
node scripts/probar-servidor.mjs "GET /api/salud 200 contiene=fh-cotizador" "GET / 307 destino=/acceso" "GET / 200 acceso contiene='Buscar producto'" "POST /api/pdf 422 acceso cuerpo=tests/fixtures/solicitud-incompleta.json contiene=BORRADOR_INCOMPLETO" "GET /manifest.webmanifest 200 contiene='FH Cotizador'"   # expect: 5 OK
```

**Checkpoint**
```bash
git add -A && git commit -m "step 14: README de uso y deploy, y gate final"
git tag step-14-entrega
```

---

### 9.1 Parity and cutover

NOT APPLICABLE — greenfield build, no system is being replaced. (Las cotizaciones en Word siguen
existiendo como archivo; no hay datos que migrar ni un sistema que apagar.)

---

## 10. Environment Setup

### Prerequisites
| Tool | Version | Check |
|---|---|---|
| Node.js | 24 LTS (`.nvmrc`; npm viene con Node) | `node -v` |
| git | 2.28 o más (por `git init -b main`) | `git --version` |
| Internet | necesaria para `npm install`, el navegador de Playwright, los pasos 10–14 y los e2e | — |

### Accounts to create first
Ninguna para construir. Para publicar (después del paso 14, ver §12): una cuenta gratuita de GitHub
(https://github.com/signup) y una de Vercel en el plan Hobby (https://vercel.com/signup). Shopify no
necesita clave: se lee el catálogo público.

### Environment variables
| Variable | Purpose | Where to get it | Required by step | Secret? |
|---|---|---|---|---|
| `ACCESS_KEY` | código de equipo para entrar; firma la cookie | local: `.env.local`, copiado de `.env.example` con el valor de prueba `clave-local-1234567890`; producción: una clave larga inventada por Joaquín, cargada en Vercel → Settings → Environment Variables | 2 (antes es opcional: la base no la lee) | sí en producción |
| `NODE_ENV` | la pone Next.js sola (`production` en `next start`, en `npm run build` y en Vercel); activa `Secure` en la cookie de acceso | no se configura | — (automática) | no |

La app no lee `ACCESS_KEY` al arrancar sino al primer pedido protegido, así que el paso 1 funciona
sin ella. Quién la carga: Next.js lee `.env.local` solo; `scripts/probar-servidor.mjs` y
`playwright.config.ts` la leen de `.env.local` por su cuenta; Vitest la recibe de
`vitest.config.mts` (`clave-de-test-1234567890`).

### Files that must be committed

| File | Why it is committed | Ignore-file exception line |
|---|---|---|
| `.env.example` | documenta la única variable y el valor local de prueba | `!.env.example` después de `.env*` (ya está en el `.gitignore` emitido) |
| `package-lock.json` | instalaciones reproducibles | — no lo alcanza ningún patrón |
| `.claude/`, `CLAUDE.md`, `AGENTS.md` | configuración del agente | — no los alcanza ningún patrón |
| `tests/fixtures/*` | datos de los tests | — no los alcanza ningún patrón |
| `src/lib/pdf/assets/*` | membrete y logo que usa el PDF en producción | — no los alcanza ningún patrón |
| `blueprints/fh-cotizador/` | plan y estado de la construcción (`tasks.json`) | — no lo alcanza ningún patrón |

### Bootstrap
```bash
# orden: copiar workspace (trae .gitignore y sus excepciones) → .env.local → repo git → primer commit → instalar → navegador e2e
node -e "require('node:fs').cpSync('blueprints/fh-cotizador/workspace', '.', { recursive: true, force: false, errorOnExist: false })"   # no pisa archivos que ya existen (package.json incluido) y sale 0 igual
node -e "const fs = require('node:fs'); if (!fs.existsSync('.env.local')) fs.copyFileSync('.env.example', '.env.local')"
git rev-parse --git-dir >/dev/null 2>&1 || git init -b main                  # no hace nada si ya hay repo
git config user.email >/dev/null || git config user.email "constructor@fh-cotizador.local"
git config user.name >/dev/null || git config user.name "Constructor FH Cotizador"
git add -A && git commit -q -m "chore: scaffold" --allow-empty               # el .gitignore ya está: .env.local y node_modules no entran
npm install --no-audit --no-fund
npx playwright install chromium
```
Se corre desde la raíz del proyecto, con este paquete en `blueprints/fh-cotizador/`. Es seguro
correrlo dos veces: la copia no pisa nada, `.env.local` no se reemplaza, el repo no se reinicia y el
commit vacío sale 0. No hace falta ningún scaffolder: `package.json` y todas las configuraciones
llegan con la copia.

---

## 11. Dependencies

Versiones verificadas en esta sesión contra el registro de npm (`npm view <paquete> version`) el
2026-09-11; la preparación instaló exactamente estas versiones y corrió tipos, lint, todos los tests unitarios, build
y chequeos HTTP sobre ellas. Todas se instalan con `npm install` del Bootstrap, desde el
`package.json` emitido (versiones exactas, sin `^`).

### Runtime
| Package | Version | Source (registry URL or track file) | Checked | Installed by | Purpose |
|---|---|---|---|---|---|
| `next` | 16.3.4 | https://registry.npmjs.org/next | 2026-09-11 | §10 Bootstrap | framework (pantalla + API) |
| `react` | 19.3.0 | https://registry.npmjs.org/react | 2026-09-11 | §10 Bootstrap | UI |
| `react-dom` | 19.3.0 | https://registry.npmjs.org/react-dom | 2026-09-11 | §10 Bootstrap | UI |
| `@react-pdf/renderer` | 4.9.0 | https://registry.npmjs.org/@react-pdf/renderer | 2026-09-11 | §10 Bootstrap | PDF en el servidor (peer react ^16.8–^19) |
| `zod` | 4.6.2 | https://registry.npmjs.org/zod | 2026-09-11 | §10 Bootstrap | validación |
| `sharp` | 0.35.4 | https://registry.npmjs.org/sharp | 2026-09-11 | §10 Bootstrap | recomprimir las fotos del PDF (la misma versión que `next@16.3.4` declara como dependencia opcional) |

### Development
| Package | Version | Source (registry URL or track file) | Checked | Installed by | Purpose |
|---|---|---|---|---|---|
| `typescript` | 6.0.3 | https://registry.npmjs.org/typescript | 2026-09-11 | §10 Bootstrap | tipos (7.0.2 es `latest` pero Next lo rechaza sin opción experimental) |
| `@types/node` | 24.13.4 | https://registry.npmjs.org/@types/node | 2026-09-11 | §10 Bootstrap | tipos de Node 24 (el tag `latest` apunta a 22.x) |
| `@types/react` | 19.3.0 | https://registry.npmjs.org/@types/react | 2026-09-11 | §10 Bootstrap | tipos |
| `@types/react-dom` | 19.3.0 | https://registry.npmjs.org/@types/react-dom | 2026-09-11 | §10 Bootstrap | tipos |
| `tailwindcss` | 4.3.3 | https://registry.npmjs.org/tailwindcss | 2026-09-11 | §10 Bootstrap | estilos |
| `@tailwindcss/postcss` | 4.3.3 | https://registry.npmjs.org/@tailwindcss/postcss | 2026-09-11 | §10 Bootstrap | Tailwind en Next |
| `@biomejs/biome` | 2.5.13 | https://registry.npmjs.org/@biomejs/biome | 2026-09-11 | §10 Bootstrap | lint y formato |
| `vitest` | 4.1.11 | https://registry.npmjs.org/vitest | 2026-09-11 | §10 Bootstrap | tests (5.0.0 salió el 2026-09-03: se queda en la línea 4 estable) |
| `unpdf` | 1.8.1 | https://registry.npmjs.org/unpdf | 2026-09-11 | §10 Bootstrap | leer el texto de los PDF en los tests |
| `@playwright/test` | 1.63.0 | https://registry.npmjs.org/@playwright/test | 2026-09-11 | §10 Bootstrap (+ `npx playwright install chromium`) | e2e |
| `tsx` | 4.23.13 | https://registry.npmjs.org/tsx | 2026-09-11 | §10 Bootstrap | correr `scripts/revisar-iva.mts` |

### Deliberately not used
| Rejected | Instead | Why |
|---|---|---|
| `@anthropic-ai/sdk` / cualquier IA | intérprete propio (`src/lib/interprete`) | costo por uso; decisión de costo cero |
| Base de datos, ORM (Drizzle, Prisma) | Shopify + `localStorage` | sin historial (non-goal) |
| Clerk, Auth.js, Better Auth | código de equipo + cookie HMAC | no hay cuentas |
| shadcn / librerías de componentes | componentes propios | pocas pantallas, nombres accesibles fijos |
| Puppeteer / Chromium en el servidor para el PDF | @react-pdf/renderer | no entra cómodo en una función gratis de Vercel |
| Librerías de "número a letras" | `src/lib/dinero/letras.ts` con tests | control total del castellano de Uruguay |
| pnpm | npm | la otra app de FH usa npm; menos fricción en Windows |
| TypeScript 7 | TypeScript 6.0.3 | Next 16 lo rechaza sin opción experimental |

---

## 12. Deployment Strategy

### Hosting
Vercel, plan **Hobby (gratis)**, región por defecto. Framework preset Next.js sin cambios: build
`npm run build`, instalación `npm install`, salida `.next`, Node 24. La función `/api/pdf` corre en
Node (`runtime = "nodejs"`) e incluye `src/lib/pdf/assets/**` por `outputFileTracingIncludes`.

### Environments
| Environment | Branch | URL | Database | Third-party mode |
|---|---|---|---|---|
| Local | — | http://localhost:3000 | ninguna | Shopify real (solo lectura) |
| Preview | cualquier rama que se suba | automática de Vercel | ninguna | Shopify real (solo lectura) |
| Production | `main` | `https://<proyecto>.vercel.app` | ninguna | Shopify real (solo lectura) |

### CI/CD
Sin pipeline aparte en v1: Vercel construye en cada `git push` y el gate se corre local antes de
subir (`npm run verificar && npm run test:e2e`). El builder no sube ni despliega (`git push` y
`vercel` están denegados en `.claude/settings.json`): publicar es un paso manual de Joaquín.

### Release and rollback
Cada push a `main` publica. Para volver atrás: Vercel → Deployments → la versión anterior →
«Promote to Production» (menos de un minuto). No hay migraciones.

### Domain, DNS, TLS
Subdominio `*.vercel.app` con TLS automático. Dominio propio: non-goal.

### Post-build launch checklist (manual, fuera del build)
1. Crear un repositorio privado en GitHub y subir el proyecto.
2. Vercel → Add New → Project → importar el repositorio (plan Hobby).
3. Settings → Environment Variables → `ACCESS_KEY` = una clave larga (12 caracteres o más) → Deploy.
4. Abrir `https://<proyecto>.vercel.app/api/acceso?k=<clave>` en cada celular y agregar a la pantalla de inicio.
5. En Shopify, agregar la etiqueta `iva-incluido` a los productos que llevan IVA (la lista la manda Joaquín); `npm run iva:revisar` muestra los que faltan.

---

## 13. Testing Strategy

| Layer | Framework | What it covers | Where | Runs |
|---|---|---|---|---|
| Unit | Vitest | montos y letras, RUT/cédula, catálogo, cálculo, validación, historial, intérprete, PDF (texto extraído con unpdf), `generarPdf`, rutas de acceso y salud | `tests/unit/` | cada paso y `npm run verificar` |
| Integration | Vitest + `scripts/probar-servidor.mjs` | el servidor armado real: proxy, cookies, estados, headers, trazado de archivos | `scripts/probar-servidor.mjs` | pasos 1, 2, 9–11, 13, 14 |
| E2E | Playwright (Chromium, Pixel 7) | los 3 recorridos de abajo con el catálogo real | `tests/e2e/` | pasos 12 y 14 |

### Critical flows to cover E2E
1. Buscar un producto, agregarlo, elegir la entrega, pedir «5% de descuento» y generar el PDF (200 `application/pdf`).
2. Factura proforma sin cliente: el PDF no se puede generar y se explica por qué.
3. Deshacer un pedido del intérprete.

### Test data
`tests/fixtures/productos-shopify.json` (14 productos reales del 2026-09-11) y `tests/fixtures/foto.jpg`,
emitidos en `workspace/`. Los tests unitarios nunca usan la red ni comparten estado. Los e2e usan la
web real (cada test abre un contexto de navegador nuevo, sin `localStorage` previo).

### What is deliberately not tested
- El aspecto visual del PDF por píxel: se validó a ojo con fotos reales en la preparación; los tests
  verifican el texto.
- `navigator.share` (depende del celular): se prueba a mano en el lanzamiento.
- Accesibilidad automática con axe: fuera de v1 (decisión 10 de §20.3); los e2e buscan todo por rol y nombre.

---

## 14. Security & Secrets

| Concern | Control | Implemented in |
|---|---|---|
| Secret storage | `ACCESS_KEY` solo en Vercel (producción) y `.env.local` (local, ignorado por git) | Vercel, `.gitignore` |
| Secret rotation | cambiar `ACCESS_KEY` en Vercel y redeployar; invalida todas las cookies | README |
| Input validation | zod en el cuerpo de `/api/pdf`; `validarParaPdf` | `src/lib/cotizacion/esquema.ts` |
| Output encoding / XSS | React escapa todo; no se usa `dangerouslySetInnerHTML`; el HTML de Shopify se convierte a texto | `src/lib/catalogo/descripcion.ts` |
| SQL injection | NOT APPLICABLE — no hay base de datos | — |
| AuthN / AuthZ | cookie HMAC verificada en cada pedido | `src/proxy.ts`, `src/lib/acceso.ts` |
| CSRF | `SameSite=Lax`; `/api/pdf` no tiene efectos | `src/app/api/acceso/route.ts` |
| Rate limiting / abuse | ninguno en v1 (detrás de la clave; riesgo aceptado en §20.2) | — |
| Webhook verification | NOT APPLICABLE — no hay webhooks | — |
| Dependency audit | `npm audit --omit=dev` antes de cada publicación | manual |
| Security headers | `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(), geolocation=()` | `next.config.ts` |
| PII handling | nombre y RUT/cédula del cliente viajan en el pedido del PDF y no se guardan en el servidor; el borrador queda en el navegador de quien cotiza | `src/lib/pdf/generar.ts`, `persistencia.ts` |
| Logging hygiene | no se registran cuerpos de pedidos ni la clave | — |

**Hard rules**
- No secret is ever committed, printed in a log, sent to an error tracker, or embedded in a client bundle.
- All server-side authorization checks run before the work, not after.
- La cookie guarda un HMAC, nunca la clave.

Datos regulados: ninguno. Los datos personales son el nombre y documento del cliente en un PDF que el
propio vendedor entrega; no se almacenan en el servidor.

---

## 15. Accessibility

**Target: WCAG 2.2 Level AA** en la pantalla del cotizador.

### Baseline requirements
| Requirement | Rule |
|---|---|
| Semantic HTML | `main`, un `h1` («FH Cotizador»), secciones con encabezados, listas para ítems y resultados |
| Keyboard | todo operable con teclado; el formulario del intérprete aplica con Enter |
| Focus visible | anillo de foco visible (`focus-visible:outline`) en marino sobre blanco |
| Contrast | la paleta de §7 pasa AA |
| Forms | cada campo con `<label>` o `aria-label` (contrato de §6); errores en texto, no solo color |
| Images | el PDF no es HTML; en pantalla no hay imágenes con información |
| Motion | solo `transition-colors` |
| Zoom / reflow | una columna, sin scroll horizontal a 320px |
| Live regions | el resultado del intérprete en la única región `role="status"` |

### WCAG 2.2 additions — the ones most often missed
| SC | Requirement |
|---|---|
| 2.4.11 Focus Not Obscured (Min) | la barra de total fija no tapa el campo con foco (`scroll-margin-bottom` en los campos) |
| 2.5.7 Dragging Movements | no hay arrastre |
| 2.5.8 Target Size (Min) | controles de 44px o más |
| 3.3.7 Redundant Entry | el borrador y los ajustes del dispositivo se recuerdan |
| 3.3.8 Accessible Authentication (Min) | el campo de clave permite pegar y gestores de contraseñas (`autocomplete="current-password"`) |

### Verification
```bash
npm run test:e2e   # expect: 0 failed — los recorridos encuentran cada control por rol y nombre accesible
```
Antes de lanzar: un recorrido solo con teclado en la PC y uno con el lector de pantalla del celular.

---

## 16. Observability & Cost

### Instrumentation
| Signal | Tool | What it captures | Who looks at it |
|---|---|---|---|
| Errors | logs de funciones de Vercel | excepciones de `/api/pdf` y de la página | Joaquín, si alguien reporta un problema |
| Logs | Vercel (retención del plan Hobby) | pedidos y estados | Joaquín |
| Metrics | ninguna en v1 | — | — |
| Uptime | `GET /api/salud` a mano | que la app responda | Joaquín |

### The metrics that matter for this project
| Metric | Target | Alert at |
|---|---|---|
| Tiempo de `POST /api/pdf` | menos de 5 s con 3 productos | si alguien reporta más de 15 s |
| Errores 502 de Shopify | 0 por semana | si se repiten el mismo día |
| «No entendí» del intérprete | menos del 20% de los pedidos | al revisar las frases anotadas |

### Health check
`GET /api/salud` → `{ ok: true, app: "fh-cotizador" }`. Solo prueba que la app responde; la
disponibilidad de Shopify se ve al abrir `/`.

### Cost model
| Service | Free tier | Cost at v1 scale (≈ 50 PDF/mes) | Cost at 10× | Cliff to watch |
|---|---|---|---|---|
| Vercel Hobby | incluye tráfico y ejecución de funciones de sobra para este uso | US$ 0 | US$ 0 | los términos del plan Hobby son para uso personal y no comercial (riesgo aceptado, §20.2) |
| Shopify (products.json público) | sin costo | US$ 0 | US$ 0 | — |
| GitHub (repo privado) | gratis | US$ 0 | US$ 0 | — |

**Estimated monthly cost at launch: US$ 0.** No hay ninguna línea que escale con el uso: sin IA, sin
base de datos, sin envíos.

---

## 17. Model Routing

NOT APPLICABLE — this project does not call an LLM at runtime.

---

## 18. Skills to Use During Build

Nunca son obligatorias: si una no está instalada, el builder sigue con este blueprint y lo anota en una línea.

| Skill | Build steps | Why | Install |
|---|---|---|---|
| frontend-design | 10, 11, 12 | pantalla mobile-first prolija sin salirse de los tokens de §7 | `/plugin marketplace add anthropics/skills` then `/plugin install example-skills@anthropic-agent-skills` |
| ui-ux-pro-max | 10, 11 | revisar densidad y jerarquía de la pantalla | `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` then `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill` |
| playwright-cli | 12, 14 | escribir y depurar los recorridos e2e | `npm install -g @playwright/cli@latest` then `playwright-cli install --skills` |
| pdf | 8 | revisar el PDF generado si hay dudas de contenido | `/plugin marketplace add anthropics/skills` then `/plugin install document-skills@anthropic-agent-skills` |

---

## 19. Agent Workspace

Emitido como archivos reales bajo `blueprints/fh-cotizador/workspace/`, con la misma estructura que
el proyecto. El Bootstrap (§10) los copia a la raíz con `fs.cpSync(..., { force: false, errorOnExist: false })`:
**no pisa ningún archivo que ya exista** (en particular `package.json`, `package-lock.json` y lo que
los pasos hayan editado, como `src/app/layout.tsx`) y sale con código 0 también en la segunda corrida,
en Windows, macOS y Linux. No se emite `.claude/commands/`.

### 19.1 `CLAUDE.md`
Archivo real: `workspace/CLAUDE.md` (128 líneas: comandos primero, arquitectura con los dos caminos
de un pedido, límites entre capas, reglas de código, tokens de diseño, entorno, reglas por área y los
7 no negociables).

### 19.2 `AGENTS.md`
Archivo real: `workspace/AGENTS.md` (comandos, no negociables y puntero a `CLAUDE.md`).

### 19.3 `.claude/settings.json`
Archivo real: `workspace/.claude/settings.json`. Permite cada comando que aparece en un `Verify` de
§9 y en §20.1 (`npm run typecheck|lint|build|verificar|test:e2e|iva:revisar`, `npm test`,
`npm install`, `npx vitest run`, `npx playwright install chromium`, `node scripts/probar-servidor.mjs`,
`node -e`, `grep`, `test`, `git status|diff|log|add|commit|tag|init|config|rev-parse|ls-files|check-ignore`).
Niega leer `.env` y `.env.local`, `git push`, `vercel` y `rm -rf`.

### 19.4 Project skills — `.claude/skills/<name>/SKILL.md`
| Skill | Triggers on | What it automates |
|---|---|---|
| `probar-servidor` | verificar rutas, acceso o API contra el servidor armado | build + chequeos HTTP con `scripts/probar-servidor.mjs` |
| `agregar-frase` | «el intérprete no entendió…», soportar una frase nueva | caso en el test → regla en `interpretarClausula` → gate |
| `cambiar-membrete` | llega una hoja membretada nueva o cambia el logo de pago | reemplazo del JPG/PNG, márgenes, test del PDF y trazado |

### 19.5 `.claude/rules/*.md`
| File | `paths` globs | Covers |
|---|---|---|
| `.claude/rules/pdf.md` | `src/lib/pdf/**`, `src/app/api/pdf/**` | zona de escritura, fuentes, WinAnsi, imágenes, códigos de error |
| `.claude/rules/interprete.md` | `src/lib/interprete/**` | determinismo, orden de reglas, puntaje, test primero |
| `.claude/rules/catalogo.md` | `src/lib/catalogo/**`, `scripts/**` | fuente única, variantes, IVA por etiqueta, scripts `.mts` |
| `.claude/rules/interfaz.md` | `src/components/**`, `src/app/**/*.tsx` | mobile-first, tokens, historial, contrato de nombres, estados |

### 19.6 Verify-critical config and local infrastructure

No hay servicios locales (ni base de datos ni contenedores): el único servicio externo es la web
pública de Shopify, que usan solo los pasos 10–14. Todos los archivos de abajo se emiten con
contenido completo bajo `workspace/`.

| File | Path in the project | Which `Verify` commands need it | Resolution/env handling it carries | Bundle-path exclusion |
|---|---|---|---|---|
| `package.json` | `package.json` | todos | scripts y versiones exactas; sin `"type"` (Next) | n/a — no recorre el árbol |
| `tsconfig.json` | `tsconfig.json` | `npm run typecheck`, `npm run build` | `paths: { "@/*": ["./src/*"] }`, `jsx: react-jsx`, `types: ["node"]`, incluye `scripts/**/*.mts` y `*.mts` | `"exclude": ["node_modules", "blueprints"]` |
| `biome.json` | `biome.json` | `npm run lint` | `css.parser.tailwindDirectives: true`; VCS con `.gitignore` | `"!blueprints"` en `files.includes` |
| `vitest.config.mts` | `vitest.config.mts` | `npx vitest run …`, `npm test` | alias `@` → `./src`; `env.ACCESS_KEY` para los tests | `exclude: ["node_modules/**", ".next/**", "blueprints/**"]` e `include` solo `tests/unit/**` |
| `playwright.config.ts` | `playwright.config.ts` | `npm run test:e2e` | carga `.env.local` en `process.env`; levanta `npm run build && npm run start` en :3000 | `testDir: "tests/e2e"` (nunca mira `blueprints/`) |
| `next.config.ts` | `next.config.ts` | `npm run build`, `probar-servidor` | `serverExternalPackages: ["@react-pdf/renderer", "sharp"]`, trazado de `src/lib/pdf/assets/**`, headers | n/a — Next solo compila lo que importa `src/` |
| `postcss.config.mjs` | `postcss.config.mjs` | `npm run build` | plugin `@tailwindcss/postcss` | n/a |
| `src/app/globals.css` (paso 1, no workspace) | `src/app/globals.css` | `npm run build` | tokens `@theme`; Tailwind 4 busca clases recorriendo el proyecto | `@source not "../../blueprints";` en la segunda línea |
| `.gitignore` | `.gitignore` | Bootstrap (primer commit) | `!.env.example` después de `.env*` | no ignora `blueprints/` (se commitea a propósito) |
| `.env.example` | `.env.example` | Bootstrap (se copia a `.env.local`) | `ACCESS_KEY=clave-local-1234567890` | n/a |
| `scripts/probar-servidor.mjs` | `scripts/probar-servidor.mjs` | pasos 1, 2, 9, 10, 11, 13, 14 | lee `ACCESS_KEY` del entorno o de `.env.local`; exige `.next/BUILD_ID`; sale 0/1/2 | n/a — no recorre el árbol |
| `tests/fixtures/productos-shopify.json` | ídem | pasos 4–9, 13 | datos | excluido de Biome (`!tests/fixtures`) |
| `tests/fixtures/foto.jpg` | ídem | paso 8 | JPG de 400×300 | n/a |
| `tests/fixtures/solicitud-incompleta.json` | ídem | pasos 9, 14 | borrador válido sin ítems ni entrega → 422 | excluido de Biome |
| `tests/fixtures/solicitud-invalida.txt` | ídem | paso 9 | `{x` (no es JSON) → 400 | excluido de Biome |
| `src/lib/pdf/assets/membrete-fh-a4.jpg`, `mi-maquinaria.png` | ídem | pasos 8, 9 | imágenes | n/a |
| `public/icons/icon-192.png`, `icon-512.png`, `src/app/icon.png`, `src/app/apple-icon.png` | ídem | paso 13 | imágenes | n/a |

#### Resolution convention matrix

**The convention, stated once:** los imports internos usan el alias `@/` → `src/` (por ejemplo
`import { formatearUSD } from "@/lib/dinero/formato"`), sin extensión; los imports relativos dentro
de una misma carpeta (`./winansi`) también sin extensión.

| Context | Command that exercises it | Convention as it appears there | Config + literal setting that makes it work |
|---|---|---|---|
| Application source | `npm run build` | `@/lib/...` sin extensión | `tsconfig.json` — `"paths": { "@/*": ["./src/*"] }` (Next lo lee) |
| Test files | `npx vitest run tests/unit/...` | `@/lib/...`, `@/app/...`, `@/proxy` | `vitest.config.mts` — `resolve.alias["@"] = fileURLToPath(new URL("./src", import.meta.url))` |
| Standalone scripts | `npm run iva:revisar -- --fixture tests/fixtures/productos-shopify.json` | `@/lib/catalogo/...` sin extensión, archivo `.mts` | `tsx` lee `paths` de `tsconfig.json`; `.mts` = ESM (permite `await` arriba); `tsconfig.json` incluye `scripts/**/*.mts`. Nunca `@/lib/pdf/**` (tsx no carga @react-pdf) |
| Build / bundle | `npm run build` | igual que la fuente | `tsconfig.json` — `paths`; `next.config.ts` — `serverExternalPackages` |
| Type check | `npm run typecheck` | igual que la fuente | `tsconfig.json` — `moduleResolution: "bundler"` |
| `scripts/probar-servidor.mjs` | `node scripts/probar-servidor.mjs ...` | no importa código del proyecto | Node puro, ESM por extensión `.mjs` |

Cada fila se ejecutó en la preparación del plan (2026-09-11) con estas mismas configuraciones.

#### Cross-artifact value reconciliation

| Shared value | Single source — the file that decides it | Literal value | Every other place it appears | Compared |
|---|---|---|---|---|
| Nombre de la app | `package.json` — `name` | `fh-cotizador` | `src/app/api/salud/route.ts` (`app`), chequeos `contiene=fh-cotizador` en pasos 1, 2, 14, `tests/unit/salud.test.ts` | yes |
| Puerto de la app | `package.json` — `start` | `3000` | `playwright.config.ts` — `baseURL` y `webServer.url` | yes |
| Puerto de chequeo | `scripts/probar-servidor.mjs` — `puerto` | `3100` | `.claude/skills/probar-servidor/SKILL.md` | yes |
| Ruta del paquete | este blueprint | `blueprints/fh-cotizador` | §10 Bootstrap (`cpSync`), `CLAUDE.md` (orden de construcción) | yes |
| Exclusión del paquete | este blueprint | `blueprints` | `tsconfig.json` `exclude`, `biome.json` `!blueprints`, `vitest.config.mts` `blueprints/**`, `src/app/globals.css` `@source not "../../blueprints"` | yes |
| Carpeta de assets del PDF | `next.config.ts` — `outputFileTracingIncludes` | `src/lib/pdf/assets` | `src/lib/pdf/generar.ts`, `tests/unit/pdf.test.tsx`, `tests/unit/api-pdf.test.ts`, grep del paso 9 | yes |
| Archivo del membrete | `workspace/src/lib/pdf/assets/` | `membrete-fh-a4.jpg` | `generar.ts`, `pdf.test.tsx`, grep del paso 9, skill `cambiar-membrete` | yes |
| Cookie de acceso | `src/lib/acceso.ts` — `COOKIE_ACCESO` | `fh_acceso` | `src/proxy.ts`, `tests/unit/acceso.test.ts`, criterios del paso 2 | yes |
| Clave de test | `vitest.config.mts` — `env.ACCESS_KEY` | `clave-de-test-1234567890` | comentario y constante de `tests/unit/acceso.test.ts` | yes |
| Clave local | `.env.example` | `clave-local-1234567890` | §10 (tabla de variables) | yes |
| Carpetas de tests | `vitest.config.mts` `include` / `playwright.config.ts` `testDir` | `tests/unit` / `tests/e2e` | §3, pasos 1–12 | yes |
| URL del catálogo | `src/lib/config/negocio.ts` | `https://florenciohernandez.com.uy/products.json` | `tests/unit/catalogo.test.ts`, `CLAUDE.md`, `.claude/rules/catalogo.md` | yes |

#### Byte-exact artifact reconciliation

| Byte-exact artifact | Authored by | First diffed at | Blueprint rules that constrain it | Runtime call that produces it, on the §11 pin | Both confirmed |
|---|---|---|---|---|---|
| Textos esperados de `tests/unit/dinero.test.ts` («U$S 17.900», «Dólares americanos …») | paso 3 | paso 3 | reglas de formato y apócope de E1-T3 | producidos por código propio; test ejecutado en Node 24 / Vitest 4.1.11 el 2026-09-11 | yes |
| Textos de `tests/unit/interprete.test.ts` (resúmenes y mensajes) | paso 7 | paso 7 | reglas de E1-T7 | producidos por código propio sobre el fixture; ejecutado el 2026-09-11 | yes |
| Frases de `tests/unit/pdf.test.tsx` (extraídas del PDF) | paso 8 | paso 8 | cada frase es un único `<Text>` (`.claude/rules/pdf.md`); «setiembre» y hora de Montevideo (E2-T1) | `renderToBuffer` de @react-pdf/renderer 4.9.0 + `extractText` de unpdf 1.8.1; ejecutado el 2026-09-11 | yes |
| `tests/fixtures/productos-shopify.json` | workspace | paso 4 | forma de `esquemaRespuestaShopify` (§4) | foto real de `products.json` del 2026-09-11 + etiqueta agregada en dos productos | yes |

---

## 20. Acceptance Gate, Risks & Decision Log

### 20.1 Global acceptance gate

El proyecto está **terminado** cuando todo esto sale 0 desde un clon limpio (después del Bootstrap):

```bash
npm install                                        # expect: exit 0
npm run typecheck                                  # expect: exit 0, sin errores
npm run lint                                       # expect: exit 0, sin errores ni avisos
npm test                                           # expect: exit 0, 0 failed, 0 skipped
npm run test:e2e                                   # expect: exit 0, 0 failed
npm run build                                      # expect: exit 0
node scripts/probar-servidor.mjs "GET /api/salud 200 contiene=fh-cotizador" "GET / 307 destino=/acceso" "GET / 200 acceso contiene='Buscar producto'" "POST /api/pdf 422 acceso cuerpo=tests/fixtures/solicitud-incompleta.json contiene=BORRADOR_INCOMPLETO" "GET /manifest.webmanifest 200 contiene='FH Cotizador'"   # expect: 5 OK — corre el artefacto que produce el build
npm run iva:revisar -- --fixture tests/fixtures/productos-shopify.json | grep -q "Retroexcavadora LW-6"   # expect: exit 0
```

La accesibilidad automática no está en el gate (decisión 10); la cubren los e2e por rol y nombre.

Gates manuales, una vez antes de lanzar:

- [ ] Cada paso de §9 tiene su tag: `git tag -l 'step-*'` lista 14, de `step-01-base` a `step-14-entrega`. El repo lo crea el Bootstrap de §10.
- [ ] Los archivos que se commitean están en git, uno por comando: `git ls-files --error-unmatch .env.example`, `git ls-files --error-unmatch package-lock.json`, `git ls-files --error-unmatch blueprints/fh-cotizador/tasks.json` (cada uno sale 0), y ninguno está ignorado: `git check-ignore -q .env.example; test $? -eq 1` y lo mismo para cada uno.
- [ ] `.env.local` no está en git: `git check-ignore -q .env.local; test $? -eq 0`.
- [ ] El `.gitignore` llegó en el commit del Bootstrap: `git log --diff-filter=A --format=%s -- .gitignore` muestra `chore: scaffold`.
- [ ] Todas las filas de *Byte-exact artifact reconciliation* dicen `yes`.
- [ ] El Bootstrap de §10 se volvió a correr una vez sobre el proyecto armado, salió 0 y `package.json` sigue con todas sus dependencias (`npm run typecheck` sigue saliendo 0).
- [ ] Todas las filas de *Cross-artifact value reconciliation* dicen `yes` y el lint corrió con el paquete dentro del proyecto.
- [ ] Ningún non-goal de §1 fue construido.
- [ ] `ACCESS_KEY` está cargada en Vercel y no aparece en el repo.
- [ ] Los 3 recorridos de §13 se completan en la URL de producción desde un celular real, y «Compartir» abre WhatsApp con el PDF adjunto.
- [ ] Un recorrido solo con teclado en la PC y uno con lector de pantalla en el celular (§15).
- [ ] Una vuelta atrás con «Promote to Production» sobre un deploy anterior, hecha a propósito (§12).

**No warnings are ignored.**

### 20.2 Risk register

| Risk | Likelihood | Impact | Early signal | Mitigation |
|---|---|---|---|---|
| Faltan etiquetas `iva-incluido` y un PDF sale «Exento de IVA» en una pala o retro | Alta al principio | Alta | Alerta «Revisar IVA en Shopify» en pantalla y en `npm run iva:revisar` | La app nunca adivina el IVA y avisa; Joaquín carga la lista en Shopify apenas la tenga (checklist §12) |
| Los términos del plan Hobby de Vercel son para uso personal y no comercial | Media | Media | Aviso de Vercel o límite de uso | Decisión de Joaquín (uso ocasional). Si Vercel lo pide: plan Pro, o mover a otro hosting gratis; el proyecto no depende de nada propio de Vercel |
| El intérprete no entiende frases reales | Media | Baja | «No entendí» frecuentes | Todo se puede hacer con botones; cada frase nueva entra con la skill `agregar-frase` |
| Shopify cambia o limita `products.json` | Baja | Alta | Error 502 «No se pudo leer el catálogo» | Código aislado en `src/lib/catalogo/shopify.ts`; alternativa: Storefront API con token público |
| Una descripción muy larga no entra en su hoja | Media | Baja | El producto sigue en la hoja siguiente | Las secciones de venta arrancan ocultas; «Ocultar toda la descripción» y líneas individuales por ítem |
| Un producto no tiene medidas ni peso en Shopify | Alta (81 de 145 productos que no son repuestos tienen menos de 2 datos con medida) | Media | Hoja con poca información | Se completa la ficha técnica en Shopify; la app nunca inventa datos |
| El e2e depende de productos reales (Farmtrac FT 6050, Retroexcavadora LW-6) | Media | Baja | El e2e falla por «no encuentra el botón» | Cambiar la búsqueda del spec por un producto que exista (pitfall anotado en el epic 02) |
| Alguien comparte el link de acceso fuera de la empresa | Baja | Media | Uso desconocido | Cambiar `ACCESS_KEY` corta todos los accesos al instante |
| Un PDF con varias fotos pasa el límite de 4,5 MB de respuesta de Vercel | Baja (mitigado) | Alta | Error al generar solo en producción | Cada foto se recomprime con sharp (~200 KB); el test del paso 8 arma un PDF con 3 fotos PNG pesadas y exige menos de 4 MB |

### 20.3 Decision log

| # | Decision | Rejected alternative | Why | Would reverse if |
|---|---|---|---|---|
| 1 | Next.js + TypeScript en Vercel Hobby | Backend separado o hosting propio | Mismo stack que FH Historias, deploy gratis y sin mantenimiento | Vercel exige plan pago por uso comercial |
| 2 | Sin base de datos: Shopify + `localStorage` | Postgres con historial | Joaquín pidió partir siempre de la base; costo cero | Piden historial o reenviar cotizaciones viejas |
| 3 | Intérprete propio determinista | Claude u otra IA | Joaquín pidió costo cero; los pedidos típicos son un conjunto chico de frases | Más del 20% de «No entendí» con frases reales |
| 4 | Código de equipo + cookie HMAC de 400 días | Cuentas por persona (Clerk/Auth.js) | Lo más simple para 1–10 personas de la empresa | Hace falta saber quién generó cada documento |
| 5 | @react-pdf/renderer en el servidor | Chromium/Puppeteer o PDF en el navegador | Liviano en una función gratis; texto real y testeable; probado con el membrete | Se necesita una maqueta HTML/CSS compleja |
| 6 | Membrete como imagen de fondo A4 | Membrete dibujado con código | Joaquín diseñó su hoja y la quiere tal cual; se cambia reemplazando un JPG | Hace falta texto del membrete buscable |
| 7 | IVA por etiqueta `iva-incluido` en Shopify, con alerta de sospecha | Reglas por título en el código | Shopify queda como única fuente; productos nuevos no tocan la app | Shopify agrega un campo de IVA nativo |
| 8 | Precio visto + 409 `PRECIO_CAMBIO` | Usar siempre el precio actual sin avisar | Nunca mandar un precio distinto del que vio el vendedor | — |
| 9 | npm en lugar de pnpm | pnpm 11 (track) | La otra app de FH usa npm; menos fricción en Windows | El equipo adopta pnpm |
| 10 | Sin axe en v1; e2e por rol y nombre | `@axe-core/playwright` en el gate | App interna de pocas personas; una dependencia menos | Se abre a clientes externos |
| 12 | Recomprimir cada foto con sharp en el servidor | Confiar en `format=pjpg` de Shopify | Shopify no convierte los PNG con transparencia (1,2–2,5 MB cada uno) y Vercel corta a los 4,5 MB | Shopify empieza a convertirlos, o se pasa a un hosting sin ese límite |
| 13 | Una hoja por producto; secciones de venta ocultas de entrada | Todos los productos seguidos con la descripción completa | Pedido de Joaquín (2026-09-15): cada hoja muestra lo importante —medidas, peso, equipamiento— y la cotización queda prolija | Se pide volver a la lista corrida |
| 11 | Vitest 4.1.11 y TypeScript 6.0.3 | Vitest 5.0.0 y TypeScript 7 (`latest`) | Vitest 5 tenía 8 días; Next 16 rechaza TS 7 sin opción experimental | Salen versiones estables probadas con Next |

### 20.4 What to build next

1. **Historial de cotizaciones** (non-goal 1) — cuando necesiten reenviar o buscar documentos viejos: Postgres gratis (Neon) + numeración.
2. **Frases libres con IA** (non-goal 3) — si el intérprete falla más del 20%: Claude solo como traductor a las mismas `Accion`, con tope de gasto.
3. **Precios en pesos** (non-goal 4) — si los clientes lo piden: tipo de cambio cargado a mano del día.
4. **Cuotas de Mi Maquinaria** (non-goal 6) — si Santander entrega una tabla oficial.

---

*End of blueprint. Build order is §9. Stop when §20.1 is green.*
