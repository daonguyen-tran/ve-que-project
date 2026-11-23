import {
  Bike,
  Bus,
  BusFront,
  Car,
  Plane,
  Route,
  Ship,
  TrainFront,
  type LucideIcon,
} from 'lucide-react';
import type { BookingStatus, TransferMode } from '@ve-que/domain';
import { t } from '@/shared/i18n';

export const TRANSFER_MODE_ICON: Record<TransferMode, LucideIcon> = {
  flight: Plane,
  train: TrainFront,
  bus: Bus,
  sleeper_bus: BusFront,
  car: Car,
  boat: Ship,
  motorbike: Bike,
  other: Route,
};

export const TRANSFER_MODE_OPTIONS = (Object.keys(TRANSFER_MODE_ICON) as TransferMode[]).map(
  (mode) => ({
    value: mode,
    label: t.transfers.modes[mode],
    icon: TRANSFER_MODE_ICON[mode],
  }),
);

export const BOOKING_STATUS_OPTIONS: ReadonlyArray<{ value: BookingStatus; label: string }> = [
  { value: 'considered', label: t.booking.considered },
  { value: 'booked', label: t.booking.booked },
  { value: 'cancelled', label: t.booking.cancelled },
];
