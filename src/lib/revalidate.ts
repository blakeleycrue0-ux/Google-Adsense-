import "server-only";
import { revalidatePath } from "next/cache";

/** Tras cualquier cambio en el panel, invalida la caché de toda la web pública. */
export function revalidateSite() {
  revalidatePath("/", "layout");
}
