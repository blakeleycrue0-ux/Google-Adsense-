import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

// Las fotos guardadas en Supabase se sirven desde su dominio y pasan por el optimizador de imágenes.
const supabaseHost = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : undefined;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseHost ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/media/**" }] : [],
  },
  experimental: {
    // Las fotos se reducen en el navegador antes de subirlas; esto es margen.
    serverActions: { bodySizeLimit: "5mb" },
  },
  // URLs de la etapa anterior (diario de noticias): se mandan a la portada o a su equivalente.
  async redirects() {
    return [
      { source: "/noticia/:slug*", destination: "/", permanent: true },
      { source: "/isla/:slug*", destination: "/", permanent: true },
      { source: "/seccion/:slug*", destination: "/", permanent: true },
      { source: "/ultima-hora", destination: "/recetas", permanent: true },
      { source: "/news-sitemap.xml", destination: "/sitemap.xml", permanent: true },
      { source: "/quienes-somos", destination: "/sobre-mi", permanent: true },
      { source: "/normas-editoriales", destination: "/sobre-mi", permanent: true },
      { source: "/admin/noticia/:id", destination: "/admin/receta/:id", permanent: false },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
