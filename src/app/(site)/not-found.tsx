import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-start justify-center py-20">
      <p className="kicker text-muted">Error 404</p>
      <h1 className="headline mt-4 text-[44px] sm:text-[64px]">Esta página no existe 👀</h1>
      <p className="mt-4 max-w-lg text-[17px] text-muted">
        Puede que el enlace esté mal escrito o que el contenido se haya movido. Prueba a buscarlo o vuelve a la portada.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/" className="btn-primary">
          Ir a la portada
        </Link>
        <Link href="/buscar" className="btn-secondary">
          Buscar
        </Link>
      </div>
    </div>
  );
}
