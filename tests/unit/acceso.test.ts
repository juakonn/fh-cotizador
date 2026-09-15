import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET, POST } from "@/app/api/acceso/route";
import { COOKIE_ACCESO, claveCorrecta, esTokenValido, tokenDeAcceso } from "@/lib/acceso";
import { proxy } from "@/proxy";

// ACCESS_KEY llega desde vitest.config.mts: "clave-de-test-1234567890"
const CLAVE = "clave-de-test-1234567890";

describe("token de acceso", () => {
  it("es estable, no contiene la clave y se valida", async () => {
    const token = await tokenDeAcceso();
    expect(token).toBe(await tokenDeAcceso());
    expect(token).not.toContain("clave-de-test");
    expect(await esTokenValido(token)).toBe(true);
    expect(await esTokenValido("otro")).toBe(false);
    expect(await esTokenValido(undefined)).toBe(false);
  });
  it("compara la clave del equipo", () => {
    expect(claveCorrecta(CLAVE)).toBe(true);
    expect(claveCorrecta("clave-de-test-123456789X")).toBe(false);
    expect(claveCorrecta("")).toBe(false);
  });
});

describe("/api/acceso", () => {
  it("el link con la clave correcta deja la cookie y lleva al inicio", async () => {
    const r = await GET(new NextRequest(`http://localhost/api/acceso?k=${CLAVE}`));
    expect(r.status).toBe(303);
    expect(r.headers.get("location")).toBe("http://localhost/");
    const cookie = r.cookies.get(COOKIE_ACCESO);
    expect(cookie?.value).toBe(await tokenDeAcceso());
    expect(cookie?.httpOnly).toBe(true);
  });
  it("una clave incorrecta vuelve a /acceso con error y sin cookie", async () => {
    const r = await GET(new NextRequest("http://localhost/api/acceso?k=mala"));
    expect(r.status).toBe(303);
    expect(r.headers.get("location")).toBe("http://localhost/acceso?error=1");
    expect(r.cookies.get(COOKIE_ACCESO)).toBeUndefined();
  });
  it("el formulario con la clave también da acceso", async () => {
    const formulario = new FormData();
    formulario.set("clave", CLAVE);
    const r = await POST(
      new NextRequest("http://localhost/api/acceso", { method: "POST", body: formulario }),
    );
    expect(r.status).toBe(303);
    expect(r.cookies.get(COOKIE_ACCESO)?.value).toBe(await tokenDeAcceso());
  });
});

describe("proxy", () => {
  it("sin cookie redirige las páginas y responde 401 en la API", async () => {
    const pagina = await proxy(new NextRequest("http://localhost/"));
    expect(pagina.status).toBe(307);
    expect(pagina.headers.get("location")).toBe("http://localhost/acceso");
    const api = await proxy(new NextRequest("http://localhost/api/pdf", { method: "POST" }));
    expect(api.status).toBe(401);
    expect(await api.json()).toEqual({
      error: { codigo: "SIN_ACCESO", mensaje: "Abrí el link de acceso para usar la app" },
    });
  });
  it("con la cookie válida deja pasar", async () => {
    const token = await tokenDeAcceso();
    const r = await proxy(
      new NextRequest("http://localhost/", { headers: { cookie: `${COOKIE_ACCESO}=${token}` } }),
    );
    expect(r.headers.get("x-middleware-next")).toBe("1");
  });
});
