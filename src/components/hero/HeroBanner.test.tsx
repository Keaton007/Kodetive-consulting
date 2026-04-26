import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { HeroBanner } from './HeroBanner';
import { CORE, PLATFORM } from '@/components/skills/skills';
import { mockMatchMedia } from '@/test/matchMedia';

describe('HeroBanner', () => {
  describe('reduced-motion mode', () => {
    beforeEach(() => mockMatchMedia(true));

    it('renders every declared skill', () => {
      render(<HeroBanner />);
      for (const s of [...CORE, ...PLATFORM]) {
        expect(screen.getAllByText(s.label).length).toBeGreaterThan(0);
      }
    });

    it('renders skills as a static list (no marquee duplication)', () => {
      render(<HeroBanner />);
      const total = [...CORE, ...PLATFORM];
      // In reduced-motion mode, each label appears exactly once.
      for (const s of total) {
        expect(screen.getAllByText(s.label).length).toBe(1);
      }
    });
  });

  describe('full-motion mode', () => {
    beforeEach(() => mockMatchMedia(false));

    it('renders skills tripled (for marquee seamlessness)', () => {
      render(<HeroBanner />);
      // The marquee triples its content so the wrap-around is invisible.
      // Every label should appear exactly 3 times.
      for (const s of [...CORE, ...PLATFORM]) {
        expect(screen.getAllByText(s.label).length).toBe(3);
      }
    });
  });
});
