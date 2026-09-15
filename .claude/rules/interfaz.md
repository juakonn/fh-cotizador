---
description: Convenciones de la interfaz del cotizador
paths:
  - "src/components/**"
  - "src/app/**/*.tsx"
---

- Mobile-first: se usa sobre todo desde el celular. Controles de al menos 44px de alto, un solo
  camino de columna, ancho máximo `max-w-2xl`.
- Colores solo con los tokens de `@theme` (`bg-marino`, `text-texto-suave`, `border-borde`…). Nada de
  hex sueltos en componentes.
- Todo el estado de la cotización pasa por `conHistorial`/`deshacer` de `src/lib/cotizacion/reducer.ts`.
  Un pedido del intérprete es un solo paso de Deshacer.
- El borrador se guarda en localStorage (`guardarBorrador`) en cada cambio y se recupera al abrir.
- Los nombres accesibles de la tabla "Contrato de la interfaz" del blueprint son un contrato con
  `tests/e2e/cotizacion.spec.ts`: no se cambian sin cambiar el test en el mismo commit.
- Los componentes nunca importan `src/lib/pdf/**`, `src/lib/catalogo/shopify.ts` ni
  `src/lib/acceso.ts`.
- Estados siempre visibles: catálogo que no cargó (mensaje + botón "Reintentar"), búsqueda sin
  resultados ("No hay productos con esa búsqueda"), cotización vacía ("Todavía no agregaste
  productos") y PDF generándose (botón deshabilitado con "Generando…").
