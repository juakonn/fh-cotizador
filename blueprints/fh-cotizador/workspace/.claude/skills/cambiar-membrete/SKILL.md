---
name: cambiar-membrete
description: Reemplazar la hoja membretada del PDF (nuevo diseño, cambio de teléfono, marca nueva) o el logo de Mi Maquinaria. Usala cuando alguien manda una imagen nueva de membrete o pide cambiar los datos del encabezado o del pie del PDF.
---

# Cambiar el membrete

## Cuándo usarla
- Llega una imagen nueva de hoja membretada.
- Cambian datos del encabezado o del pie (esos datos están dibujados en la imagen, no en el código).

## Pasos
1. La imagen tiene que ser JPG, A4 vertical, 1240 × 1754 px, con el centro libre: nada entre
   5,2 cm del borde de arriba y 3,2 cm del borde de abajo, ni a menos de 1,8 cm de los costados.
2. Reemplazá `src/lib/pdf/assets/membrete-fh-a4.jpg` con el mismo nombre.
3. Si el encabezado o el pie nuevos son más altos, ajustá `paddingTop` / `paddingBottom` de
   `s.pagina` en `src/lib/pdf/documento.tsx` y la regla de `.claude/rules/pdf.md`.
4. Para el logo de pago, reemplazá `src/lib/pdf/assets/mi-maquinaria.png` (PNG recortado al logo).

## Verificar
```bash
npx vitest run tests/unit/pdf.test.tsx    # expect: 0 failed
npm run build && grep -q membrete-fh-a4.jpg .next/server/app/api/pdf/route.js.nft.json   # expect: exit 0
```

## No hagas
- No escribas datos de contacto en el código del PDF: van en la imagen del membrete.
- No uses WebP: el PDF solo acepta JPG o PNG.
