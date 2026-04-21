import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WorkSection } from './WorkSection';
import { CursorProvider } from '@/components/interactions/CursorProvider';
import { PROJECTS } from './projects';

describe('WorkSection', () => {
  it('renders every project as a link to /work/[slug]', () => {
    render(<CursorProvider><WorkSection /></CursorProvider>);
    for (const p of PROJECTS) {
      const link = screen.getByRole('link', { name: new RegExp(p.title, 'i') });
      expect(link).toHaveAttribute('href', `/work/${p.slug}`);
    }
  });
});
