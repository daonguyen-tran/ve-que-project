import { zodResolver } from '@hookform/resolvers/zod';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm, useWatch } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { formatLocation } from '@ve-que/domain';
import { locationFieldSchema, locationFromField } from '../location-field';
import { LocationField } from './LocationField';

const schema = z.object({ location: locationFieldSchema });

function Form({ onSave }: { onSave: (value: unknown) => void }) {
  const { register, control, setValue, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { location: '' },
    mode: 'onChange',
  });
  const value = useWatch({ control, name: 'location' });
  return (
    <form onSubmit={handleSubmit((values) => onSave(locationFromField(values.location)))}>
      <LocationField
        value={value}
        error={formState.errors.location?.message}
        inputProps={register('location')}
        onPick={(point) => setValue('location', formatLocation(point))}
      />
      <button type="submit">Enregistrer</button>
    </form>
  );
}

describe('LocationField', () => {
  it('accepte un lien Google Maps collé et propose de l’ouvrir', async () => {
    let saved: unknown;
    render(<Form onSave={(value) => (saved = value)} />);
    fireEvent.change(screen.getByLabelText(/Position sur la carte/), {
      target: { value: 'https://www.google.com/maps/@15.877,108.326,17z' },
    });
    expect(await screen.findByRole('link', { name: /Ouvrir dans Google Maps/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(saved).toEqual({ lat: 15.877, lng: 108.326 }));
  });

  it('explique pourquoi un lien court ne suffit pas', async () => {
    render(<Form onSave={() => {}} />);
    fireEvent.change(screen.getByLabelText(/Position sur la carte/), {
      target: { value: 'https://maps.app.goo.gl/xyz' },
    });
    expect(await screen.findByText(/liens courts/)).toBeTruthy();
  });
});
