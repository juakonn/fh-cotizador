import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/salud/route";

describe("GET /api/salud", () => {
  it("responde 200 con ok", async () => {
    const r = GET();
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, app: "fh-cotizador" });
  });
});
