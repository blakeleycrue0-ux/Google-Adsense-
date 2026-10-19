import "server-only";
import { db } from "@/lib/db";
import { madridDayKey } from "@/lib/format";

export function lastDays(n: number) {
  return Array.from({ length: n }, (_, i) => madridDayKey(new Date(Date.now() - (n - 1 - i) * 86400_000)));
}

/** Series diarias y totales por elemento a partir de los contadores internos. */
async function series(prefix: "views" | "clicks", days: number) {
  const counters = await db().counters(`${prefix}:`);
  const keys = lastDays(days);
  const perDay = new Map(keys.map((k) => [k, 0]));
  const perItem = new Map<string, number>();
  const totals = new Map<string, number>();
  for (const [key, value] of Object.entries(counters)) {
    const parts = key.split(":");
    if (parts[1] === "d" && perDay.has(parts[2])) {
      perDay.set(parts[2], perDay.get(parts[2])! + value);
      perItem.set(parts[3], (perItem.get(parts[3]) ?? 0) + value);
    } else if (parts[1] === "total") {
      totals.set(parts[2], value);
    }
  }
  return { perDay: [...perDay.entries()].map(([day, value]) => ({ day, value })), perItem, totals };
}

export const viewStats = (days = 30) => series("views", days);
export const clickStats = (days = 30) => series("clicks", days);
