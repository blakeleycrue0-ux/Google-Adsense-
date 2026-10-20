import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

/**
 * Asistente de redacción. Solo se activa con ANTHROPIC_API_KEY. Convierte las
 * notas de quien escribe (o una nota de prensa oficial) en un BORRADOR que
 * siempre se revisa antes de publicar. Nunca publica nada por sí mismo.
 *
 * Sin «server-only» porque también lo usa netlify/functions/ai-draft-background
 * (fuera de Next.js). Solo lo importa código de servidor: la clave nunca llega al navegador.
 */
export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

const SYSTEM = `Eres redactor de un diario digital local de las Islas Baleares, en español de España. Conviertes las notas o la nota de prensa que te pasan en una noticia lista para que la persona que edita la revise.
Reglas:
- Usa solo la información proporcionada. No inventes nombres, cifras, horas, lugares, declaraciones ni citas.
- Si falta un dato importante (hora, lugar exacto, fuente), escribe «[VERIFICAR: …]» en el texto.
- Si el material es una nota de prensa, reescríbela con palabras propias y atribuye la información a quien la emite («según ha informado…»).
- Estructura de pirámide invertida: lo más importante primero. Tono informativo, claro y sobrio, sin sensacionalismo ni adjetivos de más.
- En sucesos, no identifiques a víctimas ni a menores y usa «presunto» cuando no haya condena.
- Titular: máximo 110 caracteres, concreto, con el lugar si es relevante, sin clickbait.
- Entradilla: 1-2 frases (máximo 250 caracteres) que resuman qué, quién, dónde y cuándo.
- Cuerpo: 3-7 párrafos en Markdown. Puedes usar algún subtítulo «## …» si la noticia es larga. No repitas el titular.`;

const Draft = z.object({
  title: z.string(),
  summary: z.string(),
  body: z.string(),
});
export type Draft = z.infer<typeof Draft>;

export async function draftArticle(input: { notes: string; island: string; section: string }): Promise<Draft> {
  if (!aiEnabled()) throw new Error("El asistente de IA no está configurado (falta ANTHROPIC_API_KEY en Netlify).");
  const client = new Anthropic();
  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(Draft) },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Isla: ${input.island}\nSección: ${input.section}\n\nNotas / material de partida:\n${input.notes}`,
      },
    ],
  });
  if (response.stop_reason === "refusal") throw new Error("El asistente no ha querido redactar este texto. Escríbelo a mano.");
  if (response.stop_reason === "max_tokens") throw new Error("El material es demasiado largo. Recórtalo un poco y vuelve a probar.");
  if (!response.parsed_output) throw new Error("El asistente no ha devuelto un borrador válido. Vuelve a intentarlo.");
  return response.parsed_output;
}
