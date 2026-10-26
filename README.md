# FH Cotizador

## Qué es

La app de Florencio Hernández para armar cotizaciones y facturas proforma en PDF con el membrete,
usando los precios, fotos y fichas de la web, desde el celular o la PC.

## Cómo se entra

1. Cada persona abre una sola vez el link de acceso:
   `https://<tu-app>.vercel.app/api/acceso?k=<ACCESS_KEY>`
   (se manda por WhatsApp; `<ACCESS_KEY>` es la clave del equipo que se carga en Vercel).
2. El aparato queda con el acceso guardado por 400 días. No hay usuarios ni contraseñas.
3. Para tenerla como app en la pantalla de inicio:
   - **Android (Chrome):** menú ⋮ → «Agregar a la pantalla principal».
   - **iPhone (Safari):** botón Compartir → «Agregar a inicio».
4. En «Ajustes del dispositivo» cada uno pone su sucursal, su nombre y su celular (van al pie del PDF).
   Si el nombre es Joaquín, el celular sale siempre como 092 469 449.

Si alguna vez se cambia la `ACCESS_KEY` en Vercel, el acceso de todos se corta: hay que mandar el link
nuevo y que cada uno lo vuelva a abrir.

## Cómo se publica en Vercel (gratis)

1. **GitHub:** crear un repositorio privado y subir esta carpeta.
2. **Vercel:** entrar a vercel.com con el plan **Hobby** (gratis) → «Add New» → «Project» → importar
   el repositorio. Framework: Next.js, sin cambiar nada.
3. **Clave del equipo:** antes de publicar, en Settings → Environment Variables agregar `ACCESS_KEY`
   con una clave larga (12 caracteres o más, por ejemplo tres palabras y un número).
4. **Deploy.** Cuando termina, Vercel da la dirección `https://<tu-app>.vercel.app`.
5. Cada cambio que se sube a GitHub (rama `main`) se publica solo.
6. **Volver a una versión anterior:** Vercel → Deployments → elegir la versión que andaba bien →
   «Promote to Production». Tarda menos de un minuto.

## Formas de pago

Por defecto el PDF dice «contado o financiado con Mi Maquinaria by Santander». Si para ese cliente se
arregla otra cosa, en «Condiciones» se elige **Entrega y cuotas**: se pone el porcentaje de entrega y
la cantidad de cuotas, y la app calcula los montos (por ejemplo, 30% de entrega sobre U$S 4.400 son
U$S 1.320 y quedan 7 cuotas de U$S 440). Eso es lo que sale impreso.

## Mandar la cotización por mail

En los datos del cliente hay un campo **Mail del cliente**. Después de generar el PDF, el botón
**«Mail al cliente»** descarga el archivo y abre tu correo con el destinatario, el asunto y el mensaje
ya escritos (productos, total, validez, entrega y forma de pago). Solo falta **adjuntar el PDF que se
acaba de descargar** y enviar.

## Tractores con pala frontal

El tractor va exento de IVA y la pala lo lleva incluido. Al agregar un combo, la app reparte el
precio sola (toma el valor de la pala de ese modelo en la web) y el PDF escribe las dos partes, por
ejemplo «Tractor: U$S 17.300 exento de IVA» y «Pala frontal: U$S 7.300 IVA incluido». Si el reparto
no es ese, se edita en la tarjeta del producto, y «Sin reparto» lo saca.

## Toma de máquinas

Si el cliente entrega un tractor o una máquina en parte de pago, en «Condiciones» se escribe qué se
toma y por cuánto. El PDF muestra el total, la toma y abajo el **saldo a pagar**, que es sobre lo que
se calculan la entrega y las cuotas.

## Precios, fotos y descripciones

Salen de la web (Shopify): la app no guarda ni cambia precios. Si un precio, una foto o una ficha técnica
está mal, se corrige en Shopify y la app lo toma en unos 5 minutos. Las medidas, el peso y el
equipamiento que aparecen en cada hoja del PDF son los que están escritos en la descripción del
producto en la web. Si falta algo, se agrega ahí.

Si el precio de la web cambia mientras se arma una cotización, al generar el PDF la app avisa y ofrece
«Usar precios nuevos».

## Clientes sin RUT

El RUT y la cédula son opcionales: una institución que no los da se carga igual, solo con el nombre.
En «Atención» se puede poner la persona que recibe la cotización.

## IVA

Los precios de la web son sin IVA, salvo los productos marcados en Shopify con la etiqueta
`iva-incluido` (Productos → el producto → Etiquetas → escribir `iva-incluido` → Guardar). Esos salen
en el PDF como «IVA incluido».

Las palas frontales, palas cajón, retroexcavadoras y chipeadoras sin la etiqueta muestran el aviso
«Revisar IVA en Shopify». Para ver la lista completa:

```bash
npm run iva:revisar
```

## Membrete

El fondo de cada hoja del PDF es `src/lib/pdf/assets/membrete-fh-a4.jpg`. Para cambiarlo, reemplazar ese
archivo por otro JPG A4 de 1240×1754 píxeles con el mismo nombre, dejando libre el centro (arriba hasta
unos 5 cm y abajo los últimos 3 cm son del membrete). Después se sube el cambio y Vercel lo publica.

## Para desarrollar

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

Para probar en la PC: copiar `.env.example` a `.env.local` y entrar a
`http://localhost:3000/api/acceso?k=clave-local-1234567890`.
