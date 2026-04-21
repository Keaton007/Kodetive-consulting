import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { mockMatchMedia } from '@/test/matchMedia';
import { RevealOnView } from './RevealOnView';

describe('RevealOnView', () => {
  beforeEach(() => mockMatchMedia(false));

  it('renders children', () => {
    render(<RevealOnView><p>hello</p></RevealOnView>);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('adds data-reduced-motion="true" when user prefers reduced motion', () => {
    mockMatchMedia(true);
    render(<RevealOnView><p>hello</p></RevealOnView>);
    const wrapper = screen.getByText('hello').parentElement!;
    expect(wrapper.getAttribute('data-reduced-motion')).toBe('true');
  });
});
