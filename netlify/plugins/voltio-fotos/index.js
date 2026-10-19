// Muestra en el resumen del despliegue el resultado de scripts/fotos.ts.
// Los plugins locales de Netlify se cargan como CommonJS.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readFile } = require("node:fs/promises");

module.exports = {
  onSuccess: async ({ utils }) => {
    try {
      const { summary, lines } = JSON.parse(await readFile(".netlify/voltio-fotos.json", "utf8"));
      utils.status.show({ title: `Fotos: ${summary}`, summary: lines.slice(0, 40).join("\n") || summary });
    } catch {
      utils.status.show({ title: "Fotos: sin informe", summary: "scripts/fotos.ts no generó informe en esta compilación." });
    }
  },
};
