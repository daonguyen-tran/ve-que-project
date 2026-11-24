import L from 'leaflet';
import { BedDouble, CalendarCheck, type LucideIcon } from 'lucide-react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { ideaCategorySchema, type IdeaCategory } from '@ve-que/domain';
import { CATEGORY_ICON } from '@/features/ideas/idea-style';
import type { MapPlace } from '../map-model';

/*
 * Icônes des repères. Leaflet attend du HTML (L.divIcon) : on y met les icônes Lucide sous
 * forme de SVG. Plutôt que d'embarquer `react-dom/server` (lourd) pour les convertir, on les
 * rend une fois, au chargement du module, dans un élément détaché, et on garde le HTML obtenu.
 */
function svgOf(Icon: LucideIcon): string {
  const container = document.createElement('div');
  const root = createRoot(container);
  flushSync(() => root.render(<Icon strokeWidth={2.2} aria-hidden="true" />));
  const html = container.innerHTML;
  root.unmount();
  return html;
}

const CATEGORY_SVG = Object.fromEntries(
  ideaCategorySchema.options.map((category) => [category, svgOf(CATEGORY_ICON[category])]),
) as Record<IdeaCategory, string>;
const LODGING_SVG = svgOf(BedDouble);
const PLANNED_SVG = svgOf(CalendarCheck);

/** Icônes déjà construites, par apparence : le même HTML sert à tous les repères identiques. */
const cache = new Map<string, L.DivIcon>();

function glyph(place: MapPlace): string {
  if (place.tone === 'stop') return String(place.number ?? '');
  if (place.tone === 'lodging') return LODGING_SVG;
  return place.category ? CATEGORY_SVG[place.category] : PLANNED_SVG;
}

export function markerIcon(place: MapPlace, focused: boolean): L.DivIcon {
  const key = [place.tone, place.number, place.stopColor, place.category, focused].join('|');
  const cached = cache.get(key);
  if (cached) return cached;
  const size = place.tone === 'stop' ? 32 : 28;
  const style = place.stopColor ? ` style="--pin: var(--color-stop-${place.stopColor})"` : '';
  const icon = L.divIcon({
    className: '',
    html: `<span class="vq-marker vq-marker--${place.tone}${focused ? ' vq-marker--focused' : ''}"${style}>${glyph(place)}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
  cache.set(key, icon);
  return icon;
}

/** Goutte du sélecteur de position : sa pointe (en bas à gauche, tournée) touche le lieu. */
export const pickIcon = L.divIcon({
  className: '',
  html: '<span class="vq-pick" style="display:block"></span>',
  iconSize: [30, 30],
  iconAnchor: [15, 36],
});
