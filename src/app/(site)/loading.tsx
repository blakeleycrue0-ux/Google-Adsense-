export default function Loading() {
  return (
    <div className="container-x pt-10" aria-busy="true" aria-label="Cargando">
      <div className="h-4 w-24 animate-pulse rounded-xs bg-surface" />
      <div className="mt-4 h-12 w-3/4 animate-pulse rounded-xs bg-surface" />
      <div className="mt-3 h-5 w-1/2 animate-pulse rounded-xs bg-surface" />
      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <div className="aspect-[3/2] animate-pulse rounded-sm bg-surface lg:col-span-7" />
        <div className="space-y-4 lg:col-span-5">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-sm bg-surface" />
          ))}
        </div>
      </div>
    </div>
  );
}
