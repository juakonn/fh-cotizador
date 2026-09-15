---
name: agregar-frase
description: Enseñarle al intérprete una frase nueva ("poné 3 unidades", "sacale la foto", "agregá una nota…"). Usala cuando alguien reporta que el cuadro «Pedile algo» respondió «No entendí» a un pedido razonable o pide soportar una forma nueva de decir algo.
---

# Agregar una frase al intérprete

## Cuándo usarla
- Un pedido real devolvió `no-entendi` y debería haberse entendido.
- Se quiere soportar un sinónimo o verbo nuevo.

## Pasos
1. Escribí primero el caso en `tests/unit/interprete.test.ts`, con el texto tal cual lo escribió la
   persona y el resultado esperado (acciones exactas y resumen).
2. Corré `npx vitest run tests/unit/interprete.test.ts` y confirmá que el caso nuevo falla.
3. Agregá la regla en `interpretarClausula` (`src/lib/interprete/interpretar.ts`) o el verbo en
   `VERBOS_AGREGAR` / `VERBOS_QUITAR` / `VERBOS`. Compará siempre contra el texto normalizado.
4. Si la frase crea una acción que el reducer no tiene, agregala primero en
   `src/lib/cotizacion/reducer.ts` con su test en `tests/unit/reducer.test.ts`.

## Verificar
```bash
npx vitest run tests/unit/interprete.test.ts tests/unit/reducer.test.ts   # expect: 0 failed
npm run typecheck && npm run lint                                            # expect: exit 0
```

## No hagas
- No uses IA ni servicios externos: el intérprete es determinista y gratis por diseño.
- No calcules montos en el intérprete: usá `calcularTotales` y `formatearUSD`.
