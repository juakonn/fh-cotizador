import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const clave = process.env.ACCESS_KEY ?? "";
  await page.goto(`/api/acceso?k=${encodeURIComponent(clave)}`);
  await expect(page.getByRole("heading", { name: "FH Cotizador" })).toBeVisible();
});

test("arma una cotización con descuento y genera el PDF", async ({ page }) => {
  await page.getByRole("searchbox", { name: "Buscar producto" }).fill("farmtrac 6050");
  await page.getByRole("button", { name: /Farmtrac FT 6050/ }).click();
  await page.getByRole("radio", { name: "Entrega inmediata" }).check();
  await page.getByRole("textbox", { name: "Pedile algo" }).fill("5% de descuento");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.getByRole("status")).toContainText("Descuento general 5%");
  const respuesta = page.waitForResponse((r) => r.url().endsWith("/api/pdf"));
  await page.getByRole("button", { name: "Generar PDF" }).click();
  const r = await respuesta;
  expect(r.status()).toBe(200);
  expect(r.headers()["content-type"]).toBe("application/pdf");
  await expect(page.getByRole("button", { name: "Descargar" })).toBeVisible();
});

test("la factura proforma sin cliente no se puede generar", async ({ page }) => {
  await page.getByRole("radio", { name: "Factura proforma" }).check();
  await page.getByRole("searchbox", { name: "Buscar producto" }).fill("retro");
  await page.getByRole("button", { name: /Retroexcavadora LW-6/ }).click();
  await page.getByRole("radio", { name: "Entrega inmediata" }).check();
  await expect(page.getByText("La factura proforma necesita los datos del cliente")).toBeVisible();
  await expect(page.getByRole("button", { name: "Generar PDF" })).toBeDisabled();
});

test("deshacer vuelve atrás el último pedido", async ({ page }) => {
  await page.getByRole("textbox", { name: "Pedile algo" }).fill("validez 15 días");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.getByRole("spinbutton", { name: "Validez (días)" })).toHaveValue("15");
  await page.getByRole("button", { name: "Deshacer" }).click();
  await expect(page.getByRole("spinbutton", { name: "Validez (días)" })).toHaveValue("30");
});
