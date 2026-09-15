---
name: probar-servidor
description: Levanta la app armada en el puerto 3100 y chequea respuestas HTTP reales (estado, texto, redirecciones, headers, cookie de acceso). Usala cuando un paso pide verificar rutas, el acceso o la API del PDF contra el servidor, o cuando algo "anda en los tests pero no en el servidor".
---

# Probar el servidor armado

## Cuándo usarla
- Un `Verify` del plan corre `node scripts/probar-servidor.mjs`.
- Cambiaste `src/proxy.ts`, una ruta de `src/app/api/**`, `next.config.ts` o `src/app/page.tsx`.

## Pasos
1. `npm run build` (el script falla con código 1 si no hay build).
2. Asegurate de que exista `.env.local` con `ACCESS_KEY` (el Bootstrap lo copia de `.env.example`).
3. Corré los chequeos, uno por argumento entre comillas:
   `node scripts/probar-servidor.mjs "GET /api/salud 200 contiene=fh-cotizador" "GET / 307 destino=/acceso"`
4. Opciones por chequeo: `acceso` (manda la cookie), `contiene='texto'`, `tipo=prefijo`,
   `destino='texto'`, `encabezado='nombre: valor'`, `cuerpo=archivo`.

## Verificar
```bash
node scripts/probar-servidor.mjs "GET /api/salud 200"   # expect: una línea OK y código 0
node scripts/probar-servidor.mjs "FOO /x 200"; test $? -eq 2   # expect: uso incorrecto → código 2
```

## No hagas
- No levantes `npm run dev` para esto: el chequeo vale contra el build de producción.
- No pongas la clave real de producción en `.env.local`.
