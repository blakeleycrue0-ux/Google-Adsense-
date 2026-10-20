import { NextResponse, type NextRequest } from "next/server";

/**
 * Filtro rápido: sin cookie de sesión no se entra al panel. La verificación
 * real (firma y caducidad) se hace en el servidor en cada página y acción.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && !req.cookies.has("nb_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
