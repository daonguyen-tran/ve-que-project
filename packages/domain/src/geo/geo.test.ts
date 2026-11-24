import { describe, expect, it } from 'vitest';
import { formatLocation, googleMapsUrl, parseLocation } from './geo';

const ok = (lat: number, lng: number) => ({ ok: true, value: { lat, lng } });

describe('parseLocation', () => {
  it('lit des coordonnées décimales, avec ou sans virgule', () => {
    expect(parseLocation('15.8801, 108.338')).toEqual(ok(15.8801, 108.338));
    expect(parseLocation(' 15.8801 108.338 ')).toEqual(ok(15.8801, 108.338));
    expect(parseLocation('10.7769;106.7009')).toEqual(ok(10.7769, 106.7009));
  });

  it('accepte la virgule décimale française', () => {
    expect(parseLocation('15,8801 ; 108,338')).toEqual(ok(15.8801, 108.338));
    expect(parseLocation('15,8801 108,338')).toEqual(ok(15.8801, 108.338));
  });

  it('lit la position dans les liens Google Maps et OpenStreetMap', () => {
    expect(
      parseLocation(
        'https://www.google.com/maps/place/Ch%C3%B9a+C%E1%BA%A7u/@15.8770,108.3260,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d15.877064!4d108.326083',
      ),
    ).toEqual(ok(15.877064, 108.326083));
    expect(parseLocation('https://www.google.com/maps/@10.7769,106.7009,15z')).toEqual(
      ok(10.7769, 106.7009),
    );
    expect(parseLocation('https://maps.google.com/?q=16.0544,108.2022')).toEqual(
      ok(16.0544, 108.2022),
    );
    expect(parseLocation('geo:0,0?q=21.0285,105.8542')).toEqual(ok(21.0285, 105.8542));
  });

  it('signale les liens courts et le reste', () => {
    expect(parseLocation('https://maps.app.goo.gl/AbC123')).toEqual({
      ok: false,
      reason: 'short_link',
    });
    expect(parseLocation('')).toEqual({ ok: false, reason: 'empty' });
    expect(parseLocation('Hội An')).toEqual({ ok: false, reason: 'invalid' });
    expect(parseLocation('95, 108')).toEqual({ ok: false, reason: 'invalid' });
  });
});

describe('formatLocation et googleMapsUrl', () => {
  it('formate une position à cinq décimales', () => {
    expect(formatLocation({ lat: 15.8801, lng: 108.338 })).toBe('15.88010, 108.33800');
  });

  it('préfère la position, puis l’adresse vietnamienne, puis le nom', () => {
    const base = { address: '12 Tran Phu', vietnamese: '12 Trần Phú', location: null };
    expect(googleMapsUrl({ ...base, location: { lat: 15.88, lng: 108.33 } })).toBe(
      'https://www.google.com/maps/search/?api=1&query=15.88%2C108.33',
    );
    expect(googleMapsUrl(base)).toContain(encodeURIComponent('12 Trần Phú'));
    expect(googleMapsUrl(null, 'Hội An')).toContain(encodeURIComponent('Hội An'));
    expect(googleMapsUrl(null)).toBeNull();
  });
});
