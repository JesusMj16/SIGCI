/**
 * Skeleton CU-04 (no se usa en page actual; queda para futuros loading.tsx).
 */

export function CalificacionesSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando calificaciones…"
      className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8"
    >
      <div className="rounded-3xl bg-card px-6 py-8 sm:px-10 sm:py-10">
        <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
        <div className="mt-4 h-9 w-72 animate-pulse rounded-lg bg-muted" />
        <div className="mt-3 h-4 w-48 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 sm:flex-row">
        <div className="h-10 w-56 animate-pulse rounded-md bg-muted" />
        <div className="h-10 w-44 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-44 animate-pulse rounded-2xl bg-card"
          />
        ))}
      </div>
    </div>
  );
}
