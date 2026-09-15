// Levanta `next start` en un puerto aparte, corre chequeos HTTP y apaga el servidor.
// Requiere haber corrido `npm run build` antes.
// Uso: node scripts/probar-servidor.mjs [--puerto N] "METODO RUTA ESTADO [opciones]" ...
// Opciones de cada chequeo:
//   acceso                     envía la cookie que devuelve /api/acceso?k=<ACCESS_KEY>
//   contiene='texto'           el cuerpo de la respuesta contiene ese texto
//   tipo=prefijo               el content-type empieza con ese prefijo
//   destino='texto'            el header Location contiene ese texto
//   encabezado='nombre: valor' ese header existe con exactamente ese valor
//   cuerpo=archivo             se envía el contenido de ese archivo como JSON
// Códigos de salida: 0 = todo pasó · 1 = algún chequeo falló o el servidor no arrancó · 2 = uso incorrecto.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { setTimeout as esperar } from "node:timers/promises";

const USO =
  "Uso: node scripts/probar-servidor.mjs [--puerto N] \"METODO RUTA ESTADO [acceso] [contiene='texto'] [tipo=prefijo] [destino='texto'] [encabezado='nombre: valor'] [cuerpo=archivo]\" ...";
const OPCIONES = ["contiene", "tipo", "destino", "encabezado", "cuerpo"];

function fallarUso(mensaje) {
  console.error(`probar-servidor: ${mensaje}\n${USO}`);
  process.exit(2);
}

function tokenizar(texto) {
  const tokens = [];
  for (const m of texto.matchAll(/(\w+)='([^']*)'|(\S+)/g)) {
    tokens.push(m[1] ? `${m[1]}=${m[2]}` : m[3]);
  }
  return tokens;
}

function parsearChequeo(texto) {
  const [metodo, ruta, estado, ...opciones] = tokenizar(texto);
  if (!["GET", "POST", "HEAD"].includes(metodo)) fallarUso(`método inválido en "${texto}"`);
  if (!ruta?.startsWith("/")) fallarUso(`ruta inválida en "${texto}"`);
  if (!/^\d{3}$/.test(estado ?? "")) fallarUso(`estado inválido en "${texto}"`);
  const chequeo = { texto, metodo, ruta, estado: Number(estado), acceso: false };
  for (const opcion of opciones) {
    if (opcion === "acceso") {
      chequeo.acceso = true;
      continue;
    }
    const i = opcion.indexOf("=");
    const clave = i > 0 ? opcion.slice(0, i) : "";
    const valor = i > 0 ? opcion.slice(i + 1) : "";
    if (!OPCIONES.includes(clave)) fallarUso(`opción desconocida "${opcion}" en "${texto}"`);
    if (clave === "cuerpo" && !existsSync(valor)) fallarUso(`no existe el archivo ${valor}`);
    if (clave === "encabezado" && !valor.includes(":")) {
      fallarUso(`encabezado sin "nombre: valor" en "${texto}"`);
    }
    chequeo[clave] = valor;
  }
  return chequeo;
}

function leerClave() {
  if (process.env.ACCESS_KEY) return process.env.ACCESS_KEY;
  for (const archivo of [".env.local", ".env"]) {
    if (!existsSync(archivo)) continue;
    for (const linea of readFileSync(archivo, "utf8").split(/\r?\n/)) {
      const m = linea.match(/^\s*ACCESS_KEY\s*=\s*"?([^"]*)"?\s*$/);
      if (m) return m[1];
    }
  }
  return "";
}

const argumentos = process.argv.slice(2);
let puerto = 3100;
const chequeos = [];
for (let i = 0; i < argumentos.length; i++) {
  if (argumentos[i] === "--puerto") {
    puerto = Number(argumentos[++i]);
    if (!Number.isInteger(puerto) || puerto < 1024) fallarUso("puerto inválido");
    continue;
  }
  chequeos.push(parsearChequeo(argumentos[i]));
}
if (chequeos.length === 0) fallarUso("faltan chequeos");

