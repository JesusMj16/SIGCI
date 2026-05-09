/*
  Skeleton de carga mientras el Server Component resuelve los datos.
carga en menos de 5 segundos.
 */

export function CalificacionesSkeleton() {
  return (
    <div className="cal-skeleton" aria-busy="true" aria-label="Cargando calificaciones…">
      <div className="cal-skeleton__header">
        <div className="skel skel--title" />
        <div className="skel skel--subtitle" />
      </div>
      <div className="cal-skeleton__controls">
        <div className="skel skel--select" />
        <div className="skel skel--select" />
      </div>
      <div className="cal-skeleton__grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skel skel--card" />
        ))}
      </div>
    </div>
  );
}
