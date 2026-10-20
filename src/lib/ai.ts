import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

/**
 * Asistente de redacción. Solo se activa con ANTHROPIC_API_KEY. Convierte las
 * notas de una receta en un BORRADOR ordenado que siempre se revisa antes de
 * publicar. Nunca publica nada por sí mismo.
 *
 * Sin «server-only» porque también lo usa netlify/functions/ai-draft-background
 * (fuera de Next.js). Solo lo importa código de servidor: la clave nunca llega al navegador.
 */
export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

const SYSTEM = `Eres un cocinero profesional que ayuda a pasar a limpio recetas para una web de cocina en español de España. Recibes las notas de quien cocina (apuntes de clase de FP de cocina, una lista rápida, una receta dictada) y devuelves la receta ordenada para que la revise antes de publicarla.
Reglas:
- Usa solo lo que dicen las notas. No inventes ingredientes, cantidades, temperaturas ni tiempos. Si falta un dato importante, escríbelo como «[REVISAR: …]» en el lugar donde iría.
- Ingredientes: uno por elemento, con cantidad y unidad delante cuando la haya («200 g de harina de trigo»). Si hay elaboraciones separadas, añade subtítulos como elemento propio empezando por «# » («# Para la salsa»).
- Pasos: uno por elemento, en orden, en imperativo y con detalles útiles (fuego, punto, textura). Sin numerar.
- Presentación: 1-2 frases que describan el plato y lo que lo hace especial, sin exageraciones.
- Consejos: variantes, trucos, conservación o técnica (Markdown breve). Vacío si las notas no dan para ello.
- Tiempos en minutos (0 si no se sabe). Raciones como texto («4 personas»), vacío si no se sabe.
- Usa vocabulario técnico de cocina correcto (sofrito, reducir, napar, ligar, pochar…) cuando corresponda.`;

const Draft = z.object({
  title: z.string(),
  summary: z.string(),
  ingredients: z.array(z.string()),
  steps: z.array(z.string()),
  tips: z.string(),
  prepMinutes: z.number().int(),
  cookMinutes: z.number().int(),
  servings: z.string(),
});
export type Draft = z.infer<typeof Draft>;

export async function draftRecipe(input: { notes: string; category: string }): Promise<Draft> {
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
        content: `Categoría: ${input.category}\n\nNotas de la receta:\n${input.notes}`,
      },
    ],
  });
  if (response.stop_reason === "refusal") throw new Error("El asistente no ha querido redactar este texto. Escríbelo a mano.");
  if (response.stop_reason === "max_tokens") throw new Error("El material es demasiado largo. Recórtalo un poco y vuelve a probar.");
  if (!response.parsed_output) throw new Error("El asistente no ha devuelto un borrador válido. Vuelve a intentarlo.");
  return response.parsed_output;
}
