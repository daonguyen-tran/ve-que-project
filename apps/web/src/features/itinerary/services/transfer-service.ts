import {
  createEntity,
  transferSchema,
  updateEntity,
  validateTransfer,
  type BookingStatus,
  type LocalDate,
  type Money,
  type Transfer,
  type TransferIssue,
  type TransferMode,
  type Trip,
} from '@ve-que/domain';
import type { Repositories } from '@/infrastructure/repositories';

export interface TransferInput {
  fromStopId: string;
  toStopId: string;
  mode: TransferMode;
  departDate: LocalDate;
  departTime: string | null;
  arriveDate: LocalDate;
  arriveTime: string | null;
  price: Money | null;
  status: BookingStatus;
  bookingRef: string;
  notes: string;
}

export class TransferError extends Error {
  constructor(readonly issues: TransferIssue[]) {
    super(`Trajet invalide : ${issues.map((issue) => issue.code).join(', ')}`);
    this.name = 'TransferError';
  }
}

/** Cas d'usage des trajets entre étapes (F-2.3). */
export class TransferService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async create(trip: Trip, input: TransferInput): Promise<Transfer> {
    this.assertValid(trip, input);
    const transfer = transferSchema.parse(
      createEntity<Transfer>({ tripId: trip.id, ...this.fields(input) }, this.clock()),
    );
    await this.repositories.transfers.save(transfer);
    return transfer;
  }

  async update(trip: Trip, transfer: Transfer, input: TransferInput): Promise<Transfer> {
    this.assertValid(trip, input);
    const updated = transferSchema.parse(updateEntity(transfer, this.fields(input), this.clock()));
    await this.repositories.transfers.save(updated);
    return updated;
  }

  async remove(transfer: Transfer): Promise<void> {
    await this.repositories.transfers.remove(transfer.id);
  }

  private assertValid(trip: Trip, input: TransferInput) {
    const issues = validateTransfer(input, trip);
    if (issues.length > 0) throw new TransferError(issues);
  }

  private fields(input: TransferInput) {
    return { ...input, bookingRef: input.bookingRef.trim(), notes: input.notes.trim() };
  }
}
