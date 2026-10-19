import "server-only";
import { revalidatePath } from "next/cache";

/** Tras cualquier cambio editorial, invalida la caché de todo el sitio público. */
export function revalidateSite() {
  revalidatePath("/", "layout");
}
