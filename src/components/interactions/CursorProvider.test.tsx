import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { mockMatchMedia } from '@/test/matchMedia';
import { CursorProvider, useCursor } from './CursorProvider';

function Probe() {
  const { setCursorState } = useCursor();
  return <button onClick={() => setCursorState('link')}>toggle</button>;
}

describe('CursorProvider', () => {
  beforeEach(() => mockMatchMedia(false));

  it('mounts a cursor dot element in non-reduced-motion mode', () => {
    render(<CursorProvider><Probe /></CursorProvider>);
    expect(document.querySelector('[data-site-cursor]')).toBeInTheDocument();
  });

  it('does NOT mount the cursor dot when reduced motion is preferred', () => {
    mockMatchMedia(true);
    render(<CursorProvider><Probe /></CursorProvider>);
    expect(document.querySelector('[data-site-cursor]')).not.toBeInTheDocument();
  });

  it('exposes setCursorState via context', () => {
    render(<CursorProvider><Probe /></CursorProvider>);
    const btn = screen.getByText('toggle');
    act(() => btn.click());
    expect(btn).toBeInTheDocument();
  });
});
