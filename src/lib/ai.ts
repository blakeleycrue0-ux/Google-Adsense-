import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Asistente opcional de redacción. Solo se activa con ANTHROPIC_API_KEY.
 * Trabaja exclusivamente con el titular y el extracto público del feed (no
 * con el artículo completo de otro medio) y produce un BORRADOR que siempre
 * requiere revisión y verificación humana antes de publicarse.
 */
export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

const SYSTEM = `Eres editor de un medio tecnológico en español de España. Preparas borradores internos que un periodista revisará, verificará y reescribirá antes de publicar.
Reglas:
- Usa solo la información del titular y del extracto proporcionados. No inventes datos, cifras, fechas, declaraciones ni citas.
- Si falta información, escribe «[VERIFICAR: …]» indicando qué hay que comprobar en la fuente original.
- No copies frases del extracto: redacta con palabras propias.
- Tono informativo y sobrio, sin sensacionalismo.
- Devuelve Markdown con: una entradilla de 2-3 frases; «## Qué se sabe»; «## Por qué importa»; «## Qué falta por confirmar».`;

export async function draftFromItem(input: { title: string; snippet: string; source: string; url: string }) {
  if (!aiEnabled()) throw new Error("El asistente de IA no está configurado (falta ANTHROPIC_API_KEY).");
  const client = new Anthropic();
  const response = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium" },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Fuente: ${input.source}\nURL: ${input.url}\nTitular: ${input.title}\nExtracto del feed: ${input.snippet || "(sin extracto)"}`,
      },
    ],
  });
  if (response.stop_reason === "refusal") throw new Error("El asistente no ha generado un borrador para este elemento.");
  const text = response.content
    .flatMap((b) => (b.type === "text" ? [b.text] : []))
    .join("\n")
    .trim();
  if (!text) throw new Error("El asistente no ha devuelto texto.");
  return text;
}
