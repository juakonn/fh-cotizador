# FH Cotizador — instrucciones para agentes

App interna de Florencio Hernández para armar cotizaciones y facturas proforma en PDF desde el
catálogo de Shopify, con ajustes escritos en lenguaje simple.

## Comandos

| Tarea | Comando |
|---|---|
| Instalar | `npm install` |
| Desarrollo | `npm run dev` |
| Tipos · lint · tests | `npm run typecheck` · `npm run lint` · `npm test` |
| E2E | `npm run test:e2e` |
| Build | `npm run build` |
| Todo junto | `npm run verificar` |

## No negociable

1. Shopify es la única fuente de precios: nada de precios cargados a mano ni guardados en el servidor.
2. Número y letras del total salen del mismo entero en centavos.
3. Sin plazo de entrega no hay PDF, y la factura proforma exige cliente.
4. Costo mensual cero: sin base de datos, sin IA, sin servicios con clave o pagos.
5. Nunca commitear `.env.local` ni claves; la `ACCESS_KEY` real vive solo en Vercel.
6. No editar a mano archivos generados (`next-env.d.ts`, `.next/`, `package-lock.json`).
7. Nunca marcar una tarea como hecha con un gate en rojo.

Arquitectura, límites entre capas y diseño: `CLAUDE.md` en esta misma carpeta.
