import { describe, expect, it } from 'vitest';
import {
  toLocalDate as d,
  type Accommodation,
  type Idea,
  type PlannedItem,
  type Stop,
  type Transfer,
  type TripDay,
} from '@ve-que/domain';
import { boundsOf, cityMapModel, locatedPlaces, tripMapModel } from './map-model';

const meta = { tripId: 't', createdAt: '', updatedAt: '', deletedAt: null };
const place = (lat?: number, lng?: number) => ({
  address: '',
  vietnamese: '',
  location: lat === undefined ? null : { lat, lng: lng! },
});

const stop = (
  id: string,
  name: string,
  arrival: string,
  departure: string,
  at?: [number, number],
): Stop =>
  ({
    ...meta,
    id,
    name,
    kind: 'city',
    color: 'indigo',
    arrivalDate: d(arrival),
    departureDate: d(departure),
    place: place(at?.[0], at?.[1]),
    notes: '',
  }) as Stop;

const hcm = stop('hcm', 'Hô Chi Minh-Ville', '2027-07-01', '2027-07-04', [10.77, 106.7]);
const hoian = stop('hoi', 'Hội An', '2027-07-04', '2027-07-08', [15.88, 108.33]);
const hue = stop('hue', 'Huế', '2027-07-08', '2027-07-10');

describe('tripMapModel', () => {
  it('numérote les étapes et relie celles qui ont une position', () => {
    const flight = {
      ...meta,
      id: 'f',
      fromStopId: 'hcm',
      toStopId: 'hoi',
      mode: 'flight',
    } as Transfer;
    const model = tripMapModel([hue, hoian, hcm], [flight]);
    expect(model.places.map((p) => [p.title, p.number])).toEqual([
      ['Hô Chi Minh-Ville', 1],
      ['Hội An', 2],
      ['Huế', 3],
    ]);
    // Huế n'a pas de position : pas de tracé vers elle.
    expect(model.routes.map((route) => route.style)).toEqual(['flight']);
    expect(locatedPlaces(model)).toHaveLength(2);
  });

  it('signale un trajet non saisi entre deux étapes placées', () => {
    expect(tripMapModel([hcm, hoian], []).routes[0]?.style).toBe('missing');
  });
});

describe('cityMapModel', () => {
  const days: TripDay[] = [
    { date: d('2027-07-05'), dayNumber: 5, stopId: 'hoi', isTransition: false },
  ];
  const idea = (id: string, partial: Partial<Idea>): Idea =>
    ({
      ...meta,
      id,
      city: 'Hoi An',
      title: id,
      category: 'culture',
      durationMinutes: 60,
      pricePerPerson: null,
      openingHours: null,
      place: place(15.87, 108.32),
      indoor: false,
      priority: 'nice',
      url: null,
      notes: '',
      ...partial,
    }) as Idea;
  const item = (id: string, partial: Partial<PlannedItem>): PlannedItem =>
    ({
      ...meta,
      id,
      date: d('2027-07-05'),
      time: null,
      position: 0,
      kind: 'activity',
      title: id,
      place: null,
      durationMinutes: null,
      estimatedCost: null,
      status: 'planned',
      notes: '',
      ideaId: null,
      ...partial,
    }) as PlannedItem;

  it('rassemble étape, hébergements, idées et programme de la ville, avec leur statut', () => {
    const lodging = {
      ...meta,
      id: 'h',
      stopId: 'hoi',
      name: 'Hôtel',
      status: 'booked',
      place: place(),
    } as Accommodation;
    const model = cityMapModel('hoi an', {
      stops: [hcm, hoian],
      accommodations: [lodging],
      ideas: [
        idea('Pont japonais', { priority: 'must' }),
        idea('Lanternes', {}),
        idea('Plage', {}),
        idea('Ailleurs', { city: 'Huế' }),
      ],
      items: [
        item('depuis-idée', { ideaId: 'Lanternes' }),
        item('Dîner', { place: place(15.88, 108.33) }),
        item('Libre', { kind: 'free_time' }),
      ],
      days,
    });
    expect(model.places.map((p) => [p.title, p.tone])).toEqual([
      ['Hội An', 'stop'],
      ['Hôtel', 'lodging'],
      ['Pont japonais', 'must'],
      ['Lanternes', 'planned'],
      ['Plage', 'idea'],
      ['Dîner', 'planned'],
    ]);
    expect(model.places.find((p) => p.title === 'Lanternes')?.subtitle).toBe('Prévu J5');
    expect(model.places.find((p) => p.title === 'Hội An')?.number).toBe(2);
  });
});

describe('boundsOf', () => {
  it('englobe les points', () => {
    expect(
      boundsOf([
        { lat: 10, lng: 106 },
        { lat: 16, lng: 108 },
      ]),
    ).toEqual([
      { lat: 10, lng: 106 },
      { lat: 16, lng: 108 },
    ]);
    expect(boundsOf([])).toBeNull();
  });
});
