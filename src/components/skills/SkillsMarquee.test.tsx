import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { SkillsMarquee } from './SkillsMarquee';
import { CORE, PLATFORM } from './skills';
import { mockMatchMedia } from '@/test/matchMedia';

describe('SkillsMarquee', () => {
  beforeEach(() => mockMatchMedia(true));
  it('renders every declared skill in reduced-motion mode', () => {
    render(<SkillsMarquee />);
    for (const s of [...CORE, ...PLATFORM]) {
      expect(screen.getAllByText(s.label).length).toBeGreaterThan(0);
    }
  });
});
