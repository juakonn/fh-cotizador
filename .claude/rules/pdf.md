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
- **Una hoja por producto**: cada producto después del primero empieza con `break`. Con foto y al
  menos 3 líneas visibles va en dos columnas (foto grande enmarcada y precio destacado a la izquierda,
  ficha técnica al lado, con las líneas «Etiqueta: valor» como filas de tabla); si no, foto y precio
  lado a lado y la ficha abajo. El alto de la foto sale de `altoFotoColumna`: son los valores más
  grandes que dejan entrar el cierre en la misma hoja, medidos con los tests del paso 8.
- **El cierre** va después del último producto en un bloque `wrap={false}` de dos columnas:
  condiciones, forma de pago y notas a la izquierda; resumen, total y «Atendido por» a la derecha.
- Medidas, peso y equipamiento salen de la descripción de Shopify más los `agregados` del ítem (líneas
  escritas a mano para esa cotización), que van al final de la ficha.
- El precio de la línea es `precioManualCentavos ?? precioCentavos` del producto; con precio a mano no
  se controla el cambio de precio de la web.
- Fuentes estándar (`Helvetica`, `Helvetica-Bold`, `Helvetica-Oblique`). No se registran fuentes.
- Todo texto variable pasa por `aWinAnsi()` antes de entrar a un `<Text>`.
- Cada frase que un test busca (por ejemplo `TOTAL: U$S 24.835`) es un único string dentro de un
  único `<Text>`: no se parte en `<Text>` anidados con estilos distintos.
- Toda foto pasa por `prepararImagen` (sharp: fondo blanco, 1000 px de ancho como máximo, JPG
  calidad 80). Shopify devuelve PNG de 1–2,5 MB cuando la foto tiene transparencia aunque se pida JPG,
  y Vercel corta respuestas de más de 4,5 MB. Si una foto falla, el PDF sale igual sin esa foto.
- Montos con `formatearUSD`, total en letras con `montoEnLetras` sobre el mismo entero.
- Con `financiacion`, la forma de pago sale de `calcularPlanDePago` (entrega + cuotas, la última
  absorbe el resto) y se omite el texto y el logo de Mi Maquinaria. El plan se calcula sobre
  `saldoCentavos`, no sobre el total.
- Con `tomas`, bajo el TOTAL va una línea por máquina recibida y después «SALDO A PAGAR»; las letras
  acompañan al saldo, que es lo que el cliente termina pagando.
- Sin RUT ni cédula no se escribe esa línea; `contacto` sale como «Atención: …» debajo del cliente.
- Fechas con `src/lib/pdf/fecha.ts` (hora de America/Montevideo, "setiembre").
- La ruta responde errores con `{ error: { codigo, mensaje, detalle? } }` y los códigos de
  `CodigoErrorPdf` en `generar.ts`.
