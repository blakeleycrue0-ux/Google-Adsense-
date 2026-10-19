/** Aviso visible mientras el sitio funciona con contenido de demostración. */
export function DemoNotice() {
  return (
    <div className="border-b border-line bg-surface">
      <p className="container-x py-2 text-center text-[12px] leading-snug text-muted">
        <span className="kicker mr-2 text-ink">Demo</span>
        Sitio en preparación: artículos, precios y ofertas son contenido de demostración pendiente de verificación.
      </p>
    </div>
  );
}
