export default async function Acceso({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold text-marino">FH Cotizador</h1>
      <p className="text-texto-suave">
        Abrí el link de acceso que te mandaron por WhatsApp, o escribí la clave del equipo.
      </p>
      <form method="post" action="/api/acceso" className="flex flex-col gap-3">
        <label htmlFor="clave" className="font-medium">
          Clave del equipo
        </label>
        <input
          id="clave"
          name="clave"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-lg border border-borde bg-superficie px-3 py-3 text-base"
        />
        {error ? (
          <p role="alert" className="text-error">
            La clave no es correcta.
          </p>
        ) : null}
        <button type="submit" className="rounded-lg bg-marino px-4 py-3 font-semibold text-white">
          Entrar
        </button>
      </form>
    </main>
  );
}
