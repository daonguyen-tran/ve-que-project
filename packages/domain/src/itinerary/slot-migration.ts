/*
 * Migration « sans créneaux » (ADR 0007).
 *
 * Jusqu'ici, un élément du programme portait un créneau (`slot` : matin, après-midi, soir) et
 * un rang (`position`) **dans ce créneau**. Désormais il n'y a plus de créneau : les éléments
 * avec une heure se trient par heure, ceux sans heure par `position`, rang **dans la journée**.
 *
 * Pour qu'un ancien programme garde son ordre, on renumérote chaque journée en suivant
 * l'ancien ordre d'affichage (matin, puis après-midi, puis soir ; puis rang ; puis ancienneté),
 * et on retire le champ `slot`. Utilisé par la base locale (Dexie, version 3) et par l'import
 * des sauvegardes au format 1.
 *
 * La fonction travaille sur des objets bruts (non validés) : elle ne garde que ce qu'elle
 * comprend et laisse le reste intact, la validation Zod passe après.
 */

const LEGACY_SLOT_ORDER: Record<string, number> = { morning: 0, afternoon: 1, evening: 2 };

type LegacyItem = Record<string, unknown>;

function legacyKey(item: LegacyItem): [number, number, string, string] {
  return [
    LEGACY_SLOT_ORDER[String(item.slot)] ?? 0,
    typeof item.position === 'number' ? item.position : 0,
    String(item.createdAt ?? ''),
    String(item.id ?? ''),
  ];
}

function compareLegacy(a: LegacyItem, b: LegacyItem): number {
  const [sa, pa, ca, ia] = legacyKey(a);
  const [sb, pb, cb, ib] = legacyKey(b);
  return sa - sb || pa - pb || ca.localeCompare(cb) || ia.localeCompare(ib);
}

/** Renvoie les éléments sans `slot`, avec un rang dense (0, 1, 2…) par voyage et par jour. */
export function dropLegacySlots<T extends LegacyItem>(items: readonly T[]): Array<Omit<T, 'slot'>> {
  const byDay = new Map<string, T[]>();
  for (const item of items) {
    const key = `${String(item.tripId)}|${String(item.date)}`;
    const list = byDay.get(key);
    if (list) list.push(item);
    else byDay.set(key, [item]);
  }
  const positions = new Map<T, number>();
  for (const list of byDay.values()) {
    [...list].sort(compareLegacy).forEach((item, index) => positions.set(item, index));
  }
  return items.map((item) => {
    const rest: Record<string, unknown> = { ...item, position: positions.get(item) ?? 0 };
    delete rest.slot;
    return rest as Omit<T, 'slot'>;
  });
}
