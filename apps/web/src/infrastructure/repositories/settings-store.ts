import type { VeQueDatabase } from '../db/database';

/** Clés connues des réglages : les centraliser évite les fautes de frappe dispersées. */
export const SETTING_KEYS = {
  /** Voyage choisi explicitement par l'utilisateur (sinon, choix automatique). */
  activeTripId: 'activeTripId',
  /** Date (ISO) du dernier export : sert au rappel de sauvegarde (F-15.4). */
  lastExportAt: 'lastExportAt',
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

/**
 * Petit magasin clé/valeur pour les réglages de l'appareil (table `keyValues`).
 * Ces données sont propres à un appareil et ne sont pas synchronisées.
 */
export interface SettingsStore {
  get<T>(key: SettingKey): Promise<T | undefined>;
  set<T>(key: SettingKey, value: T): Promise<void>;
  remove(key: SettingKey): Promise<void>;
}

export function createSettingsStore(db: VeQueDatabase): SettingsStore {
  return {
    async get<T>(key: SettingKey) {
      return (await db.keyValues.get(key))?.value as T | undefined;
    },
    async set<T>(key: SettingKey, value: T) {
      await db.keyValues.put({ key, value, updatedAt: new Date().toISOString() });
    },
    async remove(key: SettingKey) {
      await db.keyValues.delete(key);
    },
  };
}
