import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ScrollProvider, useScrollProgress } from './ScrollProvider';

function Probe() {
  const progress = useScrollProgress();
  return <span data-testid="probe">{typeof progress.get}</span>;
}

describe('ScrollProvider', () => {
  it('exposes a MotionValue via useScrollProgress', () => {
    const { getByTestId } = render(<ScrollProvider><Probe /></ScrollProvider>);
    expect(getByTestId('probe').textContent).toBe('function');
  });
});
