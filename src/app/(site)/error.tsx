"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-start justify-center py-20">
      <p className="kicker text-muted">Algo ha fallado</p>
      <h1 className="headline mt-4 text-[40px] sm:text-[56px]">No hemos podido cargar esta página</h1>
      <p className="mt-4 max-w-lg text-[17px] text-muted">Ha ocurrido un error temporal. Vuelve a intentarlo en unos segundos.</p>
      {error.digest && <p className="mt-2 font-mono text-[12px] text-faint">Referencia: {error.digest}</p>}
      <div className="mt-8 flex gap-2">
        <button type="button" onClick={reset} className="btn-primary">
          Reintentar
        </button>
        <Link href="/" className="btn-secondary">
          Portada
        </Link>
      </div>
    </div>
  );
}
