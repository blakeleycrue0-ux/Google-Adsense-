import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="kicker text-muted">Error 404</p>
      <h1 className="headline mt-4 text-[44px]">Página no encontrada</h1>
      <Link href="/" className="btn-primary mt-8">
        Ir a la portada
      </Link>
    </div>
  );
}
