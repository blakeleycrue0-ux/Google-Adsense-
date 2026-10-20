import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-x grid min-h-[60dvh] place-items-center py-16 text-center">
      <div>
        <p className="kicker text-sea">Error 404</p>
        <h1 className="headline mt-2 text-3xl">Esta página no existe</h1>
        <p className="mt-3 text-ink-2">Puede que la noticia se haya retirado o que el enlace esté mal escrito.</p>
        <Link href="/" className="btn btn-primary mt-6">
          Ir a la portada
        </Link>
      </div>
    </main>
  );
}
