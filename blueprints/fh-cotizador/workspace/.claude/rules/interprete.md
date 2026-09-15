---
description: Convenciones del intérprete de frases
paths:
  - "src/lib/interprete/**"
---

- El intérprete es código determinista: sin IA, sin red, sin azar. La misma frase con el mismo
  borrador y catálogo da siempre el mismo resultado.
- Nunca calcula montos por su cuenta: usa `calcularTotales` y `formatearUSD`.
- Devuelve `ok` (acciones + resumen), `elegir` (pregunta + opciones) o `no-entendi` (mensaje). Si una
  parte de la frase no se entiende, no aplica ninguna.
- Toda frase nueva que se quiera soportar entra primero como caso en
  `tests/unit/interprete.test.ts` y después como regla en `interpretarClausula`.
- La comparación se hace sobre texto normalizado (`normalizarTexto`: minúsculas y sin tildes). Los
  nombres del cliente se toman del texto original para respetar mayúsculas y tildes.
- El puntaje de búsqueda está en `buscar.ts`: base 100, −50 repuesto, +30 mismo modelo que el tractor
  de la cotización, ±10 por cabina, −40 otro tractor o combo. Una opción gana si saca 10 puntos o más
  de ventaja; si no, se pregunta con hasta 6 opciones.
