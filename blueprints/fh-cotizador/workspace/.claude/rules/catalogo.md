---
description: Convenciones de lectura del catálogo de Shopify y de los scripts
paths:
  - "src/lib/catalogo/**"
  - "scripts/**"
---

- La única fuente es `https://florenciohernandez.com.uy/products.json` (pública, sin clave). Se pide
  con `limit=250&page=N` hasta que una página traiga menos de 250, con tope de 10 páginas, y con
  `next: { revalidate: 300 }`.
- El id de un producto en la app es el **id de la variante** de Shopify. Las variantes con precio 0
  (tutoriales) se descartan.
- `ivaIncluido` sale solo de la etiqueta `iva-incluido` (sin importar mayúsculas). `sospechaIva`
  marca palas frontales, palas cajón, palas niveladoras, retroexcavadoras y chipeadoras sin la etiqueta
  (salvo el tractor que viene con la pala incluida, que queda exento): nunca se infiere el IVA.
- Las descripciones se limpian con `limpiarDescripcion`: sin emojis, sin enlaces, sin llamados a
  WhatsApp, sin el bloque de financiación (la forma de pago ya va al pie del PDF) y sin precios escritos
  a mano. Las secciones de venta («Ideal para», «Por qué elegirlo», «El respaldo…») salen con
  `importante: false` y arrancan ocultas en la cotización; la ficha técnica queda visible.
- Los tests usan `tests/fixtures/productos-shopify.json` (muestra real del 2026-09-11, con la etiqueta
  `iva-incluido` agregada a las dos "Palas frontales para DF 554"). Nunca se testea contra la web.
- Los scripts son `.mts`, se corren con `tsx` y no importan `src/lib/pdf/**`.
