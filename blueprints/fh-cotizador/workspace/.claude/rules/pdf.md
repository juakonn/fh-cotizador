---
description: Convenciones del PDF de cotización y proforma
paths:
  - "src/lib/pdf/**"
  - "src/app/api/pdf/**"
---

- El PDF se arma solo en el servidor (`runtime = "nodejs"`). Nada de `src/lib/pdf/**` se importa desde
  `src/components/**` ni desde `scripts/**`.
- Página A4 con el membrete `src/lib/pdf/assets/membrete-fh-a4.jpg` como `<Image fixed>` absoluto de
  210×297 mm. Zona de escritura: `paddingTop 52mm`, `paddingBottom 32mm`, `paddingHorizontal 18mm`.
  El membrete ocupa arriba hasta 46 mm y abajo desde 270,6 mm: no escribir fuera de la zona.
- **Una hoja por producto**: cada producto después del primero empieza con `break`. Arriba el título,
  la foto y el recuadro de precio lado a lado; abajo la descripción visible, con las líneas
  «Etiqueta: valor» como filas de tabla. Con más de 10 líneas visibles el producto pasa a dos columnas
  (foto y precio a la izquierda, ficha al lado) para que el cierre entre en la misma hoja. El cierre (resumen si hay 2 o más productos, total, condiciones,
  notas y «Atendido por») va en un único bloque `wrap={false}` después del último producto.
- Medidas, peso y equipamiento salen solo de la descripción de Shopify: si faltan, se cargan en la web.
- Fuentes estándar (`Helvetica`, `Helvetica-Bold`, `Helvetica-Oblique`). No se registran fuentes.
- Todo texto variable pasa por `aWinAnsi()` antes de entrar a un `<Text>`.
- Cada frase que un test busca (por ejemplo `TOTAL: U$S 24.835`) es un único string dentro de un
  único `<Text>`: no se parte en `<Text>` anidados con estilos distintos.
- Toda foto pasa por `prepararImagen` (sharp: fondo blanco, 1000 px de ancho como máximo, JPG
  calidad 80). Shopify devuelve PNG de 1–2,5 MB cuando la foto tiene transparencia aunque se pida JPG,
  y Vercel corta respuestas de más de 4,5 MB. Si una foto falla, el PDF sale igual sin esa foto.
- Montos con `formatearUSD`, total en letras con `montoEnLetras` sobre el mismo entero.
- Fechas con `src/lib/pdf/fecha.ts` (hora de America/Montevideo, "setiembre").
- La ruta responde errores con `{ error: { codigo, mensaje, detalle? } }` y los códigos de
  `CodigoErrorPdf` en `generar.ts`.
