// Muestra en el resumen del despliegue el resultado de scripts/fotos.ts.
// Los plugins locales de Netlify se cargan como CommonJS.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readFile } = require("node:fs/promises");

module.exports = {
  onSuccess: async ({ utils }) => {
    try {
      const { summary, lines } = JSON.parse(await readFile(".netlify/voltio-fotos.json", "utf8"));
      utils.status.show({ title: `Fotos: ${summary}`, summary: lines.slice(0, 40).join("\n") || summary });
      // Copia del informe en los registros de peticiones del sitio (consultables sin acceso al registro de compilación).
      const base = process.env.URL;
      if (base) {
        for (const [i, line] of [summary, ...lines.slice(0, 40)].entries()) {
          await fetch(`${base}/__informe-fotos?n=${i}&l=${encodeURIComponent(line.slice(0, 400))}`).catch(() => undefined);
        }
      }
    } catch {
      utils.status.show({ title: "Fotos: sin informe", summary: "scripts/fotos.ts no generó informe en esta compilación." });
    }
  },
};