const binNext = "node_modules/next/dist/bin/next";
if (!existsSync(binNext)) {
  console.error("probar-servidor: falta node_modules; corré npm install");
  process.exit(1);
}
if (!existsSync(".next/BUILD_ID")) {
  console.error("probar-servidor: falta el build; corré npm run build");
  process.exit(1);
}

const base = `http://localhost:${puerto}`;
const servidor = spawn(process.execPath, [binNext, "start", "--port", String(puerto)], {
  stdio: ["ignore", "pipe", "pipe"],
  env: process.env,
});
let registro = "";
servidor.stdout.on("data", (d) => {
  registro += d;
});
servidor.stderr.on("data", (d) => {
  registro += d;
});
let terminado = false;
servidor.on("exit", () => {
  terminado = true;
});

function apagar() {
  if (terminado) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(servidor.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    servidor.kill("SIGTERM");
  }
}

async function esperarServidor() {
  for (let intento = 0; intento < 120; intento++) {
    if (terminado) return false;
    try {
      const r = await fetch(`${base}/api/salud`);
      if (r.status === 200) return true;
    } catch {
      // todavía no escucha
    }
    await esperar(500);
  }
  return false;
}

async function obtenerCookie() {
  const clave = leerClave();
  if (!clave) throw new Error("ACCESS_KEY no está definida (ni en el entorno ni en .env.local)");
  const r = await fetch(`${base}/api/acceso?k=${encodeURIComponent(clave)}`, {
    redirect: "manual",
  });
  const cookies = r.headers.getSetCookie();
  if (cookies.length === 0) throw new Error(`/api/acceso no devolvió cookie (estado ${r.status})`);
  return cookies.map((c) => c.split(";")[0]).join("; ");
}

function problemasDe(c, r, cuerpo) {
  const problemas = [];
  if (r.status !== c.estado) problemas.push(`estado ${r.status} (esperado ${c.estado})`);
  const tipo = r.headers.get("content-type") ?? "";
  if (c.tipo && !tipo.startsWith(c.tipo)) problemas.push(`content-type "${tipo}"`);
  const destino = r.headers.get("location") ?? "";
  if (c.destino && !destino.includes(c.destino)) problemas.push(`location "${destino}"`);
  if (c.encabezado) {
    const i = c.encabezado.indexOf(":");
    const nombre = c.encabezado.slice(0, i).trim();
    const valor = c.encabezado.slice(i + 1).trim();
    const real = r.headers.get(nombre);
    if (real !== valor) problemas.push(`header ${nombre} = "${real}"`);
  }
  if (c.contiene !== undefined && !cuerpo.includes(c.contiene)) {
    problemas.push(`el cuerpo no contiene "${c.contiene}"`);
  }
  return problemas;
}

async function correr() {
  if (!(await esperarServidor())) {
    console.error(`FALLA: el servidor no respondió en ${base}/api/salud\n${registro}`);
    return 1;
  }
  const cookie = chequeos.some((c) => c.acceso) ? await obtenerCookie() : "";
  let fallas = 0;
  for (const c of chequeos) {
    const headers = {};
    if (c.acceso) headers.cookie = cookie;
    let body;
    if (c.cuerpo) {
      headers["content-type"] = "application/json";
      body = readFileSync(c.cuerpo, "utf8");
    }
    const r = await fetch(`${base}${c.ruta}`, {
      method: c.metodo,
      headers,
      body,
      redirect: "manual",
    });
    const cuerpo = c.contiene !== undefined ? await r.text() : "";
    const problemas = problemasDe(c, r, cuerpo);
    if (problemas.length === 0) {
      console.log(`OK     ${c.texto}`);
    } else {
      fallas++;
      console.log(`FALLA  ${c.texto} → ${problemas.join("; ")}`);
    }
  }
  return fallas === 0 ? 0 : 1;
}

let codigo = 1;
try {
  codigo = await correr();
} catch (error) {
  console.error(`FALLA: ${error.message}`);
  codigo = 1;
} finally {
  apagar();
}
process.exit(codigo);
