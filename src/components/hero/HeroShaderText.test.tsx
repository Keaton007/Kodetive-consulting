import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { HeroShaderText } from './HeroShaderText';
import { ScrollProvider } from '@/components/interactions/ScrollProvider';

describe('HeroShaderText', () => {
  it('renders an accessible H1 with name and title for screen readers', () => {
    render(
      <ScrollProvider>
        <HeroShaderText name="Keaton Jones" title="Software Engineer" />
      </ScrollProvider>
    );
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Keaton Jones');
    expect(h1).toHaveTextContent('Software Engineer');
  });
});
